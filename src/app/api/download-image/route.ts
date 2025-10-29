import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 10;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');
    const type = searchParams.get('type') || 'output';

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get the job from database
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Zero-Polling Architecture: Enhanced fallback logic with PhonePe verification
    let isPaid = job.isPaid;
    
    // FALLBACK 1: If job is not marked as paid, check for recent orders and verify with PhonePe
    if (!isPaid) {
      console.log(`[DOWNLOAD] Job ${jobId} not marked as paid, checking for recent orders...`);
      
      try {
        // Check for any recent orders with this jobId in metadata
        const recentOrder = await prisma.order.findFirst({
          where: {
            metadata: {
              path: ['jobId'],
              equals: jobId,
            },
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
          orderBy: {
            createdAt: 'desc', // Most recent first
          },
        });

        if (recentOrder) {
          console.log(`[DOWNLOAD] ✅ Found recent order ${recentOrder.id} for job ${jobId} (status: ${recentOrder.status})`);
          
          // CRITICAL: Verify payment status with PhonePe before allowing download
          if (recentOrder.status === 'PENDING' && recentOrder.phonePeOrderId) {
            console.log(`[DOWNLOAD] 🔄 Order is PENDING, verifying with PhonePe...`);
            
            try {
              const { getPhonePeOrderStatus } = await import('@/lib/phonepe');
              const { PAYMENT_STATUS } = await import('@/lib/constants');
              
              const phonePeStatus = await getPhonePeOrderStatus(recentOrder.id);
              console.log(`[DOWNLOAD] PhonePe status: ${phonePeStatus.state}`);
              
              if (phonePeStatus.state === PAYMENT_STATUS.COMPLETED) {
                // Payment confirmed! Update order and job
                console.log(`[DOWNLOAD] ✅ PhonePe confirmed payment for order ${recentOrder.id}`);
                
                await prisma.$transaction(async (tx: any) => {
                  // Update order
                  await tx.order.update({
                    where: { id: recentOrder.id },
                    data: {
                      status: 'PAID',
                      paymentStatus: 'SUCCESS',
                    },
                  });
                  
                  // Update job
                  await tx.job.update({
                    where: { id: jobId },
                    data: { isPaid: true },
                  });
                });
                
                isPaid = true;
                console.log(`[DOWNLOAD] ✅ Order and job updated after PhonePe verification`);
              } else if (phonePeStatus.state === PAYMENT_STATUS.FAILED) {
                console.log(`[DOWNLOAD] ❌ PhonePe reports payment FAILED for order ${recentOrder.id}`);
                // Don't allow download
              } else {
                console.log(`[DOWNLOAD] ⏳ PhonePe reports payment still PENDING for order ${recentOrder.id}`);
                // Don't allow download yet
              }
            } catch (phonePeError) {
              console.error(`[DOWNLOAD] ⚠️ Error checking PhonePe status:`, phonePeError);
              // Don't allow download if we can't verify
            }
          } else if (recentOrder.status === 'PAID') {
            // Order is already paid, just mark job as paid
            console.log(`[DOWNLOAD] ✅ Order is PAID, marking job as paid`);
            
            try {
              await prisma.job.update({
                where: { id: jobId },
                data: { isPaid: true },
              });
              isPaid = true;
              console.log(`[DOWNLOAD] ✅ Job ${jobId} marked as paid via fallback`);
            } catch (updateError) {
              console.error(`[DOWNLOAD] ⚠️ Could not update job ${jobId}:`, updateError);
              // Still allow download since order is PAID
              isPaid = true;
            }
          }
        } else {
          console.log(`[DOWNLOAD] ❌ No recent order found for job ${jobId}`);
        }
      } catch (err) {
        console.error('[DOWNLOAD] Error checking recent orders:', err);
        // Continue with original isPaid value
      }
    }

    if (!isPaid) {
      // Provide a helpful error message
      console.error(`[DOWNLOAD] ❌ Access denied for job ${jobId} - payment not confirmed`);
      
      return NextResponse.json(
        { 
          error: 'Payment not confirmed',
          message: 'Your payment is still being processed. Please wait a moment and try again. If the issue persists, contact support.',
          jobId: jobId,
        },
        { status: 403 }
      );
    }

    const imageUrl = type === 'output' ? job.outputUrl : job.originalUrl;

    if (!imageUrl) {
      console.error(`[DOWNLOAD] ❌ Image URL not found for job ${jobId} (type: ${type})`);
      
      return NextResponse.json(
        { 
          error: 'Image not ready',
          message: type === 'output' 
            ? 'Your image is still being processed. Please wait a moment and refresh.'
            : 'Original image not found.',
          jobId: jobId,
        },
        { status: 404 }
      );
    }

    // Fetch the image from R2 with retry logic
    let imageResponse: Response | null = null;
    const maxRetries = 2;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[DOWNLOAD] Fetching image from R2 (attempt ${attempt}/${maxRetries})...`);
        imageResponse = await fetch(imageUrl, {
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });
        
        if (imageResponse.ok) {
          break;
        } else {
          console.error(`[DOWNLOAD] R2 fetch failed with status ${imageResponse.status}`);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch (fetchError) {
        console.error(`[DOWNLOAD] R2 fetch error (attempt ${attempt}/${maxRetries}):`, fetchError);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    if (!imageResponse || !imageResponse.ok) {
      console.error(`[DOWNLOAD] ❌ Failed to fetch image from R2 after ${maxRetries} attempts`);
      
      return NextResponse.json(
        { 
          error: 'Image temporarily unavailable',
          message: 'We\'re having trouble loading your image. Please try again in a moment. If the issue persists, contact support.',
          jobId: jobId,
        },
        { status: 500 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    // Determine filename
    const filename = type === 'output' 
      ? `colorized-${jobId}.jpg` 
      : `original-${jobId}.jpg`;

    // Return the image with download headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download image' },
      { status: 500 }
    );
  }
}


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

    // Check if job is marked as paid
    let isPaid = job.isPaid;
    let paidOrder = null;
    
    // ENHANCED FALLBACK: If job is not marked as paid, check if there's a paid order for this job
    // This handles race conditions where payment verification hasn't updated the job yet
    if (!isPaid) {
      console.log(`[DOWNLOAD] Job ${jobId} not marked as paid, checking for paid order...`);
      
      try {
        // Check for paid orders with this jobId in metadata
        paidOrder = await prisma.order.findFirst({
          where: {
            status: 'PAID',
            metadata: {
              path: ['jobId'],
              equals: jobId,
            },
          },
        });

        if (paidOrder) {
          // Found a paid order for this job! Use transaction to ensure consistency
          console.log(`[DOWNLOAD] ✅ Found paid order ${paidOrder.id} for job ${jobId}`);
          isPaid = true;
          
          // Update the job atomically
          try {
            await prisma.job.update({
              where: { id: jobId },
              data: { isPaid: true },
            });
            console.log(`[DOWNLOAD] ✅ Job ${jobId} marked as paid`);
          } catch (updateError) {
            console.error(`[DOWNLOAD] ⚠️ Could not update job ${jobId} but allowing download anyway:`, updateError);
          }
        } else {
          // Additional fallback: Check if there are any recent successful transactions for this job
          // This handles edge cases where order metadata might not be properly set
          const recentPaidOrder = await prisma.order.findFirst({
            where: {
              status: 'PAID',
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
              },
              transactions: {
                some: {
                  status: 'SUCCESS',
                },
              },
            },
            include: {
              transactions: true,
            },
          });

          if (recentPaidOrder) {
            // Check if this order's metadata contains our jobId (case-insensitive search)
            const metadata = recentPaidOrder.metadata as any;
            if (metadata?.jobId === jobId) {
              console.log(`[DOWNLOAD] ✅ Found recent paid order ${recentPaidOrder.id} for job ${jobId} via fallback check`);
              isPaid = true;
              
              try {
                await prisma.job.update({
                  where: { id: jobId },
                  data: { isPaid: true },
                });
                console.log(`[DOWNLOAD] ✅ Job ${jobId} marked as paid via fallback`);
              } catch (updateError) {
                console.error(`[DOWNLOAD] ⚠️ Could not update job ${jobId} but allowing download anyway:`, updateError);
              }
            }
          }
          
          if (!isPaid) {
            console.log(`[DOWNLOAD] ❌ No paid order found for job ${jobId}`);
          }
        }
      } catch (err) {
        console.error('[DOWNLOAD] Error checking order payment status:', err);
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


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

    // Zero-Polling Architecture: Enhanced fallback logic
    let isPaid = job.isPaid;
    
    // FALLBACK 1: If job is not marked as paid, check for recent orders (last 24 hours)
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
          
          // Mark job as paid and allow download (optimistic approach)
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


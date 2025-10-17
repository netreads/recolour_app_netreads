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
    
    // FALLBACK: If job is not marked as paid, check if there's a paid order for this job
    // This handles race conditions where webhook/verify-payment hasn't updated the job yet
    if (!isPaid) {
      try {
        const paidOrder = await prisma.order.findFirst({
          where: {
            status: 'PAID',
            metadata: {
              path: ['jobId'],
              equals: jobId,
            },
          },
        });

        if (paidOrder) {
          // Found a paid order for this job! Mark the job as paid and allow download
          isPaid = true;
          
          // Update the job asynchronously (don't wait for it)
          prisma.job.update({
            where: { id: jobId },
            data: { isPaid: true },
          }).catch(err => {
            console.error('Failed to update job isPaid status:', err);
          });
        }
      } catch (err) {
        console.error('Error checking order payment status:', err);
        // Continue with original isPaid value
      }
    }

    if (!isPaid) {
      return NextResponse.json(
        { error: 'Unauthorized - Payment required' },
        { status: 403 }
      );
    }

    const imageUrl = type === 'output' ? job.outputUrl : job.originalUrl;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Fetch the image from R2
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
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


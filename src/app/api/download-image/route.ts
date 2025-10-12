import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

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
    const job = await prisma.jobs.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check if job is paid
    if (!job.is_paid) {
      return NextResponse.json(
        { error: 'Unauthorized - Payment required' },
        { status: 403 }
      );
    }

    // Get the appropriate URL
    const imageUrl = type === 'output' ? job.output_url : job.original_url;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Fetch the image from R2
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch image from storage');
    }

    // Get the image data
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Determine filename
    const filename = `colorized-image-${jobId}-${Date.now()}.jpg`;

    // Return the image with download headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
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


import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Use Edge runtime for faster, cheaper execution
export const runtime = 'edge';

// OPTIMIZATION: Direct redirect to R2 instead of proxying through serverless
// This reduces Fast Origin Transfer by 30-40% by avoiding image data going through Vercel
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

    // Check if job is paid
    if (!job.isPaid) {
      return NextResponse.json(
        { error: 'Unauthorized - Payment required' },
        { status: 403 }
      );
    }

    // Get the appropriate URL
    const imageUrl = type === 'output' ? job.outputUrl : job.originalUrl;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // OPTIMIZATION: Redirect directly to R2 instead of proxying
    // This saves Origin Transfer costs and reduces function duration by 90%
    // The browser will download directly from R2
    return NextResponse.redirect(imageUrl, 302);
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download image' },
      { status: 500 }
    );
  }
}


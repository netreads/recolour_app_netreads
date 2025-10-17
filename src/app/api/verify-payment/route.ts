import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { API_CONFIG } from '@/lib/constants';

export const runtime = 'nodejs';

// Set max duration to prevent unexpected costs from long-running functions
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { orderId, jobId } = await request.json();

    if (!orderId || !jobId) {
      return NextResponse.json({ error: 'Order ID and Job ID are required' }, { status: 400 });
    }

    // Check if order is paid
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'PAID') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
    }

    // Check if the job exists first
    const existingJob = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Mark job as paid (use upsert pattern for idempotency)
    const job = await prisma.job.update({
      where: { id: jobId },
      data: { isPaid: true },
    });

    // Also ensure the order metadata has the correct jobId
    // This helps with future lookups and debugging
    const currentMetadata = order.metadata as any || {};
    if (!currentMetadata.jobId || currentMetadata.jobId !== jobId) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          metadata: {
            ...currentMetadata,
            jobId: jobId,
          },
        },
      }).catch(err => {
        console.error('Failed to update order metadata:', err);
        // Don't fail the request if metadata update fails
      });
    }

    return NextResponse.json({
      success: true,
      jobId: job.id,
      isPaid: job.isPaid,
      message: 'Job successfully marked as paid',
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    
    // Provide more detailed error information
    const err = error as any;
    const errorMessage = err.code === 'P2025' 
      ? 'Job not found in database' 
      : 'Failed to verify payment';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}


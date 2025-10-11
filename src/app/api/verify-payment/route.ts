import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

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

    // Mark job as paid
    const job = await prisma.job.update({
      where: { id: jobId },
      data: { isPaid: true },
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      isPaid: job.isPaid,
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ORDER_STATUS } from '@/lib/constants';

export const runtime = 'nodejs';
export const maxDuration = 10; // Reduced since we're not calling PhonePe

interface OrderMetadata {
  jobId?: string;
  tracking?: {
    ipAddress?: string;
    userAgent?: string;
    eventSourceUrl?: string;
    fbc?: string;
    fbp?: string;
    timestamp?: number;
  };
}

/**
 * SIMPLIFIED STATUS API (NEW ARCHITECTURE)
 * 
 * This endpoint now ONLY checks the database status without calling PhonePe.
 * Payment verification is handled by the download-image API when user attempts download.
 * 
 * This reduces:
 * - PhonePe API calls (cost & rate limits)
 * - Race conditions from concurrent polling
 * - Response time (faster API calls)
 * 
 * The download API is the single source of truth for payment verification.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Get order details from database only
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const success = order.status === ORDER_STATUS.PAID;
    const metadata = (order as any).metadata as OrderMetadata;
    const jobId = metadata?.jobId || null;
    
    console.log(`[STATUS] Order ${orderId}: ${order.status} (jobId: ${jobId || 'none'})`);
    
    return NextResponse.json({
      success,
      orderId: order.id,
      amount: success ? order.amount : 0,
      status: order.status,
      jobId: jobId,
      message: success 
        ? 'Payment successful! Your image is ready.'
        : order.status === ORDER_STATUS.FAILED
          ? 'Payment failed. Please try again.'
          : 'Payment is being processed.',
    });

  } catch (error) {
    console.error('[STATUS] Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}

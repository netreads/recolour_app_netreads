import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getPhonePeOrderStatus } from '@/lib/phonepe';
import { PAYMENT_STATUS } from '@/lib/constants';
import { getServerEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const maxDuration = 10;

/**
 * SECURED API: Mark job as paid after verifying payment with PhonePe
 * 
 * This endpoint requires either:
 * 1. Server-side secret token for internal calls
 * 2. Valid order ID that can be verified with PhonePe
 * 
 * This prevents unauthorized users from marking jobs as paid without payment.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, orderId, serverSecret } = body;

    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json({ error: 'Valid Job ID is required' }, { status: 400 });
    }

    const env = getServerEnv();
    const expectedSecret = env.CRON_SECRET || 'default-secret-change-me';

    // METHOD 1: Server-side authentication (for internal use)
    if (serverSecret) {
      if (serverSecret !== expectedSecret) {
        console.error(`[MARK-PAID] ❌ Invalid server secret for job ${jobId}`);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      // Trusted internal call - mark as paid
      await prisma.job.update({
        where: { id: jobId },
        data: { isPaid: true }
      });

      console.log(`✅ Job ${jobId} marked as paid via server secret`);

      return NextResponse.json({ 
        success: true,
        message: 'Job marked as paid successfully'
      });
    }

    // METHOD 2: Client call - MUST verify with PhonePe first
    if (!orderId) {
      console.error(`[MARK-PAID] ❌ No orderId or serverSecret provided for job ${jobId}`);
      return NextResponse.json({ 
        error: 'Order ID required for verification' 
      }, { status: 400 });
    }

    console.log(`[MARK-PAID] Verifying payment for order ${orderId} before marking job ${jobId} as paid`);

    // Find the order
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        metadata: {
          path: ['jobId'],
          equals: jobId,
        },
      },
    });

    if (!order) {
      console.error(`[MARK-PAID] ❌ Order ${orderId} not found for job ${jobId}`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // If order is already PAID, allow marking job as paid
    if (order.status === 'PAID') {
      console.log(`[MARK-PAID] ✅ Order ${orderId} is already PAID, marking job as paid`);
      
      await prisma.job.update({
        where: { id: jobId },
        data: { isPaid: true }
      });

      return NextResponse.json({ 
        success: true,
        message: 'Job marked as paid successfully'
      });
    }

    // If order is PENDING, verify with PhonePe
    if (order.status === 'PENDING' && order.phonePeOrderId) {
      console.log(`[MARK-PAID] 🔄 Order ${orderId} is PENDING, verifying with PhonePe...`);
      
      try {
        const phonePeStatus = await getPhonePeOrderStatus(order.id);
        console.log(`[MARK-PAID] PhonePe status: ${phonePeStatus.state}`);
        
        if (phonePeStatus.state === PAYMENT_STATUS.COMPLETED) {
          // Payment confirmed! Update order and job
          console.log(`[MARK-PAID] ✅ PhonePe confirmed payment for order ${orderId}`);
          
          await prisma.$transaction(async (tx: any) => {
            // Update order
            await tx.order.update({
              where: { id: order.id },
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

          return NextResponse.json({ 
            success: true,
            message: 'Payment verified and job marked as paid'
          });
        } else {
          console.error(`[MARK-PAID] ❌ PhonePe reports payment NOT completed: ${phonePeStatus.state}`);
          return NextResponse.json({ 
            error: 'Payment not confirmed by PhonePe',
            paymentStatus: phonePeStatus.state
          }, { status: 403 });
        }
      } catch (phonePeError) {
        console.error(`[MARK-PAID] ❌ Error verifying with PhonePe:`, phonePeError);
        return NextResponse.json({ 
          error: 'Failed to verify payment status' 
        }, { status: 500 });
      }
    }

    // Order is not in a valid state for marking job as paid
    console.error(`[MARK-PAID] ❌ Order ${orderId} status is ${order.status}, cannot mark job as paid`);
    return NextResponse.json({ 
      error: 'Payment not confirmed',
      orderStatus: order.status
    }, { status: 403 });

  } catch (error) {
    console.error('[MARK-PAID] Error marking job as paid:', error);
    return NextResponse.json(
      { error: 'Failed to mark job as paid' },
      { status: 500 }
    );
  }
}

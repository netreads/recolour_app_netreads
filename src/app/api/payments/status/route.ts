import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getPhonePeOrderStatus } from '@/lib/phonepe';
import { PAYMENT_STATUS, ORDER_STATUS, API_CONFIG } from '@/lib/constants';
import { getServerEnv } from '@/lib/env';
import { trackPurchaseServerSide } from '@/lib/facebookConversionsAPI';

export const runtime = 'nodejs';
export const maxDuration = 30; // Handles payment verification via polling

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const env = getServerEnv();

    // Get order details (allow anonymous orders)
    let order = await prisma.order.findFirst({
      where: {
        id: orderId,
      },
      include: {
        transactions: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let success = order.status === ORDER_STATUS.PAID;
    let transaction = order.transactions.find(t => t.status === 'SUCCESS');

    // POLLING APPROACH: Check PhonePe if order is still pending
    // This ensures we catch payments even without webhooks
    if (!success && order.phonePeOrderId && order.status === ORDER_STATUS.PENDING) {
      console.log(`[STATUS] Polling PhonePe for order ${orderId}`);
      try {
        const paymentStatus = await getPhonePeOrderStatus(order.id);
        console.log(`[STATUS] PhonePe status for ${orderId}: ${paymentStatus.state}`);
        
        if (paymentStatus.state === PAYMENT_STATUS.COMPLETED) {
          const paymentDetails = Array.isArray(paymentStatus.payment_details) ? paymentStatus.payment_details : [];
          const transactionId = paymentDetails[0]?.transactionId || order.paymentId || null;
          
          console.log(`[STATUS] ✅ Payment COMPLETED for order ${orderId}`);
          
          // Update order status
          const updated = await prisma.order.update({
            where: { id: order.id },
            data: {
              status: ORDER_STATUS.PAID,
              paymentId: transactionId,
              paymentStatus: 'SUCCESS',
            },
            include: { transactions: true },
          });

          console.log(`[STATUS] ✅ Order ${orderId} marked as PAID`);

          // Create success transaction if not exists
          const hasSuccessTxn = updated.transactions.some(t => t.status === 'SUCCESS');
          if (!hasSuccessTxn) {
            await prisma.transaction.create({
              data: {
                orderId: updated.id,
                userId: updated.userId,
                credits: 0,
                amount: updated.amount,
                type: 'CREDIT_PURCHASE',
                status: 'SUCCESS',
                phonePeOrderId: updated.phonePeOrderId,
                paymentId: updated.paymentId || undefined,
              },
            });
            console.log(`[STATUS] ✅ Transaction record created`);
          }

          // Mark job as paid - critical for download access
          const metadata = (updated as any).metadata as OrderMetadata;
          if (metadata?.jobId) {
            try {
              const job = await prisma.job.findUnique({
                where: { id: metadata.jobId },
              });
              
              if (job && !job.isPaid) {
                await prisma.job.update({
                  where: { id: metadata.jobId },
                  data: { isPaid: true },
                });
                console.log(`[STATUS] ✅ Job ${metadata.jobId} marked as PAID`);
              } else if (!job) {
                console.error(`[STATUS] ❌ Job ${metadata.jobId} not found!`);
              }
            } catch (jobError) {
              console.error(`[STATUS] ❌ Failed to mark job as paid:`, jobError);
            }
          }

          // Track purchase in Facebook Conversions API
          try {
            const tracking = metadata?.tracking as any;
            const amountInRupees = updated.amount / 100;
            
            await trackPurchaseServerSide({
              orderId: updated.id,
              jobId: metadata?.jobId,
              amount: amountInRupees,
              currency: 'INR',
              userId: updated.userId || undefined,
              ipAddress: tracking?.ipAddress,
              userAgent: tracking?.userAgent,
              fbc: tracking?.fbc,
              fbp: tracking?.fbp,
              eventSourceUrl: tracking?.eventSourceUrl,
            });
            
            console.log(`[STATUS] ✅ Facebook conversion tracked (amount: ₹${amountInRupees})`);
          } catch (fbError) {
            console.error('[STATUS] ⚠️ Facebook tracking failed:', fbError);
            // Non-critical, continue
          }

          order = updated;
          success = true;
          transaction = updated.transactions.find(t => t.status === 'SUCCESS') || transaction;
        } else if (paymentStatus.state === PAYMENT_STATUS.FAILED) {
          console.log(`[STATUS] ❌ Payment FAILED for order ${orderId}`);
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: ORDER_STATUS.FAILED,
              paymentStatus: 'FAILED',
            },
          });
          order.status = ORDER_STATUS.FAILED;
        } else if (paymentStatus.state === PAYMENT_STATUS.PENDING) {
          console.log(`[STATUS] ⏳ Order ${orderId} still PENDING at PhonePe`);
        }
      } catch (e) {
        console.error('[STATUS] ❌ Error checking PhonePe payment status:', e);
        // Return current DB status as fallback
      }
    } else if (success) {
      console.log(`[STATUS] ✅ Order ${orderId} already PAID`);
    }

    // Extract jobId from metadata if it's a single image purchase
    const metadata = (order as any).metadata as OrderMetadata;
    const jobId = metadata?.jobId || null;
    
    return NextResponse.json({
      success,
      orderId: order.id,
      amount: success ? order.amount : 0,
      status: order.status,
      jobId: jobId,
      message: success 
        ? 'Payment successful! Your image is ready.'
        : `Payment ${order.status.toLowerCase()}`,
    });

  } catch (error) {
    const env = getServerEnv();
    console.error('[STATUS] Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}

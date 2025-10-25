import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getPhonePeOrderStatus } from '@/lib/phonepe';
import { PAYMENT_STATUS, ORDER_STATUS } from '@/lib/constants';
import { getServerEnv } from '@/lib/env';
import { trackPurchaseServerSide } from '@/lib/facebookConversionsAPI';

export const runtime = 'nodejs';
export const maxDuration = 15; // 10 seconds timeout + buffer

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

    // Get order details
    let order = await prisma.order.findFirst({
      where: { id: orderId },
      include: { transactions: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // If already paid, return success immediately
    if (order.status === ORDER_STATUS.PAID) {
      const metadata = (order as any).metadata as OrderMetadata;
      return NextResponse.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        status: order.status,
        jobId: metadata?.jobId || null,
        message: 'Payment successful! Your image is ready.',
        alreadyPaid: true
      });
    }

    // If order is failed, return failure immediately
    if (order.status === ORDER_STATUS.FAILED) {
      return NextResponse.json({
        success: false,
        orderId: order.id,
        amount: 0,
        status: order.status,
        message: 'Payment failed',
        alreadyFailed: true
      });
    }

    // For pending orders, check PhonePe status with timeout
    if (order.status === ORDER_STATUS.PENDING && order.phonePeOrderId) {
      console.log(`[SIMPLE-STATUS] Checking PhonePe status for order ${orderId}`);
      
      try {
        // Set up timeout for PhonePe API call
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('PhonePe status check timeout')), 10000); // 10 seconds
        });

        const statusPromise = getPhonePeOrderStatus(order.id);
        
        // Race between status check and timeout
        const paymentStatus = await Promise.race([statusPromise, timeoutPromise]) as any;
        
        console.log(`[SIMPLE-STATUS] PhonePe status for ${orderId}: ${paymentStatus.state}`);
        
        if (paymentStatus.state === PAYMENT_STATUS.COMPLETED) {
          const paymentDetails = Array.isArray(paymentStatus.payment_details) ? paymentStatus.payment_details : [];
          const transactionId = paymentDetails[0]?.transactionId || order.paymentId || null;
          
          console.log(`[SIMPLE-STATUS] ✅ Payment COMPLETED for order ${orderId}`);
          
          // Update order status with transaction
          await prisma.$transaction(async (tx: any) => {
            // Update order status
            const updated = await tx.order.update({
              where: { id: order.id },
              data: {
                status: ORDER_STATUS.PAID,
                paymentId: transactionId,
                paymentStatus: 'SUCCESS',
              },
              include: { transactions: true },
            });

            console.log(`[SIMPLE-STATUS] ✅ Order ${orderId} marked as PAID`);

            // Create success transaction if not exists
            const hasSuccessTxn = updated.transactions.some((t: { status: string }) => t.status === 'SUCCESS');
            if (!hasSuccessTxn) {
              await tx.transaction.create({
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
              console.log(`[SIMPLE-STATUS] ✅ Transaction record created`);
            }

            // Mark job as paid - critical for download access
            const metadata = (updated as any).metadata as OrderMetadata;
            if (metadata?.jobId) {
              const job = await tx.job.findUnique({
                where: { id: metadata.jobId },
              });
              
              if (!job) {
                console.error(`[SIMPLE-STATUS] ❌ Job ${metadata.jobId} not found!`);
              } else if (!job.isPaid) {
                await tx.job.update({
                  where: { id: metadata.jobId },
                  data: { isPaid: true },
                });
                console.log(`[SIMPLE-STATUS] ✅ Job ${metadata.jobId} marked as PAID`);
              } else {
                console.log(`[SIMPLE-STATUS] ℹ️ Job ${metadata.jobId} already marked as PAID`);
              }
            }

            return updated;
          });

          // Track purchase in Facebook Conversions API (outside transaction)
          try {
            const metadata = (order as any).metadata as OrderMetadata;
            const tracking = metadata?.tracking as any;
            const amountInRupees = order.amount / 100;
            
            await trackPurchaseServerSide({
              orderId: order.id,
              jobId: metadata?.jobId,
              amount: amountInRupees,
              currency: 'INR',
              userId: order.userId || undefined,
              ipAddress: tracking?.ipAddress,
              userAgent: tracking?.userAgent,
              fbc: tracking?.fbc,
              fbp: tracking?.fbp,
              eventSourceUrl: tracking?.eventSourceUrl,
            });
            
            console.log(`[SIMPLE-STATUS] ✅ Facebook conversion tracked (amount: ₹${amountInRupees})`);
          } catch (fbError) {
            console.error('[SIMPLE-STATUS] ⚠️ Facebook tracking failed:', fbError);
            // Non-critical, continue
          }

          // Return success response
          const metadata = (order as any).metadata as OrderMetadata;
          return NextResponse.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            status: ORDER_STATUS.PAID,
            jobId: metadata?.jobId || null,
            message: 'Payment successful! Your image is ready.',
            transactionId: transactionId
          });

        } else if (paymentStatus.state === PAYMENT_STATUS.FAILED) {
          console.log(`[SIMPLE-STATUS] ❌ Payment FAILED for order ${orderId}`);
          console.log(`[SIMPLE-STATUS] PhonePe state: ${paymentStatus.state}`);
          console.log(`[SIMPLE-STATUS] Payment details:`, paymentStatus.payment_details);
          
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: ORDER_STATUS.FAILED,
              paymentStatus: 'FAILED',
            },
          });
          
          console.log(`[SIMPLE-STATUS] ✅ Order ${orderId} marked as FAILED in database`);
          
          return NextResponse.json({
            success: false,
            orderId: order.id,
            amount: 0,
            status: ORDER_STATUS.FAILED,
            message: 'Payment failed',
            phonePeState: paymentStatus.state
          });

        } else if (paymentStatus.state === PAYMENT_STATUS.PENDING) {
          console.log(`[SIMPLE-STATUS] ⏳ Order ${orderId} still PENDING at PhonePe`);
          
          return NextResponse.json({
            success: false,
            orderId: order.id,
            amount: 0,
            status: ORDER_STATUS.PENDING,
            message: 'Payment is still being processed. Please wait a moment and try again.',
            phonePeState: paymentStatus.state,
            retryAfter: 5 // Suggest retry after 5 seconds
          });
        }

      } catch (error) {
        console.error('[SIMPLE-STATUS] ❌ Error checking PhonePe payment status:', error);
        
        // Check if it's a timeout error
        if (error instanceof Error && error.message.includes('timeout')) {
          return NextResponse.json({
            success: false,
            orderId: order.id,
            amount: 0,
            status: ORDER_STATUS.PENDING,
            message: 'Payment verification is taking longer than expected. Please try again in a few moments.',
            timeout: true,
            retryAfter: 10
          });
        }
        
        // For other errors, return current DB status
        return NextResponse.json({
          success: false,
          orderId: order.id,
          amount: 0,
          status: order.status,
          message: 'Unable to verify payment status. Please contact support if payment was deducted.',
          error: true
        });
      }
    }

    // Fallback - return current status
    const metadata = (order as any).metadata as OrderMetadata;
    return NextResponse.json({
      success: false,
      orderId: order.id,
      amount: 0,
      status: order.status,
      jobId: metadata?.jobId || null,
      message: `Payment ${order.status.toLowerCase()}`,
    });

  } catch (error) {
    const env = getServerEnv();
    console.error('[SIMPLE-STATUS] Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}

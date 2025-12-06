import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getPhonePeOrderStatus } from '@/lib/phonepe';
import { ORDER_STATUS, PAYMENT_STATUS } from '@/lib/constants';
import { setCachedPaymentStatus, shouldSkipVerification } from '@/lib/payment-cache';
import { getServerEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const maxDuration = 25; // Increased to handle PhonePe verification with retries

interface OrderMetadata {
  jobId?: string;
  type?: string;
  tracking?: {
    ipAddress?: string;
    userAgent?: string;
    eventSourceUrl?: string;
    fbc?: string;
    fbp?: string;
    timestamp?: number;
  };
}

// Helper to call PhonePe with retry logic
async function verifyPhonePeWithRetry(orderId: string, maxRetries: number = 3): Promise<any> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[STATUS] 📞 PhonePe API call attempt ${attempt}/${maxRetries}...`);
      const status = await getPhonePeOrderStatus(orderId);
      return status;
    } catch (error) {
      lastError = error as Error;
      console.error(`[STATUS] ⚠️ PhonePe attempt ${attempt} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Helper to extract transaction ID from PhonePe response
function extractTransactionId(phonePeStatus: any): string | null {
  const paymentDetails = Array.isArray(phonePeStatus.payment_details) 
    ? phonePeStatus.payment_details 
    : [];
  return paymentDetails[0]?.transactionId || null;
}

/**
 * PAYMENT STATUS API
 * 
 * This endpoint checks payment status and verifies with PhonePe if order is PENDING.
 * For upscale orders, this is critical to verify payment before starting processing.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Get order details from database
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const metadata = (order as any).metadata as OrderMetadata;
    const jobId = metadata?.jobId || null;
    const isUpscaleOrder = metadata?.type === 'upscale';
    
    console.log(`[STATUS] Order ${orderId}: ${order.status} (jobId: ${jobId || 'none'}, type: ${isUpscaleOrder ? 'upscale' : 'normal'})`);

    // If already PAID, return success immediately
    if (order.status === ORDER_STATUS.PAID) {
      return NextResponse.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        status: order.status,
        jobId: jobId,
        message: 'Payment successful! Your image is ready.',
      });
    }

    // If already FAILED, return failure immediately
    if (order.status === ORDER_STATUS.FAILED) {
      return NextResponse.json({
        success: false,
        orderId: order.id,
        amount: 0,
        status: order.status,
        jobId: jobId,
        message: 'Payment failed. Please try again.',
      });
    }

    // If PENDING, verify with PhonePe
    if (order.status === ORDER_STATUS.PENDING) {
      console.log(`[STATUS] 🔄 Order ${orderId} is PENDING, verifying with PhonePe...`);
      
      // Check cache but ONLY skip for final states (COMPLETED/FAILED)
      const verificationCheck = shouldSkipVerification(order.id);
      
      if (verificationCheck.skip && verificationCheck.cachedStatus === 'COMPLETED') {
        console.log(`[STATUS] ⏭️ Cache says COMPLETED, updating DB...`);
        // Cache says COMPLETED but DB not updated yet (race condition)
        try {
          const transactionId = null; // We don't have it from cache
          await prisma.$transaction(async (tx: any) => {
            await tx.order.update({
              where: { id: order.id },
              data: {
                status: 'PAID',
                paymentStatus: 'SUCCESS',
                paymentId: transactionId,
              },
            });
            
            // For normal orders, also update job
            if (jobId && !isUpscaleOrder) {
              await tx.job.update({
                where: { id: jobId },
                data: { isPaid: true },
              });
            }
          });
          
          return NextResponse.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            status: 'PAID',
            jobId: jobId,
            message: 'Payment successful! Your image is ready.',
          });
        } catch (dbError) {
          console.error(`[STATUS] ⚠️ DB update failed:`, dbError);
          // Continue to verify with PhonePe
        }
      }

      // Verify with PhonePe
      try {
        const phonePeStatus = await verifyPhonePeWithRetry(order.id, 3);
        console.log(`[STATUS] 📞 PhonePe final response: ${phonePeStatus.state}`);
        
        // DEV ONLY: Simulate payment failure for testing cancelled payments in sandbox
        const env = getServerEnv();
        const simulateFailure = env.SIMULATE_PAYMENT_FAILURE === 'true' && 
                                env.PHONEPE_ENVIRONMENT !== 'production';
        
        if (simulateFailure && phonePeStatus.state === PAYMENT_STATUS.COMPLETED) {
          console.log(`[STATUS] ⚠️ DEV MODE: Simulating payment FAILURE (SIMULATE_PAYMENT_FAILURE=true)`);
          phonePeStatus.state = PAYMENT_STATUS.FAILED;
        }
        
        // Only cache final states
        if (phonePeStatus.state === PAYMENT_STATUS.COMPLETED || 
            phonePeStatus.state === PAYMENT_STATUS.FAILED) {
          setCachedPaymentStatus(order.id, phonePeStatus.state, 60);
        }

        if (phonePeStatus.state === PAYMENT_STATUS.COMPLETED) {
          // ✅ Payment confirmed! Update database
          console.log(`[STATUS] ✅ Payment CONFIRMED for order ${order.id}!`);
          
          const transactionId = extractTransactionId(phonePeStatus);
          
          try {
            await prisma.$transaction(async (tx: any) => {
              // Update order
              await tx.order.update({
                where: { id: order.id },
                data: {
                  status: 'PAID',
                  paymentStatus: 'SUCCESS',
                  paymentId: transactionId,
                },
              });
              
              // For normal orders, also update job (upscale orders don't need this)
              if (jobId && !isUpscaleOrder) {
                await tx.job.update({
                  where: { id: jobId },
                  data: { isPaid: true },
                });
              }
              
              // Create transaction record if not exists
              const existingTransaction = await tx.transaction.findFirst({
                where: { orderId: order.id, status: 'SUCCESS' },
              });
              
              if (!existingTransaction) {
                await tx.transaction.create({
                  data: {
                    orderId: order.id,
                    userId: order.userId,
                    credits: 0,
                    amount: order.amount,
                    type: 'CREDIT_PURCHASE',
                    status: 'SUCCESS',
                    phonePeOrderId: order.phonePeOrderId,
                    paymentId: transactionId,
                  },
                });
              }
            });
            
            console.log(`[STATUS] ✅ DB updated successfully`);
          } catch (dbError) {
            console.error(`[STATUS] ⚠️ DB update failed:`, dbError);
            // Still return success since payment is confirmed
          }
          
          return NextResponse.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            status: 'PAID',
            jobId: jobId,
            message: 'Payment successful! Your image is ready.',
          });
          
        } else if (phonePeStatus.state === PAYMENT_STATUS.FAILED) {
          // ❌ Payment failed
          console.log(`[STATUS] ❌ PhonePe reports FAILED for order ${order.id}`);
          
          try {
            await prisma.order.update({
              where: { id: order.id },
              data: { status: 'FAILED', paymentStatus: 'FAILED' }
            });
          } catch (dbError) {
            console.error(`[STATUS] ⚠️ Failed to update DB:`, dbError);
          }
          
          return NextResponse.json({
            success: false,
            orderId: order.id,
            amount: 0,
            status: 'FAILED',
            jobId: jobId,
            message: 'Payment failed. Please try again.',
          });
          
        } else {
          // Still PENDING
          console.log(`[STATUS] ⏳ Payment still PENDING for order ${order.id}`);
          return NextResponse.json({
            success: false,
            orderId: order.id,
            amount: 0,
            status: 'PENDING',
            jobId: jobId,
            message: 'Payment is being processed. Please wait...',
          });
        }
        
      } catch (phonepeError) {
        console.error('[STATUS] PhonePe verification failed:', phonepeError);
        // Return PENDING status on error (don't fail the request)
        return NextResponse.json({
          success: false,
          orderId: order.id,
          amount: 0,
          status: 'PENDING',
          jobId: jobId,
          message: 'Payment verification is in progress. Please wait...',
        });
      }
    }

    // Unknown status
    return NextResponse.json({
      success: false,
      orderId: order.id,
      amount: 0,
      status: order.status,
      jobId: jobId,
      message: 'Payment status unknown. Please contact support.',
    });

  } catch (error) {
    console.error('[STATUS] Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}

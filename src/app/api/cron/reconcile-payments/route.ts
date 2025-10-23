import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getPhonePeOrderStatus } from '@/lib/phonepe';
import { PAYMENT_STATUS, ORDER_STATUS } from '@/lib/constants';
import { getServerEnv } from '@/lib/env';
import { trackPurchaseServerSide } from '@/lib/facebookConversionsAPI';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for cron job

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
 * Payment Reconciliation Cron Job
 * 
 * This endpoint runs periodically to reconcile stuck pending orders.
 * It checks PhonePe for the actual payment status and updates the database.
 * 
 * Vercel Cron Configuration (add to vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/reconcile-payments",
 *     "schedule": "0,5,10,15,20,25,30,35,40,45,50,55 * * * *"
 *   }]
 * }
 * 
 * This runs every 5 minutes and is FREE on Vercel (Hobby/Pro plans)
 * 
 * Security: Vercel Cron jobs are authenticated with a special header.
 * For additional security, you can also check a secret token.
 */
export async function GET(request: NextRequest) {
  const env = getServerEnv();
  
  try {
    // Verify Vercel Cron authentication
    const authHeader = request.headers.get('authorization');
    if (env.NODE_ENV === 'production') {
      const cronSecret = env.CRON_SECRET || '';
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        console.error('[CRON] Unauthorized cron request');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    console.log('[CRON] 🔄 Starting payment reconciliation...');
    
    // Find orders that are still PENDING and older than 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: ORDER_STATUS.PENDING,
        createdAt: {
          lt: twoMinutesAgo, // Only check orders older than 2 minutes
        },
        phonePeOrderId: {
          not: null, // Must have PhonePe order ID
        },
      },
      take: 50, // Process max 50 orders per run to avoid timeout
      orderBy: {
        createdAt: 'asc', // Oldest first
      },
      include: {
        transactions: true,
      },
    });
    
    console.log(`[CRON] Found ${pendingOrders.length} pending orders to check`);
    
    let successCount = 0;
    let failedCount = 0;
    let stillPendingCount = 0;
    const errors: string[] = [];
    
    // Process each pending order
    for (const order of pendingOrders) {
      try {
        console.log(`[CRON] Checking order ${order.id} (created ${order.createdAt.toISOString()})`);
        
        // Check PhonePe for actual payment status
        const paymentStatus = await getPhonePeOrderStatus(order.id);
        console.log(`[CRON] PhonePe status for ${order.id}: ${paymentStatus.state}`);
        
        if (paymentStatus.state === PAYMENT_STATUS.COMPLETED) {
          // Payment was successful! Update database
          console.log(`[CRON] ✅ Payment COMPLETED for order ${order.id}`);
          
          const paymentDetails = Array.isArray(paymentStatus.payment_details) ? paymentStatus.payment_details : [];
          const transactionId = (paymentDetails[0] as any)?.transactionId || order.paymentId || null;
          
          // Update order to PAID
          const updated = await prisma.order.update({
            where: { id: order.id },
            data: {
              status: ORDER_STATUS.PAID,
              paymentId: transactionId,
              paymentStatus: 'SUCCESS',
            },
            include: { transactions: true },
          });
          
          // Create success transaction if not exists
          const hasSuccessTxn = updated.transactions.some((t: { status: string }) => t.status === 'SUCCESS');
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
          }
          
          // Mark job as paid - CRITICAL
          const metadata = updated.metadata as OrderMetadata;
          if (metadata?.jobId) {
            let jobMarked = false;
            const maxRetries = 3;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
              try {
                const job = await prisma.job.findUnique({
                  where: { id: metadata.jobId },
                });
                
                if (!job) {
                  console.error(`[CRON] ❌ Job ${metadata.jobId} not found!`);
                  break;
                }
                
                if (!job.isPaid) {
                  await prisma.job.update({
                    where: { id: metadata.jobId },
                    data: { isPaid: true },
                  });
                  console.log(`[CRON] ✅ Job ${metadata.jobId} marked as PAID`);
                  jobMarked = true;
                  break;
                } else {
                  jobMarked = true;
                  break;
                }
              } catch (jobError) {
                console.error(`[CRON] ❌ Failed to mark job as paid (attempt ${attempt}):`, jobError);
                if (attempt < maxRetries) {
                  await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
              }
            }
            
            if (!jobMarked) {
              console.error(`[CRON] 🚨 Job ${metadata.jobId} could NOT be marked as paid!`);
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
          } catch (fbError) {
            console.error('[CRON] ⚠️ Facebook tracking failed:', fbError);
          }
          
          successCount++;
          
        } else if (paymentStatus.state === PAYMENT_STATUS.FAILED) {
          // Payment failed
          console.log(`[CRON] ❌ Payment FAILED for order ${order.id}`);
          
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: ORDER_STATUS.FAILED,
              paymentStatus: 'FAILED',
            },
          });
          
          failedCount++;
          
        } else {
          // Still pending
          console.log(`[CRON] ⏳ Order ${order.id} still PENDING`);
          stillPendingCount++;
        }
        
      } catch (orderError) {
        const err = orderError as Error;
        console.error(`[CRON] ❌ Error processing order ${order.id}:`, err.message);
        errors.push(`Order ${order.id}: ${err.message}`);
      }
    }
    
    const summary = {
      checked: pendingOrders.length,
      successful: successCount,
      failed: failedCount,
      stillPending: stillPendingCount,
      errors: errors.length,
      errorDetails: errors.slice(0, 10), // Return first 10 errors
    };
    
    console.log(`[CRON] ✅ Reconciliation complete:`, summary);
    
    return NextResponse.json({
      success: true,
      summary,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    const err = error as Error;
    console.error('[CRON] Error in payment reconciliation:', err);
    return NextResponse.json(
      { error: 'Reconciliation failed', message: err.message },
      { status: 500 }
    );
  }
}

// Also support POST method for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}


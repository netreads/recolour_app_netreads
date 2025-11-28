import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getPhonePeOrderStatus } from '@/lib/phonepe';
import { PAYMENT_STATUS, JOB_STATUS } from '@/lib/constants';
import { setCachedPaymentStatus, shouldSkipVerification } from '@/lib/payment-cache';
import { trackPurchaseServerSide } from '@/lib/facebookConversionsAPI';

export const runtime = 'nodejs';
export const maxDuration = 25; // Increased to handle PhonePe verification with retries
export const dynamic = 'force-dynamic';

// Helper to extract transaction ID from PhonePe response
function extractTransactionId(phonePeStatus: any): string | null {
  const paymentDetails = Array.isArray(phonePeStatus.payment_details) 
    ? phonePeStatus.payment_details 
    : [];
  return paymentDetails[0]?.transactionId || null;
}

// Helper to call PhonePe with retry logic (Bug 2 fix)
async function verifyPhonePeWithRetry(orderId: string, maxRetries: number = 3): Promise<any> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[DOWNLOAD] 📞 PhonePe API call attempt ${attempt}/${maxRetries}...`);
      const status = await getPhonePeOrderStatus(orderId);
      return status;
    } catch (error) {
      lastError = error as Error;
      console.error(`[DOWNLOAD] ⚠️ PhonePe attempt ${attempt} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Helper to update database with retry logic (Bug 3 fix)
async function updatePaymentInDbWithRetry(
  orderId: string, 
  jobId: string, 
  transactionId: string | null,
  orderUserId: string | null,
  orderAmount: number,
  orderPhonePeId: string | null,
  maxRetries: number = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[DOWNLOAD] 💾 DB update attempt ${attempt}/${maxRetries}...`);
      
      await prisma.$transaction(async (tx: any) => {
        // Update order
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: 'PAID',
            paymentStatus: 'SUCCESS',
            paymentId: transactionId,
          },
        });
        
        // Update job
        await tx.job.update({
          where: { id: jobId },
          data: { isPaid: true },
        });
        
        // Create transaction record if not exists
        const existingTransaction = await tx.transaction.findFirst({
          where: { orderId: orderId, status: 'SUCCESS' },
        });
        
        if (!existingTransaction) {
          await tx.transaction.create({
            data: {
              orderId: orderId,
              userId: orderUserId,
              credits: 0,
              amount: orderAmount,
              type: 'CREDIT_PURCHASE',
              status: 'SUCCESS',
              phonePeOrderId: orderPhonePeId,
              paymentId: transactionId,
            },
          });
        }
      });
      
      console.log(`[DOWNLOAD] ✅ DB update successful on attempt ${attempt}`);
      return true;
    } catch (error) {
      console.error(`[DOWNLOAD] ⚠️ DB update attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  return false;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');
    const orderId = searchParams.get('orderId'); // Bug 6 & 9 fix: Accept orderId from URL
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

    // Bug 10 fix: Validate job status before serving
    if (job.status === JOB_STATUS.FAILED) {
      console.log(`[DOWNLOAD] ❌ Job ${jobId} processing failed`);
      return NextResponse.json(
        { 
          error: 'Image processing failed',
          code: 'JOB_FAILED',
          message: 'Unfortunately, your image could not be processed. Please try uploading again or contact support for a refund.',
          jobId: jobId,
        },
        { status: 500 }
      );
    }

    if (job.status === JOB_STATUS.PROCESSING || job.status === JOB_STATUS.PENDING) {
      console.log(`[DOWNLOAD] ⏳ Job ${jobId} still processing (status: ${job.status})`);
      return NextResponse.json(
        { 
          error: 'Image still processing',
          code: 'JOB_PROCESSING',
          message: 'Your image is still being processed. Please wait a moment and try again.',
          jobId: jobId,
          retryAfter: 5,
        },
        { status: 202 } // 202 Accepted - processing
      );
    }

    // ✅ FAST PATH: If already marked as paid, serve immediately
    if (job.isPaid) {
      console.log(`[DOWNLOAD] ✅ Job ${jobId} already paid, serving image`);
      return await serveImage(job, type, jobId);
    }

    // 🔍 VERIFICATION PATH: Job not marked as paid, need to verify payment
    console.log(`[DOWNLOAD] 🔍 Job ${jobId} not marked as paid, verifying payment...`);
    
    // Bug 1 & 6 fix: Find order - prefer orderId if provided, remove 24-hour limit
    let order = null;
    
    // First try to find by orderId if provided (most reliable)
    if (orderId) {
      console.log(`[DOWNLOAD] Looking up order by orderId: ${orderId}`);
      order = await prisma.order.findFirst({
        where: {
          id: orderId,
          metadata: {
            path: ['jobId'],
            equals: jobId,
          },
        },
      });
    }
    
    // Fallback: find by jobId without time limit (Bug 1 fix: removed 24-hour restriction)
    if (!order) {
      console.log(`[DOWNLOAD] Looking up order by jobId: ${jobId}`);
      order = await prisma.order.findFirst({
        where: {
          metadata: {
            path: ['jobId'],
            equals: jobId,
          },
          // Bug 6 fix: Prefer PAID orders first, then most recent
          OR: [
            { status: 'PAID' },
            { status: 'PENDING' },
          ],
        },
        orderBy: [
          { status: 'asc' }, // PAID comes before PENDING alphabetically
          { createdAt: 'desc' }, // Most recent first
        ],
      });
    }

    if (!order) {
      console.log(`[DOWNLOAD] ❌ No order found for job ${jobId}`);
      return NextResponse.json(
        { 
          error: 'No payment found for this image',
          code: 'NO_PAYMENT',
          message: 'We could not find a payment for this image. Please try again or contact support.',
          jobId: jobId,
        },
        { status: 402 } // 402 Payment Required
      );
    }

    console.log(`[DOWNLOAD] Found order ${order.id} (status: ${order.status})`);

    // ✅ PAID ORDER: Just update job and serve
    if (order.status === 'PAID') {
      console.log(`[DOWNLOAD] ✅ Order ${order.id} already PAID, updating job...`);
      
      try {
        await prisma.job.update({
          where: { id: jobId },
          data: { isPaid: true }
        });
        console.log(`[DOWNLOAD] ✅ Job ${jobId} marked as paid`);
      } catch (updateError) {
        console.error(`[DOWNLOAD] ⚠️ Could not update job ${jobId}:`, updateError);
        // Continue anyway since order is PAID
      }
      
      return await serveImage(job, type, jobId);
    }

    // ❌ FAILED ORDER: Don't allow download
    if (order.status === 'FAILED') {
      console.log(`[DOWNLOAD] ❌ Order ${order.id} is FAILED`);
      return NextResponse.json(
        { 
          error: 'Payment failed',
          code: 'PAYMENT_FAILED',
          message: 'Your payment failed. Please try again.',
          orderId: order.id,
        },
        { status: 402 }
      );
    }

    // 🔄 PENDING ORDER: Need to verify with PhonePe
    if (order.status === 'PENDING') {
      console.log(`[DOWNLOAD] 🔄 Order ${order.id} is PENDING, checking with PhonePe...`);
      
      // Bug 5 fix: Check cache but ONLY skip for final states (COMPLETED/FAILED)
      // Never skip for PENDING - always re-verify to catch completed payments
      const verificationCheck = shouldSkipVerification(order.id);
      
      if (verificationCheck.skip && verificationCheck.cachedStatus === 'COMPLETED') {
        console.log(`[DOWNLOAD] ⏭️ Cache says COMPLETED, updating DB...`);
        // Cache says COMPLETED but DB not updated yet (race condition)
        const dbUpdated = await updatePaymentInDbWithRetry(
          order.id, jobId, null, order.userId, order.amount, order.phonePeOrderId
        );
        if (dbUpdated) {
          return await serveImage(job, type, jobId);
        }
        // If DB update failed, continue to re-verify with PhonePe
      }
      
      // Bug 5 fix: Don't skip for cached PENDING - always re-verify
      // This prevents stale cache from blocking users who just completed payment

      // Call PhonePe with retry logic (Bug 2 fix)
      try {
        const phonePeStatus = await verifyPhonePeWithRetry(order.id, 3);
        console.log(`[DOWNLOAD] 📞 PhonePe final response: ${phonePeStatus.state}`);
        
        // Only cache final states (Bug 5 fix)
        if (phonePeStatus.state === PAYMENT_STATUS.COMPLETED || 
            phonePeStatus.state === PAYMENT_STATUS.FAILED) {
          setCachedPaymentStatus(order.id, phonePeStatus.state, 60);
        }
        // Don't cache PENDING state to ensure fresh checks

        if (phonePeStatus.state === PAYMENT_STATUS.COMPLETED) {
          // ✅✅✅ PAYMENT CONFIRMED! Update everything with retry (Bug 3 fix)
          console.log(`[DOWNLOAD] ✅✅✅ Payment CONFIRMED for order ${order.id}!`);
          
          const transactionId = extractTransactionId(phonePeStatus);
          
          const dbUpdated = await updatePaymentInDbWithRetry(
            order.id, jobId, transactionId, order.userId, order.amount, order.phonePeOrderId
          );
          
          if (!dbUpdated) {
            // DB update failed after retries, but payment IS confirmed
            // Log critical error but still try to serve image
            console.error(`[DOWNLOAD] 🚨 CRITICAL: Payment confirmed but DB update failed for order ${order.id}`);
            // Still serve the image - user paid, they deserve their image
            // The cron job will eventually fix the DB state
          }

          // Track purchase with Facebook Conversions API (non-blocking)
          try {
            const metadata = (order as any).metadata as any;
            const tracking = metadata?.tracking;
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
            
            console.log(`[DOWNLOAD] ✅ Facebook conversion tracked`);
          } catch (fbError) {
            console.error('[DOWNLOAD] ⚠️ Facebook tracking failed:', fbError);
            // Non-critical, continue
          }
          
          // Serve the image!
          return await serveImage(job, type, jobId);
          
        } else if (phonePeStatus.state === PAYMENT_STATUS.FAILED) {
          // ❌ Payment failed
          console.log(`[DOWNLOAD] ❌ PhonePe reports FAILED for order ${order.id}`);
          
          try {
            await prisma.order.update({
              where: { id: order.id },
              data: { status: 'FAILED', paymentStatus: 'FAILED' }
            });
          } catch (e) {
            console.error(`[DOWNLOAD] ⚠️ Could not update order to FAILED:`, e);
          }
          
          return NextResponse.json(
            {
              error: 'Payment failed',
              code: 'PAYMENT_FAILED',
              message: 'Your payment failed. Please try again.',
              orderId: order.id,
            },
            { status: 402 }
          );
          
        } else {
          // ⏳ Still pending at PhonePe
          console.log(`[DOWNLOAD] ⏳ PhonePe reports PENDING for order ${order.id}`);
          
          return NextResponse.json(
            {
              error: 'Payment is being processed',
              code: 'PAYMENT_PENDING',
              retryAfter: 5,
              message: 'PhonePe is processing your payment. This usually takes just a few seconds. Please wait and try again.',
              orderId: order.id,
            },
            { status: 402 }
          );
        }
        
      } catch (phonePeError) {
        // Bug 2 fix: All retries failed
        console.error(`[DOWNLOAD] ❌ PhonePe verification failed after all retries:`, phonePeError);
        
        // Don't cache errors - let user retry immediately
        // The next request will try PhonePe again
        
        return NextResponse.json(
          {
            error: 'Unable to verify payment status',
            code: 'VERIFICATION_ERROR',
            retryAfter: 5,
            message: 'We\'re having trouble verifying your payment. Please try again. If the issue persists, contact support with your Order ID.',
            orderId: order.id,
          },
          { status: 503 } // Service Unavailable
        );
      }
    }

    // Unknown order status
    console.error(`[DOWNLOAD] ❌ Unknown order status: ${order.status}`);
    return NextResponse.json(
      { 
        error: 'Payment status unknown',
        code: 'UNKNOWN_STATUS',
        message: 'Unable to determine payment status. Please contact support.',
        orderId: order.id,
      },
      { status: 500 }
    );

  } catch (error) {
    console.error('[DOWNLOAD] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to process download request' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to serve image from R2
 */
async function serveImage(job: any, type: string, jobId: string): Promise<NextResponse> {
  const imageUrl = type === 'output' ? job.outputUrl : job.originalUrl;

  if (!imageUrl) {
    console.error(`[DOWNLOAD] ❌ Image URL not found for job ${jobId} (type: ${type})`);
    
    return NextResponse.json(
      { 
        error: 'Image not ready',
        code: 'IMAGE_NOT_READY',
        message: type === 'output' 
          ? 'Your image is still being processed. Please wait a moment and refresh.'
          : 'Original image not found.',
        jobId: jobId,
      },
      { status: 404 }
    );
  }

  // Fetch the image from R2 with retry logic
  let imageResponse: Response | null = null;
  const maxRetries = 2;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[DOWNLOAD] Fetching image from R2 (attempt ${attempt}/${maxRetries})...`);
      imageResponse = await fetch(imageUrl, {
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      
      if (imageResponse.ok) {
        break;
      } else {
        console.error(`[DOWNLOAD] R2 fetch failed with status ${imageResponse.status}`);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (fetchError) {
      console.error(`[DOWNLOAD] R2 fetch error (attempt ${attempt}/${maxRetries}):`, fetchError);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  if (!imageResponse || !imageResponse.ok) {
    console.error(`[DOWNLOAD] ❌ Failed to fetch image from R2 after ${maxRetries} attempts`);
    
    return NextResponse.json(
      { 
        error: 'Image temporarily unavailable',
        code: 'R2_FETCH_FAILED',
        message: 'We\'re having trouble loading your image. Please try again in a moment. If the issue persists, contact support.',
        jobId: jobId,
      },
      { status: 500 }
    );
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
  
  // Determine filename
  const filename = type === 'output' 
    ? `colorized-${jobId}.jpg` 
    : `original-${jobId}.jpg`;

  console.log(`[DOWNLOAD] ✅ Serving image ${filename} (${imageBuffer.byteLength} bytes)`);

  // Return the image with download headers
  return new NextResponse(imageBuffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, max-age=3600', // Cache for 1 hour since image won't change
    },
  });
}


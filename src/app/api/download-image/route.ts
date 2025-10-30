import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getPhonePeOrderStatus } from '@/lib/phonepe';
import { PAYMENT_STATUS } from '@/lib/constants';
import { getCachedPaymentStatus, setCachedPaymentStatus, shouldSkipVerification } from '@/lib/payment-cache';
import { trackPurchaseServerSide } from '@/lib/facebookConversionsAPI';

export const runtime = 'nodejs';
export const maxDuration = 15; // Increased to handle PhonePe verification
export const dynamic = 'force-dynamic';

// Helper to extract transaction ID from PhonePe response
function extractTransactionId(phonePeStatus: any): string | null {
  const paymentDetails = Array.isArray(phonePeStatus.payment_details) 
    ? phonePeStatus.payment_details 
    : [];
  return paymentDetails[0]?.transactionId || null;
}

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

    // ✅ FAST PATH: If already marked as paid, serve immediately
    if (job.isPaid) {
      console.log(`[DOWNLOAD] ✅ Job ${jobId} already paid, serving image`);
      return await serveImage(job, type, jobId);
    }

    // 🔍 VERIFICATION PATH: Job not marked as paid, need to verify payment
    console.log(`[DOWNLOAD] 🔍 Job ${jobId} not marked as paid, verifying payment...`);
    
    // Find associated order
    const order = await prisma.order.findFirst({
      where: {
        metadata: {
          path: ['jobId'],
          equals: jobId,
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: {
        createdAt: 'desc', // Most recent first
      },
    });

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
      
      // Check cache first to avoid redundant PhonePe calls
      const verificationCheck = shouldSkipVerification(order.id);
      
      if (verificationCheck.skip) {
        console.log(`[DOWNLOAD] ⏭️ Skipping PhonePe call: ${verificationCheck.reason}`);
        
        if (verificationCheck.cachedStatus === 'COMPLETED') {
          // Cache says COMPLETED but DB not updated yet (race condition)
          // Try to update DB and serve
          try {
            await prisma.$transaction(async (tx: any) => {
              await tx.order.update({
                where: { id: order.id },
                data: { status: 'PAID', paymentStatus: 'SUCCESS' }
              });
              await tx.job.update({
                where: { id: jobId },
                data: { isPaid: true }
              });
            });
            console.log(`[DOWNLOAD] ✅ Updated from cache`);
            return await serveImage(job, type, jobId);
          } catch (err) {
            console.error(`[DOWNLOAD] ⚠️ DB update failed:`, err);
          }
        }
        
        if (verificationCheck.cachedStatus === 'PENDING') {
          // Recently verified as pending, ask user to wait
          return NextResponse.json(
            {
              error: 'Payment is being processed',
              code: 'PAYMENT_PENDING',
              retryAfter: 5,
              message: 'PhonePe is processing your payment. Please wait a few seconds and try again.',
              orderId: order.id,
            },
            { status: 402 }
          );
        }
      }

      // Call PhonePe to verify payment status
      try {
        console.log(`[DOWNLOAD] 📞 Calling PhonePe API for order ${order.id}...`);
        const phonePeStatus = await getPhonePeOrderStatus(order.id);
        console.log(`[DOWNLOAD] 📞 PhonePe response: ${phonePeStatus.state}`);
        
        // Cache the result
        setCachedPaymentStatus(order.id, phonePeStatus.state, 30);

        if (phonePeStatus.state === PAYMENT_STATUS.COMPLETED) {
          // ✅✅✅ PAYMENT CONFIRMED! Update everything
          console.log(`[DOWNLOAD] ✅✅✅ Payment CONFIRMED for order ${order.id}!`);
          
          const transactionId = extractTransactionId(phonePeStatus);
          
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
            
            // Update job
            await tx.job.update({
              where: { id: jobId },
              data: { isPaid: true },
            });
            
            // Create transaction record
            const existingTransaction = await tx.transaction.findFirst({
              where: {
                orderId: order.id,
                status: 'SUCCESS',
              },
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
          
          console.log(`[DOWNLOAD] ✅ Database updated successfully`);

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
          
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'FAILED', paymentStatus: 'FAILED' }
          });
          
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
        console.error(`[DOWNLOAD] ❌ PhonePe verification error:`, phonePeError);
        
        // Cache the error to prevent immediate retry
        setCachedPaymentStatus(order.id, 'ERROR', 10);
        
        return NextResponse.json(
          {
            error: 'Unable to verify payment status',
            code: 'VERIFICATION_ERROR',
            retryAfter: 10,
            message: 'We\'re having trouble verifying your payment. Please try again in a moment.',
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


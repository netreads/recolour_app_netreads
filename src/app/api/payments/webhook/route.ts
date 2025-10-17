/**
 * PhonePe Webhook Handler
 * 
 * This endpoint receives real-time payment status updates from PhonePe.
 * When properly configured, webhooks provide instant payment confirmation,
 * making the payment flow faster and more reliable.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Login to PhonePe Merchant Dashboard
 * 2. Navigate to API Configuration → Webhook Settings
 * 3. Configure webhook URL: https://yourdomain.com/api/payments/webhook
 * 4. Set webhook username and password (store in env as PHONEPE_WEBHOOK_USERNAME and PHONEPE_WEBHOOK_PASSWORD)
 * 5. Enable webhook notifications for: CHECKOUT_ORDER_COMPLETED, CHECKOUT_ORDER_FAILED
 * 
 * BENEFITS:
 * - Instant payment confirmation (no polling needed)
 * - More reliable than polling APIs
 * - Reduces "image not generated" errors
 * - Lower API call costs
 * - Better user experience with faster image delivery
 * 
 * SECURITY:
 * - PhonePe validates webhooks using SHA256 hash of username:password
 * - Authorization header must match expected hash
 * - PhonePe SDK validates the callback signature
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validatePhonePeCallback } from '@/lib/phonepe';
import { getServerEnv } from '@/lib/env';
import { PAYMENT_STATUS } from '@/lib/constants';
import { trackPurchaseServerSide } from '@/lib/facebookConversionsAPI';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface WebhookPayload {
  type?: string;
  event?: string;
  payload?: {
    state: string;
    originalMerchantOrderId?: string;
    merchantOrderId?: string; // PhonePe may use this field name
    [key: string]: unknown;
  };
}

export async function POST(request: NextRequest) {
  const env = getServerEnv();
  const timestamp = new Date().toISOString();
  
  console.log('='.repeat(80));
  console.log(`[WEBHOOK] 📥 Received webhook at ${timestamp}`);
  console.log('='.repeat(80));
  
  try {
    const body = await request.text();
    const authorization = request.headers.get('authorization') || '';
    
    console.log(`[WEBHOOK] 🔍 Request details:`);
    console.log(`[WEBHOOK]    - Body length: ${body.length} bytes`);
    console.log(`[WEBHOOK]    - Authorization header present: ${!!authorization}`);
    console.log(`[WEBHOOK]    - Remote IP: ${request.headers.get('x-forwarded-for') || 'unknown'}`);

    // Get PhonePe webhook credentials from environment
    const username = env.PHONEPE_WEBHOOK_USERNAME || '';
    const password = env.PHONEPE_WEBHOOK_PASSWORD || '';
    
    console.log(`[WEBHOOK] 🔐 Credentials check: username=${!!username}, password=${!!password}`);

    if (!username || !password) {
      console.error('[WEBHOOK] Webhook credentials not configured in environment');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    // Validate webhook authenticity using PhonePe SDK
    let callbackResponse: WebhookPayload;
    try {
      console.log('[WEBHOOK] 🔐 Validating webhook signature...');
      callbackResponse = validatePhonePeCallback(username, password, authorization, body) as WebhookPayload;
      
      console.log('[WEBHOOK] ✅ Webhook signature VALID');
      console.log('[WEBHOOK] 📦 Webhook payload:');
      console.log(`[WEBHOOK]    - Type: ${callbackResponse.type || callbackResponse.event}`);
      console.log(`[WEBHOOK]    - Order ID: ${callbackResponse.payload?.originalMerchantOrderId || callbackResponse.payload?.merchantOrderId}`);
      console.log(`[WEBHOOK]    - State: ${callbackResponse.payload?.state}`);
      
      // Log full payload in development
      if (env.NODE_ENV === 'development') {
        console.log('[WEBHOOK] 🔍 Full payload:', JSON.stringify(callbackResponse, null, 2));
      }
    } catch (error) {
      console.error('[WEBHOOK] ❌ INVALID webhook signature!');
      console.error('[WEBHOOK] ❌ Error:', error);
      console.error('[WEBHOOK] ❌ This webhook will be REJECTED');
      return NextResponse.json({ error: 'Invalid callback' }, { status: 401 });
    }

    const { type, payload, event } = callbackResponse;
    const eventType = event || type;
    const paymentState = payload?.state;

    console.log('[WEBHOOK] 🎯 Processing webhook...');
    console.log(`[WEBHOOK]    - Event type: ${eventType}`);
    console.log(`[WEBHOOK]    - Payment state: ${paymentState}`);

    // Handle different payment states
    if (eventType === 'CHECKOUT_ORDER_COMPLETED' || paymentState === PAYMENT_STATUS.COMPLETED) {
      console.log('[WEBHOOK] 💰 Payment COMPLETED - calling handlePaymentSuccess()');
      await handlePaymentSuccess(payload);
      console.log('[WEBHOOK] ✅ Payment success handler completed');
    } else if (eventType === 'CHECKOUT_ORDER_FAILED' || paymentState === PAYMENT_STATUS.FAILED) {
      console.log('[WEBHOOK] ❌ Payment FAILED - calling handlePaymentFailed()');
      await handlePaymentFailed(payload);
      console.log('[WEBHOOK] ✅ Payment failed handler completed');
    } else if (paymentState === PAYMENT_STATUS.PENDING) {
      console.log('[WEBHOOK] ⏳ Payment PENDING - calling handlePaymentPending()');
      await handlePaymentPending(payload);
      console.log('[WEBHOOK] ✅ Payment pending handler completed');
    } else {
      console.log('[WEBHOOK] ⚠️  Unhandled event type:', eventType, 'state:', paymentState);
    }

    console.log('[WEBHOOK] 🎉 Webhook processing SUCCESSFUL');
    console.log('='.repeat(80));
    
    // Always return 200 OK to PhonePe to acknowledge webhook receipt
    return NextResponse.json({ status: 'success' });

  } catch (error) {
    // Log error
    console.error('[WEBHOOK] 💥 CRITICAL ERROR processing webhook!');
    console.error('[WEBHOOK] ❌ Error:', error);
    
    if (env.NODE_ENV === 'development') {
      console.error('[WEBHOOK] 🔍 Full error details:', error);
      console.error('[WEBHOOK] 🔍 Stack trace:', (error as Error).stack);
    }
    
    console.log('='.repeat(80));
    
    // Return 200 even on error to prevent PhonePe from retrying test webhooks
    // Real order failures will be caught by the fallback polling mechanism
    return NextResponse.json(
      { status: 'error', message: 'Webhook processing failed' },
      { status: 200 }
    );
  }
}

interface PaymentData {
  originalMerchantOrderId?: string;
  merchantOrderId?: string; // PhonePe may use this field name
  amount?: number;
  state: string;
  paymentDetails?: Array<{ transactionId?: string }>;
  expireAt?: number;
  timestamp?: number;
}

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

async function handlePaymentSuccess(data: PaymentData | undefined) {
  console.log('[WEBHOOK] 🎯 handlePaymentSuccess() started');
  
  if (!data) {
    console.warn('[WEBHOOK] ⚠️  handlePaymentSuccess called with no data');
    return;
  }

  // PhonePe SDK may transform field names - handle both
  const orderId = data.originalMerchantOrderId || data.merchantOrderId;
  
  if (!orderId) {
    console.error('[WEBHOOK] ❌ No order ID found in webhook payload');
    console.error('[WEBHOOK] ❌ Payload:', data);
    return;
  }
  
  console.log(`[WEBHOOK] 📋 Processing order: ${orderId}`);
  
  const paymentDetails = Array.isArray(data.paymentDetails) ? data.paymentDetails : [];
  const paymentId = paymentDetails[0]?.transactionId || '';
  const env = getServerEnv();
  
  console.log(`[WEBHOOK] 💳 Payment ID: ${paymentId || 'none'}`);

  try {
    // Check if order already processed (idempotency)
    console.log(`[WEBHOOK] 🔍 Checking if order ${orderId} exists in database...`);
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      console.warn(`[WEBHOOK] ⚠️  Order ${orderId} not found in database`);
      console.warn(`[WEBHOOK] ⚠️  This is likely a TEST webhook from PhonePe - ignoring`);
      return; // Gracefully handle test webhooks or orders not in our system
    }
    
    console.log(`[WEBHOOK] ✅ Order ${orderId} found - status: ${existingOrder.status}`);

    if (existingOrder.status === 'PAID') {
      console.log(`[WEBHOOK] ℹ️  Order ${orderId} already marked as PAID (idempotent webhook)`);
      console.log(`[WEBHOOK] ℹ️  Skipping duplicate processing`);
      return; // Already processed, skip to avoid duplicate work
    }

    // Update order status
    console.log(`[WEBHOOK] 💾 Updating order ${orderId} to PAID status...`);
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        paymentId: paymentId,
        paymentStatus: 'SUCCESS',
      },
    });

    console.log(`[WEBHOOK] ✅✅✅ Order ${orderId} successfully marked as PAID!`);

    // Check if transaction already exists to avoid duplicates
    console.log(`[WEBHOOK] 🔍 Checking for existing transaction...`);
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        orderId: orderId,
        status: 'SUCCESS',
      },
    });

    if (!existingTransaction) {
      console.log(`[WEBHOOK] 💾 Creating new transaction record...`);
      await prisma.transaction.create({
        data: {
          orderId: orderId,
          userId: order.userId,
          credits: 0,
          amount: order.amount,
          type: 'CREDIT_PURCHASE',
          status: 'SUCCESS',
          phonePeOrderId: order.phonePeOrderId,
          paymentId: paymentId,
        },
      });
      console.log(`[WEBHOOK] ✅ Transaction record created for order ${orderId}`);
    } else {
      console.log(`[WEBHOOK] ℹ️  Transaction already exists - skipping`);
    }

    // Mark job as paid - this is critical for allowing image download!
    console.log(`[WEBHOOK] 🖼️  Checking for associated job...`);
    if (order.metadata && typeof order.metadata === 'object') {
      const metadata = order.metadata as OrderMetadata;
      if (metadata.jobId) {
        console.log(`[WEBHOOK] 🎨 Found job ID: ${metadata.jobId}`);
        try {
          // First check if job exists
          console.log(`[WEBHOOK] 🔍 Looking up job ${metadata.jobId}...`);
          const job = await prisma.job.findUnique({
            where: { id: metadata.jobId },
          });
          
          if (job) {
            console.log(`[WEBHOOK] ✅ Job ${metadata.jobId} found - status: isPaid=${job.isPaid}`);
            // Only update if not already marked as paid
            if (!job.isPaid) {
              console.log(`[WEBHOOK] 💾 Marking job ${metadata.jobId} as PAID...`);
              await prisma.job.update({
                where: { id: metadata.jobId },
                data: { isPaid: true },
              });
              console.log(`[WEBHOOK] ✅✅✅ Job ${metadata.jobId} successfully marked as PAID!`);
              console.log(`[WEBHOOK] 🎉 Customer can now download their colorized image!`);
            } else {
              console.log(`[WEBHOOK] ℹ️  Job ${metadata.jobId} already marked as paid`);
            }
          } else {
            console.error(`[WEBHOOK] ❌❌❌ Job ${metadata.jobId} NOT FOUND in database!`);
            console.error(`[WEBHOOK] ❌ Order ${orderId} is paid but job doesn't exist`);
            console.error(`[WEBHOOK] ❌ This is a DATA INTEGRITY issue!`);
          }
        } catch (jobError) {
          console.error(`[WEBHOOK] ❌ FAILED to mark job ${metadata.jobId} as paid!`);
          console.error(`[WEBHOOK] ❌ Error:`, jobError);
          // Don't throw - we've already marked the order as paid
        }
      } else {
        console.warn(`[WEBHOOK] ⚠️  Order ${orderId} has no jobId in metadata`);
        console.warn(`[WEBHOOK] ⚠️  This might be a credit purchase or old order format`);
      }
    } else {
      console.warn(`[WEBHOOK] ⚠️  Order ${orderId} has no metadata`);
    }

    // Track purchase in Facebook Conversions API
    console.log(`[WEBHOOK] 📊 Tracking Facebook conversion...`);
    try {
      const metadata = order.metadata as OrderMetadata;
      const tracking = metadata?.tracking;
      
      await trackPurchaseServerSide({
        orderId: order.id,
        jobId: metadata?.jobId,
        amount: order.amount,
        currency: 'INR',
        userId: order.userId || undefined,
        ipAddress: tracking?.ipAddress,
        userAgent: tracking?.userAgent,
        fbc: tracking?.fbc,
        fbp: tracking?.fbp,
        eventSourceUrl: tracking?.eventSourceUrl,
      });
      
      console.log(`[WEBHOOK] ✅ Facebook conversion tracked for order ${orderId}`);
    } catch (error) {
      console.error('[WEBHOOK] ⚠️  Error tracking Facebook conversion:', error);
      console.error('[WEBHOOK] ⚠️  Continuing anyway - tracking is non-critical');
      // Don't throw - tracking failure shouldn't block payment processing
    }
    
    console.log(`[WEBHOOK] 🎉 Payment success handling complete for order ${orderId}`);

  } catch (error) {
    console.error(`[WEBHOOK] ❌ ERROR in handlePaymentSuccess for order ${orderId}`);
    console.error('[WEBHOOK] ❌ Error:', error);
    throw error; // Re-throw to trigger webhook retry by PhonePe
  }
}

async function handlePaymentFailed(data: PaymentData | undefined) {
  if (!data) return;

  const orderId = data.originalMerchantOrderId || data.merchantOrderId;
  if (!orderId) return;
  const paymentDetails = Array.isArray(data.paymentDetails) ? data.paymentDetails : [];
  const paymentId = paymentDetails[0]?.transactionId || '';

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return;
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'FAILED',
        paymentId: paymentId,
        paymentStatus: 'FAILED',
      },
    });

    await prisma.transaction.create({
      data: {
        orderId: orderId,
        userId: order.userId,
        credits: 0,
        amount: 0,
        type: 'CREDIT_PURCHASE',
        status: 'FAILED',
        phonePeOrderId: order.phonePeOrderId,
        paymentId: paymentId,
      },
    });

  } catch (error) {
    const env = getServerEnv();
    if (env.NODE_ENV === 'development') {
      console.error('Error handling payment failure:', error);
    }
    throw error;
  }
}

async function handlePaymentPending(data: PaymentData | undefined) {
  if (!data) return;

  const orderId = data.originalMerchantOrderId || data.merchantOrderId;
  if (!orderId) return;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return;
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
    });

  } catch (error) {
    const env = getServerEnv();
    if (env.NODE_ENV === 'development') {
      console.error('Error handling payment pending:', error);
    }
    throw error;
  }
}

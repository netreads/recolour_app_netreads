import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validatePhonePeCallback } from '@/lib/phonepe';
import { getServerEnv } from '@/lib/env';
import { PAYMENT_STATUS, API_CONFIG } from '@/lib/constants';
import { trackPurchaseServerSide } from '@/lib/facebookConversionsAPI';

export const runtime = 'nodejs';

// Set max duration to prevent unexpected costs from long-running functions
export const maxDuration = 60;

interface WebhookPayload {
  type?: string;
  event?: string;
  payload?: {
    state: string;
    originalMerchantOrderId: string;
    [key: string]: unknown;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const authorization = request.headers.get('authorization') || '';
    const env = getServerEnv();

    // Get PhonePe webhook credentials from environment
    const username = env.PHONEPE_WEBHOOK_USERNAME || '';
    const password = env.PHONEPE_WEBHOOK_PASSWORD || '';

    if (!username || !password) {
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    // Validate PhonePe callback
    let callbackResponse: WebhookPayload;
    try {
      callbackResponse = validatePhonePeCallback(username, password, authorization, body) as WebhookPayload;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid callback' }, { status: 401 });
    }

    const { type, payload, event } = callbackResponse;

    // Use event field instead of deprecated type parameter
    // Rely only on payload.state field for payment status
    const eventType = event || type;
    const paymentState = payload?.state;

    if (eventType === 'CHECKOUT_ORDER_COMPLETED' || paymentState === PAYMENT_STATUS.COMPLETED) {
      await handlePaymentSuccess(payload);
    } else if (eventType === 'CHECKOUT_ORDER_FAILED' || paymentState === PAYMENT_STATUS.FAILED) {
      await handlePaymentFailed(payload);
    } else if (paymentState === PAYMENT_STATUS.PENDING) {
      await handlePaymentPending(payload);
    }

    return NextResponse.json({ status: 'success' });

  } catch (error) {
    const env = getServerEnv();
    if (env.NODE_ENV === 'development') {
      console.error('Webhook error:', error);
    }
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

interface PaymentData {
  originalMerchantOrderId: string;
  amount?: number;
  state: string;
  paymentDetails?: Array<{ transactionId?: string }>;
  expireAt?: number;
  timestamp?: number;
}

interface OrderMetadata {
  jobId?: string;
}

async function handlePaymentSuccess(data: PaymentData | undefined) {
  if (!data) return;

  const orderId = data.originalMerchantOrderId;
  const paymentDetails = Array.isArray(data.paymentDetails) ? data.paymentDetails : [];
  const paymentId = paymentDetails[0]?.transactionId || '';

  try {
    // Update order status
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        paymentId: paymentId,
        paymentStatus: 'SUCCESS',
      },
    });

    // Create transaction record
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

    // Mark job as paid if this is a single image purchase
    if (order.metadata && typeof order.metadata === 'object') {
      const metadata = order.metadata as OrderMetadata;
      if (metadata.jobId) {
        await prisma.job.update({
          where: { id: metadata.jobId },
          data: { isPaid: true },
        });
      }
    }

    // Track purchase via Facebook Conversions API (server-side)
    // This bypasses ad blockers and browser privacy settings
    try {
      await trackPurchaseServerSide({
        orderId: order.id,
        jobId: (order.metadata as OrderMetadata)?.jobId,
        amount: order.amount,
        currency: 'INR',
        userId: order.userId || undefined,
      });
    } catch (error) {
      // Silent fail - don't break webhook processing if tracking fails
      const env = getServerEnv();
      if (env.NODE_ENV === 'development') {
        console.error('Error tracking purchase server-side:', error);
      }
    }

  } catch (error) {
    const env = getServerEnv();
    if (env.NODE_ENV === 'development') {
      console.error('Error handling payment success:', error);
    }
    throw error;
  }
}

async function handlePaymentFailed(data: PaymentData | undefined) {
  if (!data) return;

  const orderId = data.originalMerchantOrderId;
  const paymentDetails = Array.isArray(data.paymentDetails) ? data.paymentDetails : [];
  const paymentId = paymentDetails[0]?.transactionId || '';

  try {
    // Get order to fetch userId
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return;
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'FAILED',
        paymentId: paymentId,
        paymentStatus: 'FAILED',
      },
    });

    // Create failed transaction record
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

  const orderId = data.originalMerchantOrderId;

  try {
    // Get order to check current status
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return;
    }

    // Update order status to reflect pending state
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
    });

    // Note: For PENDING transactions, implement reconciliation
    // This webhook indicates the transaction is still in progress
    // The reconciliation schedule should be triggered here or via a background job

  } catch (error) {
    const env = getServerEnv();
    if (env.NODE_ENV === 'development') {
      console.error('Error handling payment pending:', error);
    }
    throw error;
  }
}

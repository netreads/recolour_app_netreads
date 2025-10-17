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

    let callbackResponse: WebhookPayload;
    try {
      callbackResponse = validatePhonePeCallback(username, password, authorization, body) as WebhookPayload;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid callback' }, { status: 401 });
    }

    const { type, payload, event } = callbackResponse;
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

    // Check if transaction already exists to avoid duplicates
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        orderId: orderId,
        status: 'SUCCESS',
      },
    });

    if (!existingTransaction) {
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
    }

    // Mark job as paid - this is critical!
    if (order.metadata && typeof order.metadata === 'object') {
      const metadata = order.metadata as OrderMetadata;
      if (metadata.jobId) {
        try {
          // First check if job exists
          const job = await prisma.job.findUnique({
            where: { id: metadata.jobId },
          });
          
          if (job) {
            // Only update if not already marked as paid
            if (!job.isPaid) {
              await prisma.job.update({
                where: { id: metadata.jobId },
                data: { isPaid: true },
              });
            }
          } else {
            console.error(`Webhook: Job ${metadata.jobId} not found for paid order ${orderId}`);
          }
        } catch (jobError) {
          console.error(`Webhook: Failed to mark job ${metadata.jobId} as paid:`, jobError);
          // Don't throw - we've already marked the order as paid
        }
      } else {
        console.warn(`Webhook: Order ${orderId} has no jobId in metadata`);
      }
    }

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
    } catch (error) {
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

  const orderId = data.originalMerchantOrderId;

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

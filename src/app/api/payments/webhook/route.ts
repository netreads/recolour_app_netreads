import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validatePhonePeCallback } from '@/lib/phonepe';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const authorization = request.headers.get('authorization') || '';

    // Get PhonePe webhook credentials from environment
    const username = process.env.PHONEPE_WEBHOOK_USERNAME || '';
    const password = process.env.PHONEPE_WEBHOOK_PASSWORD || '';

    if (!username || !password) {
      console.error('PhonePe webhook credentials not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    // Validate PhonePe callback
    let callbackResponse;
    try {
      callbackResponse = validatePhonePeCallback(username, password, authorization, body);
    } catch (error) {
      console.error('Invalid PhonePe callback:', error);
      return NextResponse.json({ error: 'Invalid callback' }, { status: 401 });
    }

    const { type, payload, event } = callbackResponse;

    console.log('Webhook payload received:', {
      type: type, // deprecated - use event field instead
      event: event, // use this field instead of type
      payloadState: payload?.state, // rely only on payload.state field
      orderId: payload?.originalMerchantOrderId
    });

    // Use event field instead of deprecated type parameter
    // Rely only on payload.state field for payment status
    const eventType = event || type; // fallback to type if event not available
    const paymentState = payload?.state;

    if (eventType === 'CHECKOUT_ORDER_COMPLETED' || paymentState === 'COMPLETED') {
      await handlePaymentSuccess(payload);
    } else if (eventType === 'CHECKOUT_ORDER_FAILED' || paymentState === 'FAILED') {
      await handlePaymentFailed(payload);
    } else if (paymentState === 'PENDING') {
      await handlePaymentPending(payload);
    } else {
      console.log('Unhandled webhook event:', { eventType, paymentState });
    }

    return NextResponse.json({ status: 'success' });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(data: any) {
  const { originalMerchantOrderId, amount, state, paymentDetails, expireAt, timestamp } = data;
  const orderId = originalMerchantOrderId;
  const paymentId = paymentDetails?.[0]?.transactionId || '';

  console.log('Handling payment success:', {
    orderId,
    state,
    paymentId,
    expireAt: expireAt ? new Date(expireAt) : null, // expireAt is epoch timestamp in milliseconds
    timestamp: timestamp ? new Date(timestamp) : null // timestamp is epoch timestamp in milliseconds
  });

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
        credits: 0, // No credits for single image purchases
        amount: order.amount,
        type: 'CREDIT_PURCHASE',
        status: 'SUCCESS',
        phonePeOrderId: order.phonePeOrderId,
        paymentId: paymentId,
      },
    });

    // No credits to add for single image purchases

    // Mark job as paid if this is a single image purchase
    if (order.metadata && typeof order.metadata === 'object') {
      const metadata = order.metadata as any;
      if (metadata.jobId) {
        await prisma.job.update({
          where: { id: metadata.jobId },
          data: { isPaid: true },
        });
        console.log(`Marked job ${metadata.jobId} as paid`);
      }
    }

  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

async function handlePaymentFailed(data: any) {
  const { originalMerchantOrderId, paymentDetails, errorCode } = data;
  const orderId = originalMerchantOrderId;
  const paymentId = paymentDetails?.[0]?.transactionId || '';

  try {
    // Get order to fetch userId
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      console.error('Order not found for failed payment:', orderId);
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
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

async function handlePaymentPending(data: any) {
  const { originalMerchantOrderId, amount, state, expireAt, timestamp } = data;
  const orderId = originalMerchantOrderId;

  console.log('Handling payment pending:', {
    orderId,
    state,
    expireAt: expireAt ? new Date(expireAt) : null, // expireAt is epoch timestamp in milliseconds
    timestamp: timestamp ? new Date(timestamp) : null // timestamp is epoch timestamp in milliseconds
  });

  try {
    // Get order to check current status
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      console.error('Order not found for pending payment:', orderId);
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

    // Note: For PENDING transactions, we should implement reconciliation
    // This webhook indicates the transaction is still in progress
    // The reconciliation schedule should be triggered here or via a background job
    console.log(`Payment pending for order ${orderId} - reconciliation should be scheduled`);

  } catch (error) {
    console.error('Error handling payment pending:', error);
    throw error;
  }
}

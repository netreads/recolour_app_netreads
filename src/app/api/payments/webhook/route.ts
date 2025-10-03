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

    const { type, payload } = callbackResponse;

    if (type === 'CHECKOUT_ORDER_COMPLETED') {
      await handlePaymentSuccess(payload);
    } else if (type === 'CHECKOUT_ORDER_FAILED') {
      await handlePaymentFailed(payload);
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
  const { originalMerchantOrderId, amount, state, paymentDetails } = data;
  const orderId = originalMerchantOrderId;
  const paymentId = paymentDetails?.[0]?.transactionId || '';

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
        credits: order.credits,
        amount: order.amount,
        type: 'CREDIT_PURCHASE',
        status: 'SUCCESS',
        phonePeOrderId: order.phonePeOrderId,
        paymentId: paymentId,
      },
    });

    // Add credits to user account
    await prisma.user.update({
      where: { id: order.userId },
      data: {
        credits: {
          increment: order.credits,
        },
      },
    });

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

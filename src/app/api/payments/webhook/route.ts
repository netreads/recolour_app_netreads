import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateWebhookSignature } from '@/lib/cashfree';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-webhook-signature') || '';

    // Validate webhook signature
    if (!validateWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const webhookData = JSON.parse(body);
    const { type, data } = webhookData;


    if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
      await handlePaymentSuccess(data);
    } else if (type === 'PAYMENT_FAILED_WEBHOOK') {
      await handlePaymentFailed(data);
    } else if (type === 'PAYMENT_USER_DROPPED_WEBHOOK') {
      await handlePaymentDropped(data);
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
  const { orderId, paymentId, paymentAmount, paymentStatus } = data;

  try {
    // Update order status
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        paymentId: paymentId,
        paymentStatus: paymentStatus,
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
        cashfreeOrderId: order.cashfreeOrderId,
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
  const { orderId, paymentId, paymentStatus } = data;

  try {
    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'FAILED',
        paymentId: paymentId,
        paymentStatus: paymentStatus,
      },
    });

    // Create failed transaction record
    await prisma.transaction.create({
      data: {
        orderId: orderId,
        userId: data.userId || '', // This might need to be fetched from order
        credits: 0,
        amount: 0,
        type: 'CREDIT_PURCHASE',
        status: 'FAILED',
        cashfreeOrderId: data.cfOrderId,
        paymentId: paymentId,
      },
    });


  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

async function handlePaymentDropped(data: any) {
  const { orderId } = data;

  try {
    // Update order status to cancelled
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
      },
    });


  } catch (error) {
    console.error('Error handling payment dropped:', error);
    throw error;
  }
}

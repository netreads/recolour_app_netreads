import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getPhonePeOrderStatus } from '@/lib/phonepe';
import { PAYMENT_STATUS, ORDER_STATUS, API_CONFIG } from '@/lib/constants';
import { getServerEnv } from '@/lib/env';

export const runtime = 'nodejs';

// Set max duration to prevent unexpected costs from long-running functions
export const maxDuration = API_CONFIG.API_MAX_DURATION;

interface OrderMetadata {
  jobId?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const env = getServerEnv();

    // Get order details (allow anonymous orders)
    let order = await prisma.order.findFirst({
      where: {
        id: orderId,
      },
      include: {
        transactions: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let success = order.status === ORDER_STATUS.PAID;
    let transaction = order.transactions.find(t => t.status === 'SUCCESS');

    // If not marked paid yet, verify with PhonePe and update
    if (!success && order.phonePeOrderId) {
      try {
        const paymentStatus = await getPhonePeOrderStatus(order.id);
        
        if (paymentStatus.state === PAYMENT_STATUS.COMPLETED) {
          const paymentDetails = Array.isArray(paymentStatus.payment_details) ? paymentStatus.payment_details : [];
          const transactionId = paymentDetails[0]?.transactionId || order.paymentId || null;
          
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
          const hasSuccessTxn = updated.transactions.some(t => t.status === 'SUCCESS');
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

          order = updated;
          success = true;
          transaction = updated.transactions.find(t => t.status === 'SUCCESS') || transaction;
        } else if (paymentStatus.state === PAYMENT_STATUS.FAILED) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: ORDER_STATUS.FAILED,
              paymentStatus: 'FAILED',
            },
          });
          order.status = ORDER_STATUS.FAILED;
        } else if (paymentStatus.state === PAYMENT_STATUS.PENDING) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: ORDER_STATUS.PENDING,
              paymentStatus: 'PENDING',
            },
          });
          order.status = ORDER_STATUS.PENDING;
        }
      } catch (e) {
        if (env.NODE_ENV === 'development') {
          console.error('Error checking payment status:', e);
        }
        // Ignore error and surface DB status
      }
    }

    // Extract jobId from metadata if it's a single image purchase
    const metadata = (order as any).metadata as OrderMetadata;
    const jobId = metadata?.jobId || null;
    
    return NextResponse.json({
      success,
      orderId: order.id,
      amount: success ? order.amount : 0,
      status: order.status,
      jobId: jobId,
      message: success 
        ? 'Payment successful! Your image is ready.'
        : `Payment ${order.status.toLowerCase()}`,
    });

  } catch (error) {
    const env = getServerEnv();
    if (env.NODE_ENV === 'development') {
      console.error('Error checking payment status:', error);
    }
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}

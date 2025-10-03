import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getPhonePeOrderStatus } from '@/lib/phonepe';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Get order details
    let order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
      },
      include: {
        transactions: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let finalOrder = order;
    let success = finalOrder.status === 'PAID';
    let transaction = finalOrder.transactions.find(t => t.status === 'SUCCESS');

    // If not marked paid yet, verify with PhonePe and update
    if (!success && finalOrder.phonePeOrderId) {
      try {
        const pp = await getPhonePeOrderStatus(finalOrder.id);
        // state can be PENDING | COMPLETED | FAILED
        if (pp?.state === 'COMPLETED') {
          const updated = await prisma.order.update({
            where: { id: finalOrder.id },
            data: {
              status: 'PAID',
              paymentId: pp?.payment_details?.[0]?.transactionId || finalOrder.paymentId || null,
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
                credits: updated.credits,
                amount: updated.amount,
                type: 'CREDIT_PURCHASE',
                status: 'SUCCESS',
                phonePeOrderId: updated.phonePeOrderId,
                paymentId: updated.paymentId || undefined,
              },
            });
          }

          // Credit user if not already credited
          await prisma.user.update({
            where: { id: updated.userId },
            data: { credits: { increment: updated.credits } },
          });

          finalOrder = updated as any;
          success = true;
          transaction = updated.transactions.find(t => t.status === 'SUCCESS') || transaction;
        }
      } catch (e) {
        // ignore; surface DB status
      }
    }

    return NextResponse.json({
      success,
      orderId: finalOrder.id,
      credits: success ? finalOrder.credits : 0,
      amount: success ? finalOrder.amount : 0,
      status: finalOrder.status,
      message: success 
        ? `Successfully added ${finalOrder.credits} credits to your account`
        : `Payment ${finalOrder.status.toLowerCase()}`,
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}

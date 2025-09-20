import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getCashfreeOrder } from '@/lib/cashfree';

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

    // If not marked paid yet, verify with Cashfree and update
    if (!success && finalOrder.cashfreeOrderId) {
      try {
        const cf = await getCashfreeOrder(finalOrder.id);
        // order_status can be ACTIVE | PAID | EXPIRED | TERMINATED
        if (cf?.order_status === 'PAID') {
          const updated = await prisma.order.update({
            where: { id: finalOrder.id },
            data: {
              status: 'PAID',
              paymentId: cf?.payments?.[0]?.cf_payment_id || finalOrder.paymentId || null,
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
                cashfreeOrderId: updated.cashfreeOrderId,
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

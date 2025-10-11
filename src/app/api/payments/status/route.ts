import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getPhonePeOrderStatus, reconcilePendingTransaction } from '@/lib/phonepe';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Get order details (allow anonymous orders)
    let order = await (prisma as any).order.findFirst({
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

    let finalOrder = order;
    let success = finalOrder.status === 'PAID';
    let transaction = finalOrder.transactions.find((t: any) => t.status === 'SUCCESS');

    // If not marked paid yet, verify with PhonePe and update
    if (!success && finalOrder.phonePeOrderId) {
      try {
        const pp = await getPhonePeOrderStatus(finalOrder.id);
        console.log('Payment status check result:', {
          orderId: finalOrder.id,
          state: pp?.state,
          isCompleted: pp?.isCompleted,
          isFailed: pp?.isFailed,
          isPending: pp?.isPending
        });

        // Use root-level state parameter to determine payment status
        // COMPLETED → Payment Successful
        // FAILED → Payment failed
        // PENDING → Payment in progress
        
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
                credits: 0, // No credits for single image purchases
                amount: updated.amount,
                type: 'CREDIT_PURCHASE',
                status: 'SUCCESS',
                phonePeOrderId: updated.phonePeOrderId,
                paymentId: updated.paymentId || undefined,
              },
            });
          }

          // No credits to add for single image purchases

          finalOrder = updated as any;
          success = true;
          transaction = updated.transactions.find((t: any) => t.status === 'SUCCESS') || transaction;
        } else if (pp?.state === 'FAILED') {
          // Update order status to failed
          await prisma.order.update({
            where: { id: finalOrder.id },
            data: {
              status: 'FAILED',
              paymentStatus: 'FAILED',
            },
          });
          finalOrder.status = 'FAILED';
        } else if (pp?.state === 'PENDING') {
          // For PENDING transactions, we have two options:
          // Option 1: Mark as Failed and reconcile in background
          // Option 2: Mark as Pending and reconcile until terminal status
          
          // We'll implement Option 2: Mark as Pending
          await prisma.order.update({
            where: { id: finalOrder.id },
            data: {
              status: 'PENDING',
              paymentStatus: 'PENDING',
            },
          });
          finalOrder.status = 'PENDING';
          
          // Note: In a production environment, you should trigger background reconciliation here
          // For now, we'll log that reconciliation should be scheduled
          console.log(`PENDING transaction detected for order ${finalOrder.id} - reconciliation should be scheduled`);
        }
      } catch (e) {
        console.error('Error checking payment status:', e);
        // ignore; surface DB status
      }
    }

    // Extract jobId from metadata if it's a single image purchase
    const jobId = (finalOrder.metadata as any)?.jobId || null;
    
    return NextResponse.json({
      success,
      orderId: finalOrder.id,
      amount: success ? finalOrder.amount : 0,
      status: finalOrder.status,
      jobId: jobId, // Include jobId for single image purchases
      message: success 
        ? `Payment successful! Your image is ready.`
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

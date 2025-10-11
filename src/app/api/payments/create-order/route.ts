import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createPhonePeOrder, generateOrderId } from '@/lib/phonepe';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // All users are anonymous
    const user = null;

    const { jobId } = await request.json();

    // Only support single image purchases (49 Rs)
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required for single image purchase' }, { status: 400 });
    }

    const orderConfig = {
      name: 'Single Image Colorization',
      amount: 4900, // 49 Rs in paise
    };

    const orderId = generateOrderId();

    // Derive base URL from env or request (for return/notify)
    const origin = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || '';
    if (!process.env.PHONEPE_CLIENT_ID || !process.env.PHONEPE_CLIENT_SECRET) {
      return NextResponse.json({ 
        error: 'Payment gateway not configured. Please set PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET environment variables.' 
      }, { status: 500 });
    }

    // Create order in database (all purchases are anonymous, no credits)
    const order = await (prisma as any).order.create({
      data: {
        id: orderId,
        packageName: orderConfig.name,
        credits: 0, // No credits for single image purchases
        amount: orderConfig.amount,
        currency: 'INR',
        status: 'PENDING',
        metadata: { jobId }, // Store jobId for single image purchases
      },
    });

    // Create PhonePe order (amount in rupees)
    const phonePeOrder = await createPhonePeOrder({
      orderId, // Unique merchantOrderId
      orderAmountRupees: orderConfig.amount / 100, // Amount will be converted to paise
      orderNote: `Single Image Colorization - ₹49`,
      customerDetails: {
        customerId: orderId, // Use orderId as customerId for anonymous
        customerName: 'Guest User',
        customerEmail: `${orderId}@guest.recolor.ai`,
        customerPhone: '9999999999',
      },
      returnUrl: `${origin}/payment/success?order_id=${orderId}&job_id=${jobId}`,
      notifyUrl: `${origin}/api/payments/webhook`,
      expireAfter: 3600, // Order expiry in seconds (1 hour, within 300-3600 range for Standard Checkout)
    });

    // Update order with PhonePe order ID
    await (prisma as any).order.update({
      where: { id: orderId },
      data: { phonePeOrderId: String(phonePeOrder.orderId) },
    });

    return NextResponse.json({
      orderId: orderId,
      redirectUrl: phonePeOrder.redirectUrl,
      orderAmount: orderConfig.amount,
      orderCurrency: 'INR',
      state: phonePeOrder.state,
      expireAt: phonePeOrder.expireAt,
    });

  } catch (error: any) {
    const status = error?.status && Number.isInteger(error.status) ? error.status : 500;
    const message = error?.message || 'Failed to create order';
    console.error('Error creating order:', {
      status,
      message,
      details: error?.details,
    });
    return NextResponse.json({ error: message }, { status });
  }
}

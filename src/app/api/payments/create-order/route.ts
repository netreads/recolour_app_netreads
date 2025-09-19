import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createCashfreeOrder, CREDIT_PACKAGES, CreditPackageType, generateOrderId } from '@/lib/cashfree';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { packageType } = await request.json();

    if (!packageType || !(packageType in CREDIT_PACKAGES)) {
      return NextResponse.json({ error: 'Invalid package type' }, { status: 400 });
    }

    const packageConfig = CREDIT_PACKAGES[packageType as CreditPackageType];
    const orderId = generateOrderId();

    // Derive base URL from env or request (for return/notify)
    const origin = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || '';
    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
    }

    // Create order in database
    const order = await (prisma as any).order.create({
      data: {
        id: orderId,
        userId: session.user.id,
        packageName: packageConfig.name,
        credits: packageConfig.credits,
        amount: packageConfig.amount,
        currency: 'INR',
        status: 'PENDING',
      },
    });

    // Create Cashfree order via REST helper (amount in rupees)
    const cashfreeOrder = await createCashfreeOrder({
      orderId,
      orderAmountRupees: packageConfig.amount / 100,
      orderNote: `Purchase ${packageConfig.credits} credits - ${packageConfig.name}`,
      customerDetails: {
        customerId: session.user.id,
        customerName: session.user.name || session.user.email,
        customerEmail: session.user.email,
        customerPhone: '9999999999',
      },
      returnUrl: `${origin}/payment/success?order_id=${orderId}`,
      notifyUrl: `${origin}/api/payments/webhook`,
    });

    // Update order with Cashfree order ID
    await (prisma as any).order.update({
      where: { id: orderId },
      data: { cashfreeOrderId: String(cashfreeOrder.cfOrderId) },
    });

    return NextResponse.json({
      orderId: orderId,
      paymentSessionId: cashfreeOrder.paymentSessionId,
      orderAmount: packageConfig.amount,
      orderCurrency: 'INR',
      customerDetails: cashfreeOrder.customerDetails,
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

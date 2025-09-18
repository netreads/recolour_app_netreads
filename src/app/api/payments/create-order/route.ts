import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { cashfree, CREDIT_PACKAGES, CreditPackageType, generateOrderId } from '@/lib/cashfree';

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

    // Create order in database
    const order = await prisma.order.create({
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

    // Create Cashfree order
    const cashfreeOrder = await cashfree.orders.createOrder({
      orderId: orderId,
      orderAmount: packageConfig.amount,
      orderCurrency: 'INR',
      orderNote: `Purchase ${packageConfig.credits} credits - ${packageConfig.name}`,
      customerDetails: {
        customerId: session.user.id,
        customerName: session.user.name || session.user.email,
        customerEmail: session.user.email,
        customerPhone: '9999999999', // Default phone number
      },
      orderMeta: {
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?order_id=${orderId}`,
        notifyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
      },
    });

    // Update order with Cashfree order ID
    await prisma.order.update({
      where: { id: orderId },
      data: {
        cashfreeOrderId: cashfreeOrder.cfOrderId,
      },
    });

    return NextResponse.json({
      orderId: orderId,
      paymentSessionId: cashfreeOrder.paymentSessionId,
      orderAmount: packageConfig.amount,
      orderCurrency: 'INR',
      customerDetails: cashfreeOrder.customerDetails,
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

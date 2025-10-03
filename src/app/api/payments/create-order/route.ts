import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createPhonePeOrder, CREDIT_PACKAGES, CreditPackageType, generateOrderId } from '@/lib/phonepe';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getServerUser();

    if (!user) {
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
    if (!process.env.PHONEPE_CLIENT_ID || !process.env.PHONEPE_CLIENT_SECRET) {
      return NextResponse.json({ 
        error: 'Payment gateway not configured. Please set PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET environment variables.' 
      }, { status: 500 });
    }

    // Create order in database
    const order = await (prisma as any).order.create({
      data: {
        id: orderId,
        userId: user.id,
        packageName: packageConfig.name,
        credits: packageConfig.credits,
        amount: packageConfig.amount,
        currency: 'INR',
        status: 'PENDING',
      },
    });

    // Create PhonePe order (amount in rupees)
    const phonePeOrder = await createPhonePeOrder({
      orderId, // Unique merchantOrderId
      orderAmountRupees: packageConfig.amount / 100, // Amount will be converted to paise
      orderNote: `Purchase ${packageConfig.credits} credits - ${packageConfig.name}`,
      customerDetails: {
        customerId: user.id,
        customerName: user.user_metadata?.name || user.email || 'User',
        customerEmail: user.email || '',
        customerPhone: '9999999999',
      },
      returnUrl: `${origin}/payment/success?order_id=${orderId}`, // paymentFlow.redirectUrl
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
      orderAmount: packageConfig.amount,
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

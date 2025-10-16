import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createPhonePeOrder, generateOrderId } from '@/lib/phonepe';
import { PRICING, API_CONFIG } from '@/lib/constants';
import { getServerEnv } from '@/lib/env';

export const runtime = 'nodejs';

// Set max duration to prevent unexpected costs from long-running functions
export const maxDuration = 30; // Reduced from 60s to save costs

export async function POST(request: NextRequest) {
  try {
    const { jobId } = await request.json();

    // Validate jobId
    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json({ error: 'Valid Job ID is required for single image purchase' }, { status: 400 });
    }

    const orderId = generateOrderId();
    const env = getServerEnv();

    // Derive base URL from env or request (for return/notify)
    const origin = env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || '';

    // Capture user data for Facebook Conversions API tracking
    // This data is essential for Facebook's Event Match Quality (EMQ) and proper attribution
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     request.headers.get('x-real-ip') || 
                     request.headers.get('cf-connecting-ip') || // Cloudflare
                     undefined;
    const userAgent = request.headers.get('user-agent') || undefined;
    const referer = request.headers.get('referer') || origin || undefined;
    
    // Facebook cookies for improved event matching
    // These are critical for deduplication between browser and server events
    const cookies = request.headers.get('cookie') || '';
    const fbcMatch = cookies.match(/_fbc=([^;]+)/);
    const fbpMatch = cookies.match(/_fbp=([^;]+)/);
    const fbc = fbcMatch ? fbcMatch[1] : undefined;
    const fbp = fbpMatch ? fbpMatch[1] : undefined;

    // Create order in database (all purchases are anonymous, no credits)
    await prisma.order.create({
      data: {
        id: orderId,
        packageName: PRICING.SINGLE_IMAGE.NAME,
        credits: 0,
        amount: PRICING.SINGLE_IMAGE.PAISE,
        currency: 'INR',
        status: 'PENDING',
        metadata: { 
          jobId,
          // User data for Facebook Conversions API tracking
          tracking: {
            ipAddress,
            userAgent,
            eventSourceUrl: referer,
            fbc, // Facebook click ID
            fbp, // Facebook browser ID
            timestamp: Date.now(),
          }
        },
      },
    } as any); // Cast to bypass Prisma type checking for Json field

    // Create PhonePe order (amount in rupees)
    const phonePeOrder = await createPhonePeOrder({
      orderId,
      orderAmountRupees: PRICING.SINGLE_IMAGE.RUPEES,
      orderNote: `${PRICING.SINGLE_IMAGE.NAME} - ₹${PRICING.SINGLE_IMAGE.RUPEES}`,
      customerDetails: {
        customerId: orderId,
        customerName: 'Guest User',
        customerEmail: `${orderId}@guest.recolor.ai`,
        customerPhone: '9999999999',
      },
      returnUrl: `${origin}/payment/success?order_id=${orderId}&job_id=${jobId}`,
      notifyUrl: `${origin}/api/payments/webhook`,
      expireAfter: API_CONFIG.ORDER_EXPIRY_SECONDS,
    });

    // Update order with PhonePe order ID
    await prisma.order.update({
      where: { id: orderId },
      data: { phonePeOrderId: String(phonePeOrder.orderId) },
    });

    return NextResponse.json({
      orderId: orderId,
      redirectUrl: phonePeOrder.redirectUrl,
      orderAmount: PRICING.SINGLE_IMAGE.PAISE,
      orderCurrency: 'INR',
      state: phonePeOrder.state,
      expireAt: phonePeOrder.expireAt,
    });

  } catch (error: unknown) {
    const env = getServerEnv();
    const err = error as Error & { status?: number; details?: unknown };
    const status = err.status && Number.isInteger(err.status) ? err.status : 500;
    const message = err.message || 'Failed to create order';
    
    if (env.NODE_ENV === 'development') {
      console.error('Error creating order:', { status, message, details: err.details });
    }
    
    return NextResponse.json({ error: message }, { status });
  }
}

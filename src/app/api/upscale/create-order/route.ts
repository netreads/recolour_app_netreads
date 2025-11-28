import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createPhonePeOrder, generateOrderId } from '@/lib/phonepe';
import { PRICING, API_CONFIG, UpscaleTier } from '@/lib/constants';
import { getServerEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { jobId, tier } = await request.json();

    // Validate jobId
    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json({ error: 'Valid Job ID is required' }, { status: 400 });
    }

    // Validate tier
    if (!tier || !['2K', '4K', '6K'].includes(tier)) {
      return NextResponse.json({ error: 'Valid upscale tier is required (2K, 4K, or 6K)' }, { status: 400 });
    }

    const upscaleTier = tier as UpscaleTier;
    const upscaleConfig = PRICING.UPSCALE[upscaleTier];

    // Check if job exists and is paid
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (!job.isPaid) {
      return NextResponse.json({ error: 'Original image must be purchased first' }, { status: 402 });
    }

    if (!job.outputUrl) {
      return NextResponse.json({ error: 'Colorized image not ready yet' }, { status: 400 });
    }

    const orderId = generateOrderId();
    const env = getServerEnv();

    // Derive base URL from env or request
    const origin = env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || '';

    // Capture user data for tracking
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     request.headers.get('x-real-ip') || 
                     request.headers.get('cf-connecting-ip') || 
                     undefined;
    const userAgent = request.headers.get('user-agent') || undefined;
    const referer = request.headers.get('referer') || origin || undefined;
    
    // Facebook cookies for event matching
    const cookies = request.headers.get('cookie') || '';
    const fbcMatch = cookies.match(/_fbc=([^;]+)/);
    const fbpMatch = cookies.match(/_fbp=([^;]+)/);
    const fbc = fbcMatch ? fbcMatch[1] : undefined;
    const fbp = fbpMatch ? fbpMatch[1] : undefined;

    // Create upscale order in database
    await prisma.order.create({
      data: {
        id: orderId,
        packageName: upscaleConfig.NAME,
        credits: 0,
        amount: upscaleConfig.PAISE,
        currency: 'INR',
        status: 'PENDING',
        metadata: { 
          jobId,
          type: 'upscale',
          tier: upscaleTier,
          factor: upscaleConfig.FACTOR,
          resolution: upscaleConfig.RESOLUTION,
          sourceImageUrl: job.outputUrl,
          tracking: {
            ipAddress,
            userAgent,
            eventSourceUrl: referer,
            fbc,
            fbp,
            timestamp: Date.now(),
          }
        },
      },
    } as any);

    // Create PhonePe order
    const phonePeOrder = await createPhonePeOrder({
      orderId,
      orderAmountRupees: upscaleConfig.RUPEES,
      orderNote: `${upscaleConfig.NAME} - ₹${upscaleConfig.RUPEES}`,
      customerDetails: {
        customerId: orderId,
        customerName: 'Guest User',
        customerEmail: `${orderId}@guest.recolor.ai`,
        customerPhone: '9999999999',
      },
      returnUrl: `${origin}/payment/upscale-success?order_id=${orderId}&job_id=${jobId}&tier=${upscaleTier}`,
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
      orderAmount: upscaleConfig.PAISE,
      orderCurrency: 'INR',
      tier: upscaleTier,
      resolution: upscaleConfig.RESOLUTION,
      state: phonePeOrder.state,
      expireAt: phonePeOrder.expireAt,
    });

  } catch (error: unknown) {
    const env = getServerEnv();
    const err = error as Error & { status?: number; details?: unknown };
    const status = err.status && Number.isInteger(err.status) ? err.status : 500;
    const message = err.message || 'Failed to create upscale order';
    
    if (env.NODE_ENV === 'development') {
      console.error('Error creating upscale order:', { status, message, details: err.details });
    }
    
    return NextResponse.json({ error: message }, { status });
  }
}


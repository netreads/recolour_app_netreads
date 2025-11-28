import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getPhonePeOrderStatus } from '@/lib/phonepe';
import { PAYMENT_STATUS } from '@/lib/constants';

export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

interface UpscaleMetadata {
  jobId: string;
  type: 'upscale';
  tier: string;
  factor: string;
  resolution: string;
  sourceImageUrl: string;
  upscaledImageUrl?: string;
  upscaleStatus?: string;
  imageFormat?: string;
  imageSizeBytes?: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');
    const jobId = searchParams.get('jobId');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const metadata = order.metadata as unknown as UpscaleMetadata;

    // Verify this is an upscale order
    if (metadata?.type !== 'upscale') {
      return NextResponse.json({ error: 'Not an upscale order' }, { status: 400 });
    }

    // Verify jobId matches if provided
    if (jobId && metadata.jobId !== jobId) {
      return NextResponse.json({ error: 'Job ID mismatch' }, { status: 400 });
    }

    // Check payment status if order is pending
    if (order.status === 'PENDING') {
      try {
        const phonePeStatus = await getPhonePeOrderStatus(orderId);
        
        if (phonePeStatus.state === PAYMENT_STATUS.COMPLETED) {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: 'PAID',
              paymentStatus: 'SUCCESS',
            },
          });
        } else if (phonePeStatus.state === PAYMENT_STATUS.FAILED) {
          return NextResponse.json({
            error: 'Payment failed',
            code: 'PAYMENT_FAILED',
          }, { status: 402 });
        } else {
          return NextResponse.json({
            error: 'Payment pending',
            code: 'PAYMENT_PENDING',
            message: 'Payment is still being processed',
            retryAfter: 5,
          }, { status: 402 });
        }
      } catch (err) {
        console.error('[UPSCALE-DOWNLOAD] Payment verification failed:', err);
        return NextResponse.json({
          error: 'Payment verification failed',
          code: 'VERIFICATION_ERROR',
          retryAfter: 5,
        }, { status: 503 });
      }
    }

    // Check if order is paid
    if (order.status !== 'PAID') {
      return NextResponse.json({
        error: 'Order not paid',
        code: 'NOT_PAID',
      }, { status: 402 });
    }

    // Check upscale status
    if (!metadata.upscaledImageUrl) {
      if (metadata.upscaleStatus === 'processing') {
        return NextResponse.json({
          error: 'Upscale in progress',
          code: 'PROCESSING',
          message: 'Your image is being upscaled. This may take a minute...',
          status: 'processing',
          retryAfter: 10,
        }, { status: 202 });
      }

      // Need to trigger processing
      return NextResponse.json({
        error: 'Upscale not started',
        code: 'NOT_STARTED',
        message: 'Upscale processing needs to be triggered',
        status: 'pending',
      }, { status: 202 });
    }

    // Fetch the upscaled image
    console.log(`[UPSCALE-DOWNLOAD] Fetching upscaled image from: ${metadata.upscaledImageUrl}`);
    
    const imageResponse = await fetch(metadata.upscaledImageUrl, {
      signal: AbortSignal.timeout(15000),
    });

    if (!imageResponse.ok) {
      console.error(`[UPSCALE-DOWNLOAD] Failed to fetch image: ${imageResponse.status}`);
      return NextResponse.json({
        error: 'Failed to fetch upscaled image',
        code: 'FETCH_ERROR',
      }, { status: 500 });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Use the stored format or detect from response
    const fileExtension = metadata.imageFormat || 'png';
    const contentType = imageResponse.headers.get('content-type') || 
      (fileExtension === 'png' ? 'image/png' : fileExtension === 'webp' ? 'image/webp' : 'image/png');

    const filename = `upscaled-${metadata.tier}-${metadata.jobId}.${fileExtension}`;

    console.log(`[UPSCALE-DOWNLOAD] ✅ Serving ${filename} (${(imageBuffer.byteLength / 1024 / 1024).toFixed(2)} MB, ${contentType})`);

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });

  } catch (error) {
    console.error('[UPSCALE-DOWNLOAD] Error:', error);
    return NextResponse.json({ error: 'Failed to download upscaled image' }, { status: 500 });
  }
}


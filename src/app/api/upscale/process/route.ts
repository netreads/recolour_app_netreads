import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getPhonePeOrderStatus } from '@/lib/phonepe';
import { PAYMENT_STATUS } from '@/lib/constants';
import { getServerEnv } from '@/lib/env';
import Replicate from 'replicate';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';
export const maxDuration = 60; // Upscaling can take a while

interface UpscaleMetadata {
  jobId: string;
  type: 'upscale';
  tier: string;
  factor: string;
  resolution: string;
  sourceImageUrl: string;
  upscaledImageUrl?: string;
  upscaleStatus?: string;
  replicatePredictionId?: string;
}

// Map tier to Replicate upscale factor
function getReplicateUpscaleFactor(tier: string): string {
  switch (tier) {
    case '2K':
      return '2x';
    case '4K':
      return '4x';
    case '6K':
      return '6x'; // Replicate max is 4x, we'll upscale twice for 6K
    default:
      return '2x';
  }
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, jobId } = await request.json();
    const env = getServerEnv();

    if (!orderId || !jobId) {
      return NextResponse.json({ error: 'Order ID and Job ID are required' }, { status: 400 });
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

    // Check if already processed
    if (metadata.upscaledImageUrl) {
      return NextResponse.json({
        success: true,
        upscaledImageUrl: metadata.upscaledImageUrl,
        status: 'completed',
        message: 'Upscale already completed',
      });
    }

    // Verify payment if order is still pending
    if (order.status === 'PENDING') {
      console.log(`[UPSCALE] Order ${orderId} is PENDING, verifying payment...`);
      
      try {
        const phonePeStatus = await getPhonePeOrderStatus(orderId);
        
        if (phonePeStatus.state === PAYMENT_STATUS.COMPLETED) {
          // Update order status
          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: 'PAID',
              paymentStatus: 'SUCCESS',
            },
          });
        } else if (phonePeStatus.state === PAYMENT_STATUS.FAILED) {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: 'FAILED',
              paymentStatus: 'FAILED',
            },
          });
          return NextResponse.json({ error: 'Payment failed', code: 'PAYMENT_FAILED' }, { status: 402 });
        } else {
          return NextResponse.json({ 
            error: 'Payment pending', 
            code: 'PAYMENT_PENDING',
            message: 'Please wait for payment to complete',
            retryAfter: 5,
          }, { status: 402 });
        }
      } catch (phonepeError) {
        console.error('[UPSCALE] PhonePe verification failed:', phonepeError);
        return NextResponse.json({ 
          error: 'Payment verification failed', 
          code: 'VERIFICATION_ERROR',
          retryAfter: 5,
        }, { status: 503 });
      }
    }

    // Re-check order status after potential update
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!updatedOrder || updatedOrder.status !== 'PAID') {
      return NextResponse.json({ error: 'Order not paid' }, { status: 402 });
    }

    // Check if Replicate API token is configured
    if (!env.REPLICATE_API_TOKEN) {
      console.error('[UPSCALE] REPLICATE_API_TOKEN not configured');
      return NextResponse.json({ 
        error: 'Upscaling service not configured', 
        code: 'SERVICE_ERROR' 
      }, { status: 500 });
    }

    // Update status to processing
    await prisma.order.update({
      where: { id: orderId },
      data: {
        metadata: {
          ...metadata,
          upscaleStatus: 'processing',
        },
      },
    } as any);

    console.log(`[UPSCALE] Starting upscale for order ${orderId}, tier: ${metadata.tier}`);

    // Initialize Replicate client
    const replicate = new Replicate({
      auth: env.REPLICATE_API_TOKEN,
    });

    // Run the upscale model
    const upscaleFactor = getReplicateUpscaleFactor(metadata.tier);
    
    const input = {
      image: metadata.sourceImageUrl,
      enhance_model: 'Standard V2',
      upscale_factor: upscaleFactor,
      face_enhancement: true,
      output_format: "png",
      subject_detection: 'Foreground',
      face_enhancement_strength: 0.8,
      face_enhancement_creativity: 0.5,
    };

    console.log(`[UPSCALE] Calling Replicate API with factor: ${upscaleFactor}`);

    let output: any;
    
    // For 6K, we need to upscale twice (4x first, then another pass)
    if (metadata.tier === '6K') {
      // First pass: 4x upscale
      output = await replicate.run('topazlabs/image-upscale', { input });
      
      // If we got a result, do second pass with 2x to approximate 6K
      if (output) {
        const firstPassUrl = typeof output === 'string' ? output : (output as any).url?.();
        if (firstPassUrl) {
          const secondPassInput = {
            ...input,
            image: firstPassUrl,
            upscale_factor: '2x', // This will give us approximately 8x total, which exceeds 6K
          };
          output = await replicate.run('topazlabs/image-upscale', { input: secondPassInput });
        }
      }
    } else {
      output = await replicate.run('topazlabs/image-upscale', { input });
    }

    if (!output) {
      throw new Error('No output from Replicate API');
    }

    console.log(`[UPSCALE] Replicate API returned successfully`);

    // Get the output URL
    const outputUrl = typeof output === 'string' ? output : (output as any).url?.();
    
    if (!outputUrl) {
      throw new Error('Invalid output from Replicate API');
    }

    // Download the upscaled image and upload to R2
    console.log(`[UPSCALE] Downloading upscaled image from Replicate...`);
    const imageResponse = await fetch(outputUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to download upscaled image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Detect content type from response - prefer PNG for lossless quality
    const contentType = imageResponse.headers.get('content-type') || 'image/png';
    const fileExtension = contentType.includes('png') ? 'png' : (contentType.includes('webp') ? 'webp' : 'png');

    // Upload to R2 with full quality (no compression)
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });

    const upscaleId = uuidv4();
    const r2Key = `upscaled/${jobId}/${upscaleId}-${metadata.tier}.${fileExtension}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: r2Key,
      Body: Buffer.from(imageBuffer),
      ContentType: contentType.includes('png') ? 'image/png' : contentType, // Ensure PNG for quality
    }));

    const upscaledImageUrl = `${env.R2_PUBLIC_URL}/${r2Key}`;
    
    console.log(`[UPSCALE] Image size: ${(imageBuffer.byteLength / 1024 / 1024).toFixed(2)} MB, format: ${fileExtension}`);

    console.log(`[UPSCALE] Uploaded to R2: ${upscaledImageUrl}`);

    // Update order with upscaled image URL and format info
    await prisma.order.update({
      where: { id: orderId },
      data: {
        metadata: {
          ...metadata,
          upscaledImageUrl,
          upscaleStatus: 'completed',
          imageFormat: fileExtension,
          imageSizeBytes: imageBuffer.byteLength,
        },
      },
    } as any);

    console.log(`[UPSCALE] ✅ Upscale completed for order ${orderId}`);

    return NextResponse.json({
      success: true,
      upscaledImageUrl,
      status: 'completed',
      tier: metadata.tier,
      resolution: metadata.resolution,
    });

  } catch (error: unknown) {
    console.error('[UPSCALE] Error processing upscale:', error);
    
    const err = error as Error;
    return NextResponse.json({
      error: err.message || 'Failed to process upscale',
      code: 'UPSCALE_FAILED',
    }, { status: 500 });
  }
}

// GET endpoint to check upscale status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const metadata = order.metadata as unknown as UpscaleMetadata;

    if (metadata?.type !== 'upscale') {
      return NextResponse.json({ error: 'Not an upscale order' }, { status: 400 });
    }

    return NextResponse.json({
      orderId: order.id,
      status: metadata.upscaleStatus || 'pending',
      tier: metadata.tier,
      resolution: metadata.resolution,
      upscaledImageUrl: metadata.upscaledImageUrl || null,
      orderStatus: order.status,
    });

  } catch (error) {
    console.error('[UPSCALE] Error checking status:', error);
    return NextResponse.json({ error: 'Failed to check upscale status' }, { status: 500 });
  }
}


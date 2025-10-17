import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Admin endpoint to manually fix payment issues
 * This endpoint checks for orders that are marked as PAID but their jobs are not marked as paid
 * and fixes them. This is useful for handling race conditions and webhook failures.
 * 
 * Usage: POST /api/admin/fix-payment
 * Body: { orderId: "optional_order_id", adminKey: "secret_key" }
 * 
 * If orderId is provided, fixes only that order. Otherwise, fixes all eligible orders.
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId, adminKey } = await request.json();
    const env = getServerEnv();

    // Simple admin authentication using environment variable
    const expectedAdminKey = env.ADMIN_FIX_PAYMENT_KEY;
    
    if (!expectedAdminKey || adminKey !== expectedAdminKey) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid admin key' },
        { status: 401 }
      );
    }

    let fixedCount = 0;
    const fixedOrders: string[] = [];
    const errors: Array<{ orderId: string; error: string }> = [];

    if (orderId) {
      // Fix a specific order
      const result = await fixSingleOrder(orderId);
      if (result.success) {
        fixedCount++;
        fixedOrders.push(orderId);
      } else {
        errors.push({ orderId, error: result.error || 'Unknown error' });
      }
    } else {
      // Find all orders that are PAID but their jobs are not marked as paid
      const paidOrders = await prisma.order.findMany({
        where: {
          status: 'PAID',
        },
        take: 100, // Limit to prevent timeout
      });

      for (const order of paidOrders) {
        const metadata = order.metadata as any;
        const jobId = metadata?.jobId;
        
        if (!jobId) continue;

        try {
          const job = await prisma.job.findUnique({
            where: { id: jobId },
          });

          if (job && !job.isPaid) {
            // Job exists but not marked as paid - fix it!
            await prisma.job.update({
              where: { id: jobId },
              data: { isPaid: true },
            });
            
            fixedCount++;
            fixedOrders.push(order.id);
          }
        } catch (err: any) {
          errors.push({
            orderId: order.id,
            error: err.message || 'Failed to fix order',
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} order(s)`,
      fixedCount,
      fixedOrders,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error('Error in fix-payment endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

async function fixSingleOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.status !== 'PAID') {
      return { success: false, error: 'Order is not marked as paid' };
    }

    const metadata = order.metadata as any;
    const jobId = metadata?.jobId;

    if (!jobId) {
      return { success: false, error: 'Order has no jobId in metadata' };
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return { success: false, error: 'Job not found' };
    }

    if (job.isPaid) {
      return { success: false, error: 'Job is already marked as paid' };
    }

    // Fix the job
    await prisma.job.update({
      where: { id: jobId },
      data: { isPaid: true },
    });

    return { success: true };

  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' };
  }
}


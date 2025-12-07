import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface SearchResult {
  order_id: string;
  phonepe_order_id: string | null;
  order_status: string;
  colored_image_url: string | null;
  original_url: string;
  job_status: string;
  job_created_at: Date;
  is_paid: boolean;
}

/**
 * Admin endpoint to search orders by Order ID or PhonePe Order ID
 * Returns orders with their associated jobs where job is paid
 * 
 * Usage: GET /api/admin/search-orders?orderId=xxx OR ?phonepeOrderId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');
    const phonepeOrderId = searchParams.get('phonepeOrderId');

    if (!orderId && !phonepeOrderId) {
      return NextResponse.json(
        { error: 'Either orderId or phonepeOrderId is required' },
        { status: 400 }
      );
    }

    // Build the SQL query based on the provided parameters
    let query: Prisma.Sql;

    if (orderId) {
      // Search by Order ID - use parameterized query for safety
      const searchPattern = `%${orderId}%`;
      query = Prisma.sql`
        SELECT 
          o.id as order_id,
          o.phonepe_order_id,
          o.status as order_status,
          j.output_url as colored_image_url,
          j.original_url,
          j.status as job_status,
          j.created_at as job_created_at,
          j.is_paid
        FROM orders o
        LEFT JOIN jobs j ON j.id = (o.metadata->>'jobId')::text
        WHERE o.id LIKE ${searchPattern}
          AND j.is_paid = true
        ORDER BY o.created_at DESC
        LIMIT 100
      `;
    } else {
      // Search by PhonePe Order ID
      const searchPattern = `%${phonepeOrderId}%`;
      query = Prisma.sql`
        SELECT 
          o.id as order_id,
          o.phonepe_order_id,
          o.status as order_status,
          j.output_url as colored_image_url,
          j.original_url,
          j.status as job_status,
          j.created_at as job_created_at,
          j.is_paid
        FROM orders o
        LEFT JOIN jobs j ON j.id = (o.metadata->>'jobId')::text
        WHERE o.phonepe_order_id LIKE ${searchPattern}
          AND j.is_paid = true
        ORDER BY o.created_at DESC
        LIMIT 100
      `;
    }

    // Execute the raw SQL query
    const results = await prisma.$queryRaw<SearchResult[]>(query);

    return NextResponse.json({
      success: true,
      count: results.length,
      results: results.map(result => ({
        orderId: result.order_id,
        phonepeOrderId: result.phonepe_order_id,
        orderStatus: result.order_status,
        coloredImageUrl: result.colored_image_url,
        originalUrl: result.original_url,
        jobStatus: result.job_status,
        jobCreatedAt: result.job_created_at,
        isPaid: result.is_paid,
      })),
    });

  } catch (error) {
    console.error('[SEARCH-ORDERS] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search orders',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

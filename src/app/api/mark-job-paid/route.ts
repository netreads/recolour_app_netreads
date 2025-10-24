import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 10;

export async function POST(request: NextRequest) {
  try {
    const { jobId } = await request.json();

    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json({ error: 'Valid Job ID is required' }, { status: 400 });
    }

    // Mark job as paid immediately - trust PhonePe success page
    await prisma.job.update({
      where: { id: jobId },
      data: { isPaid: true }
    });

    console.log(`✅ Job ${jobId} marked as paid immediately`);

    return NextResponse.json({ 
      success: true,
      message: 'Job marked as paid successfully'
    });

  } catch (error) {
    console.error('Error marking job as paid:', error);
    return NextResponse.json(
      { error: 'Failed to mark job as paid' },
      { status: 500 }
    );
  }
}

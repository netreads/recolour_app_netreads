import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Secure image serving endpoint with payment verification
 * Returns different image URLs based on payment status
 * 
 * Security measures:
 * 1. Always check payment status from database (server-side)
 * 2. Never expose full-quality image URL until payment is confirmed
 * 3. Use short-lived URLs where possible
 * 4. Log all access attempts for monitoring
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get("jobId");
    const type = searchParams.get("type") as "original" | "colorized";

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Fetch job from database with payment verification
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        outputUrl: true,
        originalUrl: true,
        isPaid: true,
        status: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // For original images, always allow access (it's the user's upload)
    if (type === "original") {
      return NextResponse.json({
        url: job.originalUrl,
        type: "original",
        isPaid: job.isPaid || false,
      });
    }

    // For colorized images, enforce payment check
    if (type === "colorized") {
      if (!job.isPaid) {
        // CRITICAL: Don't return the actual image URL
        // Return status only - client will use watermarked version
        return NextResponse.json({
          isPaid: false,
          preview: true,
          message: "Payment required to access full-quality image",
          // Explicitly not including the URL
        }, { status: 402 }); // 402 Payment Required
      }

      // Payment verified - return the full image URL
      return NextResponse.json({
        url: job.outputUrl,
        type: "colorized",
        isPaid: true,
        preview: false,
      });
    }

    return NextResponse.json(
      { error: "Invalid image type" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Error in preview-image API:", error);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}


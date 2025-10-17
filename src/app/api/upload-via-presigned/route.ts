import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { AwsClient } from "aws4fetch";
import { getServerEnv } from "@/lib/env";
import { FILE_CONSTRAINTS, API_CONFIG } from "@/lib/constants";

// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs';

// OPTIMIZATION: Set max duration - this is now very fast since we only generate presigned URL
export const maxDuration = 10; // Reduced from 30s - we only generate URLs now

// OPTIMIZATION: Changed from POST with file upload to GET for presigned URL generation
// This eliminates ALL upload bandwidth through Vercel - client uploads directly to R2
export async function POST(request: NextRequest) {
  try {
    const env = getServerEnv();
    
    // Get file metadata from request (not the actual file)
    const { fileName, fileType, fileSize } = await request.json();
    
    if (!fileName || !fileType) {
      return NextResponse.json({ error: "File name and type are required" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = FILE_CONSTRAINTS.ALLOWED_TYPES as readonly string[];
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json({ 
        error: `Invalid file type. Allowed types: ${FILE_CONSTRAINTS.ALLOWED_TYPES.join(', ')}` 
      }, { status: 400 });
    }

    // Validate file size
    if (fileSize && fileSize > FILE_CONSTRAINTS.MAX_SIZE_BYTES) {
      return NextResponse.json({ 
        error: `File size exceeds ${FILE_CONSTRAINTS.MAX_SIZE_MB}MB limit` 
      }, { status: 400 });
    }

    // Generate unique job ID and file key
    const jobId = uuidv4();
    const fileKey = `uploads/${jobId}-${fileName}`;
    // For R2.dev public URLs, don't include bucket name in the path
    // The R2_PUBLIC_URL subdomain is already mapped to the bucket
    const originalUrl = `${env.R2_PUBLIC_URL}/${fileKey}`;

    // Create AWS client for R2
    const r2Client = new AwsClient({
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      region: "auto",
      service: "s3",
    });

    // Generate presigned URL for client-side upload
    // Support both R2.dev public URLs and R2 cloudflarestorage URLs
    let accountIdMatch = env.R2_PUBLIC_URL.match(/https:\/\/pub-([a-f0-9]+)\.r2\.dev/);
    if (!accountIdMatch) {
      // Try the cloudflarestorage.com format
      accountIdMatch = env.R2_PUBLIC_URL.match(/https:\/\/([^.]+)\.r2\.cloudflarestorage\.com/);
    }
    if (!accountIdMatch) {
      throw new Error("Invalid R2_PUBLIC_URL configuration. Must be either https://pub-xxx.r2.dev or https://account.r2.cloudflarestorage.com");
    }
    
    const isR2Dev = env.R2_PUBLIC_URL.includes('.r2.dev');
    
    let uploadUrl: string;
    if (isR2Dev) {
      if (!env.R2_ACCOUNT_ID) {
        throw new Error("R2_ACCOUNT_ID is required when using R2.dev public URLs");
      }
      uploadUrl = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${fileKey}`;
    } else {
      const accountId = accountIdMatch[1];
      uploadUrl = `https://${accountId}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${fileKey}`;
    }

    // OPTIMIZATION: Generate presigned URL instead of uploading through Vercel
    // This allows client to upload directly to R2, saving 100% of upload bandwidth
    const signedUpload = await r2Client.sign(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": fileType,
      },
      aws: { 
        signQuery: true,
      },
    });

    // Create job record in database
    const db = getDatabase();
    await db.createJob(jobId, null, originalUrl);

    // OPTIMIZATION: Add explicit response headers for better compression
    return NextResponse.json(
      {
        success: true,
        jobId,
        originalUrl,
        // Return presigned URL for client-side upload
        uploadUrl: signedUpload.url,
        fileKey,
        // Add direct outputUrl for client use
        outputUrl: `${env.R2_PUBLIC_URL}/outputs/${jobId}-colorized.jpg`,
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    // Always log errors but sanitize for production
    const env = getServerEnv();
    console.error("Error generating upload URL:", error);
    
    // In production, return generic error but log details
    const errorMessage = env.NODE_ENV === 'development' && error instanceof Error
      ? error.message 
      : "Failed to generate upload URL";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
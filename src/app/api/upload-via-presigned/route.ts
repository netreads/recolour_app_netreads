import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { AwsClient } from "aws4fetch";
import { getServerEnv } from "@/lib/env";
import { FILE_CONSTRAINTS, API_CONFIG } from "@/lib/constants";

// Force Node.js runtime
export const runtime = 'nodejs';

// Set max duration to prevent unexpected costs from long-running functions
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const env = getServerEnv();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = FILE_CONSTRAINTS.ALLOWED_TYPES as readonly string[];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: `Invalid file type. Allowed types: ${FILE_CONSTRAINTS.ALLOWED_TYPES.join(', ')}` 
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > FILE_CONSTRAINTS.MAX_SIZE_BYTES) {
      return NextResponse.json({ 
        error: `File size exceeds ${FILE_CONSTRAINTS.MAX_SIZE_MB}MB limit` 
      }, { status: 400 });
    }

    // Generate unique job ID and file key
    const jobId = uuidv4();
    const fileKey = `uploads/${jobId}-${file.name}`;
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

    // Upload directly to R2 from the server
    // Support both R2.dev public URLs and R2 cloudflarestorage URLs
    let accountIdMatch = env.R2_PUBLIC_URL.match(/https:\/\/pub-([a-f0-9]+)\.r2\.dev/);
    if (!accountIdMatch) {
      // Try the cloudflarestorage.com format
      accountIdMatch = env.R2_PUBLIC_URL.match(/https:\/\/([^.]+)\.r2\.cloudflarestorage\.com/);
    }
    if (!accountIdMatch) {
      throw new Error("Invalid R2_PUBLIC_URL configuration. Must be either https://pub-xxx.r2.dev or https://account.r2.cloudflarestorage.com");
    }
    
    // For R2.dev URLs, we need to extract the account ID differently
    // R2.dev format: https://pub-{hash}.r2.dev (hash is the public bucket identifier)
    // For internal uploads, we still need the account ID
    // We'll need to construct the internal URL differently
    const isR2Dev = env.R2_PUBLIC_URL.includes('.r2.dev');
    
    let uploadUrl: string;
    if (isR2Dev) {
      // For R2.dev public URLs, we need to use the account's internal URL
      // Extract account ID from R2_ACCESS_KEY_ID or use a different approach
      // The internal upload URL format is: https://{accountId}.r2.cloudflarestorage.com/{bucket}/{key}
      // We'll need the R2 account ID from environment
      if (!env.R2_ACCOUNT_ID) {
        throw new Error("R2_ACCOUNT_ID is required when using R2.dev public URLs");
      }
      uploadUrl = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${fileKey}`;
    } else {
      const accountId = accountIdMatch[1];
      uploadUrl = `https://${accountId}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${fileKey}`;
    }

    const fileBuffer = await file.arrayBuffer();
    
    const uploadResponse = await r2Client.fetch(uploadUrl, {
      method: "PUT",
      body: fileBuffer,
      headers: {
        "Content-Type": file.type,
        "Content-Length": fileBuffer.byteLength.toString(),
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file to R2: ${uploadResponse.status}`);
    }

    // Create job record in database
    const db = getDatabase();
    await db.createJob(jobId, null, originalUrl);

    return NextResponse.json({
      success: true,
      jobId,
      originalUrl,
    });
  } catch (error) {
    // Always log errors but sanitize for production
    const env = getServerEnv();
    console.error("Error uploading file:", error);
    
    // In production, return generic error but log details
    const errorMessage = env.NODE_ENV === 'development' && error instanceof Error
      ? error.message 
      : "Failed to upload file";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
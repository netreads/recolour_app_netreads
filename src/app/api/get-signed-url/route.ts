import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Force Node.js runtime
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, type } = await request.json();
    
    if (!jobId || !type) {
      return NextResponse.json({ error: "Job ID and type are required" }, { status: 400 });
    }

    if (!['original', 'output'].includes(type)) {
      return NextResponse.json({ error: "Type must be 'original' or 'output'" }, { status: 400 });
    }

    // Get environment variables
    const env = process.env as any;
    if (!env.R2_BUCKET || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_PUBLIC_URL) {
      return NextResponse.json({ error: "R2 configuration missing" }, { status: 500 });
    }

    // Get job from database
    const db = getDatabase(env.DB ? { DB: env.DB } : undefined);
    const job = await db.getJobById(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Determine which URL to sign
    let urlToSign: string;
    if (type === 'original') {
      urlToSign = job.original_url;
    } else {
      if (!job.output_url) {
        return NextResponse.json({ error: "Output image not available" }, { status: 404 });
      }
      urlToSign = job.output_url;
    }

    // Extract account ID from R2_PUBLIC_URL
    const accountId = env.R2_PUBLIC_URL.match(/https:\/\/([^.]+)\.r2\.cloudflarestorage\.com/)?.[1];
    if (!accountId) {
      return NextResponse.json({ error: "Invalid R2 configuration" }, { status: 500 });
    }

    // Create S3 client for R2
    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });

    // Extract file key from URL
    // URL format: https://account.r2.cloudflarestorage.com/bucket/uploads/filename or https://account.r2.cloudflarestorage.com/bucket/outputs/filename
    const urlParts = urlToSign.split('/');
    const bucketIndex = urlParts.findIndex(part => part === env.R2_BUCKET);
    if (bucketIndex === -1 || bucketIndex >= urlParts.length - 2) {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }
    const fileKey = urlParts.slice(bucketIndex + 1).join('/'); // Get everything after bucket name

    // Create signed URL for GET request
    const command = new GetObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: fileKey,
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return NextResponse.json({
      signedUrl: signedUrl,
      expiresIn: 3600, // 1 hour
    });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json(
      { error: "Failed to generate signed URL" },
      { status: 500 }
    );
  }
}

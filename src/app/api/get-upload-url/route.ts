import { NextRequest, NextResponse } from "next/server";
import { getServerUserWithSync } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { AwsClient } from "aws4fetch";

// Force Node.js runtime
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and sync user to database
    const userData = await getServerUserWithSync();

    if (!userData?.neonUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = userData.neonUser;

    const { fileName, contentType } = await request.json();
    
    if (!fileName) {
      return NextResponse.json({ error: "File name is required" }, { status: 400 });
    }

    // Get environment variables
    const env = process.env as any;
    if (!env.R2_BUCKET || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_PUBLIC_URL) {
      return NextResponse.json({ error: "R2 configuration missing" }, { status: 500 });
    }

    // Generate unique job ID and file key
    const jobId = uuidv4();
    const fileKey = `uploads/${jobId}-${fileName}`;
    const originalUrl = `${env.R2_PUBLIC_URL}/${env.R2_BUCKET}/${fileKey}`;

    // Create AWS client for R2
    const r2Client = new AwsClient({
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      region: "auto",
      service: "s3",
    });

    // Generate presigned PUT URL
    // Extract account ID from R2_PUBLIC_URL and use account-specific endpoint
    const accountId = env.R2_PUBLIC_URL.match(/https:\/\/([^.]+)\.r2\.cloudflarestorage\.com/)?.[1];
    
    if (!accountId) {
      throw new Error("Could not extract account ID from R2_PUBLIC_URL");
    }
    
    // Use account-specific endpoint format: https://{account-id}.r2.cloudflarestorage.com/{bucket}/{key}
    const bucketUrl = `https://${accountId}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${fileKey}`;
    
    
    const presignedUrl = await r2Client.sign(
      bucketUrl,
      {
        method: "PUT",
        aws: { signQuery: true },
      }
    );


    // Create job record in database
    const db = getDatabase();
    await db.createJob(jobId, user.id, originalUrl);

    return NextResponse.json({
      uploadUrl: presignedUrl.url,
      jobId,
      originalUrl,
    });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}

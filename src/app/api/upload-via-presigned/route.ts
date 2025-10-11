import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { AwsClient } from "aws4fetch";
import { getServerEnv } from "@/lib/env";
import { FILE_CONSTRAINTS } from "@/lib/constants";

// Force Node.js runtime
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const env = getServerEnv();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!FILE_CONSTRAINTS.ALLOWED_TYPES.includes(file.type)) {
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
    const originalUrl = `${env.R2_PUBLIC_URL}/${env.R2_BUCKET}/${fileKey}`;

    // Create AWS client for R2
    const r2Client = new AwsClient({
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      region: "auto",
      service: "s3",
    });

    // Upload directly to R2 from the server
    const accountIdMatch = env.R2_PUBLIC_URL.match(/https:\/\/([^.]+)\.r2\.cloudflarestorage\.com/);
    if (!accountIdMatch) {
      throw new Error("Invalid R2_PUBLIC_URL configuration");
    }
    const accountId = accountIdMatch[1];
    const uploadUrl = `https://${accountId}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${fileKey}`;

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
    const env = getServerEnv();
    if (env.NODE_ENV === 'development') {
      console.error("Error uploading file:", error);
    }
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
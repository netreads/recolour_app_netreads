import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { AwsClient } from "aws4fetch";

// Force Node.js runtime
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    
    // Verify authentication
    const user = await getServerUser();


    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Get environment variables
    const env = process.env as any;
    if (!env.R2_BUCKET || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_PUBLIC_URL) {
      return NextResponse.json({ error: "R2 configuration missing" }, { status: 500 });
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


    // Upload directly to R2 from the server (bypasses browser SSL issues)
    const accountId = env.R2_PUBLIC_URL.match(/https:\/\/([^.]+)\.r2\.cloudflarestorage\.com/)?.[1];
    const uploadUrl = accountId 
      ? `https://${accountId}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${fileKey}`
      : `https://${env.R2_BUCKET}.r2.cloudflarestorage.com/${fileKey}`;


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
      const errorText = await uploadResponse.text();
      console.error("Upload failed:", uploadResponse.status, errorText);
      throw new Error(`Failed to upload file to R2: ${uploadResponse.status} ${errorText}`);
    }


    // Create job record in database
    const db = getDatabase();
    await db.createJob(jobId, user.id, originalUrl);

    return NextResponse.json({
      success: true,
      jobId,
      originalUrl,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
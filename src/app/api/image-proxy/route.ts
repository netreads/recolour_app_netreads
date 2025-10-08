import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// Force Node.js runtime
export const runtime = 'nodejs';

// Enable aggressive caching to reduce function invocations
export const revalidate = 3600; // Cache for 1 hour

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const type = searchParams.get('type') || 'original';
    
    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
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
    const db = getDatabase();
    const job = await db.getJobById(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Determine which URL to fetch
    let urlToFetch: string;
    if (type === 'original') {
      urlToFetch = job.originalUrl;
    } else {
      if (!job.outputUrl) {
        return NextResponse.json({ error: "Output image not available" }, { status: 404 });
      }
      urlToFetch = job.outputUrl;
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
    const urlParts = urlToFetch.split('/');
    const bucketIndex = urlParts.findIndex(part => part === env.R2_BUCKET);
    if (bucketIndex === -1 || bucketIndex >= urlParts.length - 2) {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }
    const fileKey = urlParts.slice(bucketIndex + 1).join('/');

    // Fetch the image from R2
    const command = new GetObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: fileKey,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Convert the stream to buffer
    const chunks: Uint8Array[] = [];
    const reader = response.Body.transformToWebStream().getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    const buffer = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }

    // Return the image with aggressive caching headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': response.ContentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year (images don't change)
        'CDN-Cache-Control': 'public, max-age=31536000',
        'Vercel-CDN-Cache-Control': 'public, max-age=31536000',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error fetching image:", error);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}

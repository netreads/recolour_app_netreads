import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = 'nodejs';
export const maxDuration = 10;
export const dynamic = 'force-dynamic';


function transformToPublicUrl(storedUrl: string): string {
  const publicUrl = process.env.NEXT_PUBLIC_R2_URL;
  
  if (!publicUrl) {
    return storedUrl;
  }
  
  try {
    const url = new URL(storedUrl);
    
    if (url.hostname.includes('.r2.dev')) {
      return storedUrl;
    }
    
    if (url.hostname.includes('.r2.cloudflarestorage.com')) {
      const pathParts = url.pathname.split('/').filter(Boolean);
      
      if (pathParts.length < 2) {
        return storedUrl;
      }
      
      const storagePath = pathParts.slice(1).join('/');
      const cleanPublicUrl = publicUrl.replace(/\/$/, '');
      const publicFullUrl = `${cleanPublicUrl}/${storagePath}`;
      
      return publicFullUrl;
    }
    
    return storedUrl;
  } catch (error) {
    console.error('Error transforming URL:', error);
    return storedUrl; // Return original if transformation fails
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const type = searchParams.get('type') || 'original';
    
    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json({ error: "Valid Job ID is required" }, { status: 400 });
    }

    if (!['original', 'output'].includes(type)) {
      return NextResponse.json({ error: "Type must be 'original' or 'output'" }, { status: 400 });
    }

    // Get job from database
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        originalUrl: true,
        outputUrl: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    let url = type === 'original' ? job.originalUrl : job.outputUrl;
    
    if (!url) {
      return NextResponse.json({ error: `${type} image not available` }, { status: 404 });
    }

    url = transformToPublicUrl(url);

    return NextResponse.json(
      { url },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, immutable',
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );
  } catch (error) {
    console.error("Error fetching image URL:", error);
    return NextResponse.json(
      { error: "Failed to fetch image URL" },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { API_CONFIG } from "@/lib/constants";

// Force Node.js runtime
export const runtime = 'nodejs';

// Set max duration
export const maxDuration = API_CONFIG.API_MAX_DURATION;

// Cache these responses aggressively since URLs don't change
export const revalidate = 3600; // 1 hour

/**
 * Transform internal R2 URL to public R2 URL
 * This handles both old URLs (with bucket name) and new URLs (without bucket name)
 */
function transformToPublicUrl(storedUrl: string): string {
  const publicUrl = process.env.NEXT_PUBLIC_R2_URL;
  
  if (!publicUrl) {
    // If public URL not configured, return as-is
    return storedUrl;
  }
  
  try {
    // Parse the stored URL
    const url = new URL(storedUrl);
    
    // Check if it's already a public R2.dev URL (already in correct format)
    if (url.hostname.includes('.r2.dev')) {
      return storedUrl;
    }
    
    // Handle internal R2 URLs (for backwards compatibility)
    // Example: https://account.r2.cloudflarestorage.com/recolor-images/uploads/file.jpg
    if (url.hostname.includes('.r2.cloudflarestorage.com')) {
      const pathParts = url.pathname.split('/').filter(Boolean);
      
      // The path parts are typically: [bucket, 'uploads'/'outputs', filename]
      // Example: ['recolor-images', 'uploads', 'jobId-file.jpg']
      
      if (pathParts.length < 2) {
        // Invalid path format
        return storedUrl;
      }
      
      // Extract just the storage path (uploads/xxx or outputs/xxx)
      // Skip the bucket name (first element)
      const storagePath = pathParts.slice(1).join('/');
      
      // Clean up public URL (remove trailing slash)
      const cleanPublicUrl = publicUrl.replace(/\/$/, '');
      
      // Construct the final URL
      const publicFullUrl = `${cleanPublicUrl}/${storagePath}`;
      
      return publicFullUrl;
    }
    
    // For any other URL format, return as-is
    return storedUrl;
  } catch (error) {
    console.error('Error transforming URL:', error);
    return storedUrl; // Return original if transformation fails
  }
}

/**
 * Lightweight API endpoint to get the actual image URLs from the database
 * This is needed because original filenames vary and we can't construct the URL without them
 */
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
    const db = getDatabase();
    const job = await db.getJobById(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get the appropriate URL from database
    let url = type === 'original' ? job.originalUrl : job.outputUrl;
    
    if (!url) {
      return NextResponse.json({ error: `${type} image not available` }, { status: 404 });
    }

    // Transform internal R2 URL to public URL
    url = transformToPublicUrl(url);

    // Return JSON with URL
    return NextResponse.json(
      { url },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, immutable',
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


import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate direct R2 URL for images to avoid serverless function costs
 * This serves images directly from Cloudflare R2 CDN instead of proxying through Vercel
 * 
 * Note: For original images, we need the full URL from the job record since filenames vary.
 * This is a fallback that constructs the output URL.
 */
export function getDirectImageUrl(jobId: string, type: 'original' | 'output', fullUrl?: string): string {
  // If we have the full URL (from job record), use it directly
  if (fullUrl) {
    return fullUrl;
  }
  
  // Use R2 public URL directly - no serverless function needed
  // For R2.dev public URLs, the URL doesn't include the bucket name in the path
  // The R2.dev subdomain is already mapped to the specific bucket
  const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_URL || '';
  
  if (!R2_PUBLIC_URL) {
    console.warn('NEXT_PUBLIC_R2_URL not configured, falling back to API');
    return `/api/get-image-url?jobId=${jobId}&type=${type}`;
  }
  
  // Clean up URL (remove trailing slash)
  const cleanUrl = R2_PUBLIC_URL.replace(/\/$/, '');
  
  // For output images, we know the format
  const path = type === 'output' 
    ? `outputs/${jobId}-colorized.jpg`
    : `uploads/${jobId}`; // This won't work without filename!
  
  return `${cleanUrl}/${path}`;
}

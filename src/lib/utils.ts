import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDirectImageUrl(jobId: string, type: 'original' | 'output', fullUrl?: string): string {
  if (fullUrl) {
    return fullUrl;
  }
  
  const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_URL || '';
  
  if (!R2_PUBLIC_URL) {
    console.warn('NEXT_PUBLIC_R2_URL not configured, falling back to API');
    return `/api/get-image-url?jobId=${jobId}&type=${type}`;
  }
  
  const cleanUrl = R2_PUBLIC_URL.replace(/\/$/, '');
  
  const path = type === 'output' 
    ? `outputs/${jobId}-colorized.jpg`
    : `uploads/${jobId}`;
  
  return `${cleanUrl}/${path}`;
}

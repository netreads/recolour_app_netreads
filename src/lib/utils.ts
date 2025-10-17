import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDirectImageUrl(jobId: string, type: 'original' | 'output', fileName?: string): string {
  const R2_URL = process.env.NEXT_PUBLIC_R2_URL!;
  const path = type === 'original' 
    ? `uploads/${jobId}${fileName ? '-' + fileName : ''}`
    : `outputs/${jobId}-colorized.jpg`;
  return `${R2_URL}/${path}`;
}
import { NextRequest, NextResponse } from 'next/server'
import { getSecurityHeaders } from '@/lib/security'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Add security headers to critical routes only
  const securityHeaders = getSecurityHeaders()
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

export const config = {
  matcher: [
    // Only run on API routes that need security
    '/api/submit-job',
    '/api/upload-via-presigned',
    '/api/download-image',
    '/api/payments/:path*',
    '/api/admin/:path*',
    // Payment pages
    '/payment/:path*',
  ],
};

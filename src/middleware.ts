import { NextRequest, NextResponse } from 'next/server'
import { getSecurityHeaders } from '@/lib/security'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Add security headers to all responses
  const securityHeaders = getSecurityHeaders()
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

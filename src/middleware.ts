import { updateSession } from '@/lib/supabase/middleware'
import { NextRequest } from 'next/server'
import { getSecurityHeaders } from '@/lib/security'

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)
  
  // Add security headers to all responses
  const securityHeaders = getSecurityHeaders()
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/get-upload-url",
    "/api/submit-job", 
    "/api/jobs/:path*",
    "/api/user",
    "/api/refresh-user",
    "/api/sync-user",
    "/api/give-welcome-credits"
  ],
};

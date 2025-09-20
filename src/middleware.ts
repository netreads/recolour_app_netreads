import { updateSession } from '@/lib/supabase/middleware'
import { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/get-upload-url",
    "/api/submit-job", 
    "/api/jobs/:path*",
    "/api/user",
    "/api/refresh-user"
  ],
};

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('Auth callback received:', { 
    origin, 
    code: code ? 'present' : 'missing', 
    next,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    forwardedHost: request.headers.get('x-forwarded-host')
  });

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.session) {
      // Determine the correct redirect URL for production
      const isLocalEnv = process.env.NODE_ENV === 'development'
      let redirectUrl: string
      
      if (isLocalEnv) {
        // Development: use the request origin
        redirectUrl = `${origin}${next}`
      } else {
        // Production: prefer NEXT_PUBLIC_APP_URL, then x-forwarded-host, then origin
        const appUrl = process.env.NEXT_PUBLIC_APP_URL
        const forwardedHost = request.headers.get('x-forwarded-host')
        
        if (appUrl) {
          redirectUrl = `${appUrl}${next}`
        } else if (forwardedHost) {
          redirectUrl = `https://${forwardedHost}${next}`
        } else {
          redirectUrl = `${origin}${next}`
        }
      }
      
      console.log('Redirecting to:', redirectUrl);
      return NextResponse.redirect(redirectUrl)
    } else {
      console.error('Auth callback error:', error)
    }
  }

  // return the user to an error page with instructions
  const errorRedirectUrl = process.env.NEXT_PUBLIC_APP_URL || origin
  console.log('Auth error, redirecting to:', `${errorRedirectUrl}/auth/auth-code-error`);
  return NextResponse.redirect(`${errorRedirectUrl}/auth/auth-code-error`)
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

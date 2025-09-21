import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { syncUserToDatabase } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Validate next parameter to prevent open redirects
  const allowedPaths = ['/dashboard', '/profile', '/settings']
  const safeNext = allowedPaths.includes(next) ? next : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.session) {
      // Sync user to database immediately after successful authentication
      try {
        const syncedUser = await syncUserToDatabase(data.session.user);
        if (!syncedUser) {
          console.error('Failed to sync user to database');
        }
      } catch (syncError) {
        console.error('Error syncing user to database:', syncError);
        // Don't fail the auth flow if sync fails, but log it
      }

      // Determine the correct redirect URL for production
      const isLocalEnv = process.env.NODE_ENV === 'development'
      let redirectUrl: string
      
      if (isLocalEnv) {
        // Development: use the request origin
        redirectUrl = `${origin}${safeNext}`
      } else {
        // Production: use VERCEL_URL or NEXT_PUBLIC_APP_URL
        const vercelUrl = process.env.VERCEL_URL
        const appUrl = process.env.NEXT_PUBLIC_APP_URL
        const forwardedHost = request.headers.get('x-forwarded-host')
        
        if (appUrl) {
          redirectUrl = `${appUrl}${safeNext}`
        } else if (vercelUrl) {
          redirectUrl = `https://${vercelUrl}${safeNext}`
        } else if (forwardedHost) {
          redirectUrl = `https://${forwardedHost}${safeNext}`
        } else {
          redirectUrl = `${origin}${safeNext}`
        }
      }
      
      return NextResponse.redirect(redirectUrl)
    } else {
      console.error('Auth callback error:', error)
    }
  }

  // return the user to an error page with instructions
  const vercelUrl = process.env.VERCEL_URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const errorRedirectUrl = appUrl || (vercelUrl ? `https://${vercelUrl}` : origin)
  return NextResponse.redirect(`${errorRedirectUrl}/auth/auth-code-error`)
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

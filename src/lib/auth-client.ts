import { createClient } from '@/lib/supabase/client'
import { AuthError, AuthSessionError, handleAuthError, isAuthSessionMissingError } from '@/lib/auth-errors'

const supabase = createClient()

export const signInWithGoogle = async () => {
  try {
    // Determine the correct redirect URL
    let redirectUrl: string;
    
    // In production/preview environments, use NEXT_PUBLIC_APP_URL if available
    if (process.env.NEXT_PUBLIC_APP_URL) {
      redirectUrl = process.env.NEXT_PUBLIC_APP_URL;
    } else {
      // For development or when NEXT_PUBLIC_APP_URL is not set, use window.location.origin
      redirectUrl = window.location.origin;
    }
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${redirectUrl}/api/auth/callback`,
      },
    })
    
    if (error) {
      throw new AuthError(error.message || "Failed to sign in with Google", 'GOOGLE_SIGNIN_FAILED', 400)
    }
    
    return data
  } catch (error) {
    throw handleAuthError(error, 'signInWithGoogle')
  }
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw new AuthError(error.message || "Failed to sign out", 'SIGNOUT_FAILED', 400)
    }
    
    // Redirect to home page after sign out
    window.location.href = "/"
    
    return { success: true }
  } catch (error) {
    throw handleAuthError(error, 'signOut')
  }
}

export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      if (isAuthSessionMissingError(error)) {
        return null // Expected when user is not logged in
      }
      throw new AuthError(error.message || "Failed to get session", 'SESSION_ERROR', 500)
    }
    
    return session
  } catch (error: any) {
    if (isAuthSessionMissingError(error)) {
      return null // Expected when user is not logged in
    }
    throw handleAuthError(error, 'getSession')
  }
}

export const refreshSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession()
    
    if (error) {
      if (isAuthSessionMissingError(error)) {
        return null // Expected when user is not logged in
      }
      throw new AuthError(error.message || "Failed to refresh session", 'REFRESH_ERROR', 500)
    }
    
    return session
  } catch (error: any) {
    if (isAuthSessionMissingError(error)) {
      return null // Expected when user is not logged in
    }
    throw handleAuthError(error, 'refreshSession')
  }
}

export const getUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      if (isAuthSessionMissingError(error)) {
        return null // Expected when user is not logged in
      }
      throw new AuthError(error.message || "Failed to get user", 'USER_ERROR', 500)
    }
    
    return user
  } catch (error: any) {
    if (isAuthSessionMissingError(error)) {
      return null // Expected when user is not logged in
    }
    throw handleAuthError(error, 'getUser')
  }
}
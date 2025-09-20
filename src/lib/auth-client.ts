import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    
    if (error) {
      throw new Error(error.message || "Failed to sign in with Google")
    }
    
    return data
  } catch (error) {
    console.error("Google sign-in error:", error)
    throw error
  }
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw new Error(error.message || "Failed to sign out")
    }
    
    // Redirect to home page after sign out
    window.location.href = "/"
    
    return { success: true }
  } catch (error) {
    console.error("Sign out error:", error)
    throw error
  }
}

export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      // Don't log AuthSessionMissingError as it's expected when user is not logged in
      if (error.message !== 'Auth session missing!') {
        console.error("Get session error:", error)
      }
      return null
    }
    
    return session
  } catch (error: any) {
    // Don't log AuthSessionMissingError as it's expected when user is not logged in
    if (error?.message !== 'Auth session missing!' && error?.name !== 'AuthSessionMissingError') {
      console.error("Get session error:", error)
    }
    return null
  }
}

export const refreshSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession()
    
    if (error) {
      // Don't log AuthSessionMissingError as it's expected when user is not logged in
      if (error.message !== 'Auth session missing!') {
        console.error("Refresh session error:", error)
      }
      return null
    }
    
    return session
  } catch (error: any) {
    // Don't log AuthSessionMissingError as it's expected when user is not logged in
    if (error?.message !== 'Auth session missing!' && error?.name !== 'AuthSessionMissingError') {
      console.error("Refresh session error:", error)
    }
    return null
  }
}

export const getUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      // Don't log AuthSessionMissingError as it's expected when user is not logged in
      if (error.message !== 'Auth session missing!') {
        console.error("Get user error:", error)
      }
      return null
    }
    
    return user
  } catch (error: any) {
    // Don't log AuthSessionMissingError as it's expected when user is not logged in
    if (error?.message !== 'Auth session missing!' && error?.name !== 'AuthSessionMissingError') {
      console.error("Get user error:", error)
    }
    return null
  }
}
import { createClient } from '@/lib/supabase/server'
import { getDatabase } from '@/lib/db'
import { NextRequest } from 'next/server'
import { AuthError, AuthSessionError, AuthUserError, AuthSyncError, handleAuthError, logAuthError } from '@/lib/auth-errors'

export async function getServerSession(request?: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      throw new AuthSessionError(error.message || 'Failed to get session')
    }
    
    return session
  } catch (error) {
    logAuthError(error, 'getServerSession')
    return null
  }
}

export async function getServerUser(request?: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      throw new AuthUserError(error.message || 'Failed to get user')
    }
    
    return user
  } catch (error) {
    logAuthError(error, 'getServerUser')
    return null
  }
}

// Sync user from Supabase to Neon database
export async function syncUserToDatabase(supabaseUser: any) {
  if (!supabaseUser) return null;
  
  try {
    const db = getDatabase();
    
    // Create or update user in Neon database
    const neonUser = await db.createOrUpdateUser({
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name,
      image: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
      emailVerified: supabaseUser.email_confirmed_at ? true : false,
    });
    
    // Give welcome credits if this is a new user and they haven't received them yet
    if (!neonUser.welcomeCreditsGiven && neonUser.credits === 0) {
      try {
        await db.giveWelcomeCreditsAtomically(neonUser.id, 1);
        // Welcome credits given successfully - no need to log sensitive data
      } catch (error) {
        logAuthError(error, 'syncUserToDatabase-welcomeCredits');
        // Don't fail the sync if welcome credits fail
      }
    }
    
    return neonUser;
  } catch (error) {
    logAuthError(error, 'syncUserToDatabase');
    return null;
  }
}

// Get user with database sync
export async function getServerUserWithSync(request?: NextRequest) {
  const supabaseUser = await getServerUser(request);
  
  if (!supabaseUser) return null;
  
  // Sync user to database
  const neonUser = await syncUserToDatabase(supabaseUser);
  
  return {
    supabaseUser,
    neonUser,
  };
}

// For compatibility with existing API routes
export const auth = {
  api: {
    getSession: async ({ headers }: { headers: Headers }) => {
      const session = await getServerSession()
      return session ? { user: session.user } : null
    }
  }
}
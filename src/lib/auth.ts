import { createClient } from '@/lib/supabase/server'
import { getDatabase } from '@/lib/db'
import { NextRequest } from 'next/server'

export async function getServerSession(request?: NextRequest) {
  const supabase = await createClient()
  
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Error getting session:', error)
    return null
  }
  
  return session
}

export async function getServerUser(request?: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  
  return user
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
      await db.addCredits(neonUser.id, 1);
      await db.markWelcomeCreditsGiven(neonUser.id);
      console.log(`Gave welcome credits to new user: ${neonUser.email}`);
    }
    
    return neonUser;
  } catch (error) {
    console.error('Error syncing user to database:', error);
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
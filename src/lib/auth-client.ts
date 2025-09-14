import { createAuthClient } from "better-auth/client";

// Keep client base URL resolution in sync with server
const resolvedBaseURL =
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  (typeof window === "undefined"
    ? undefined
    : window.location?.origin) ||
  "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL: resolvedBaseURL,
});

export const signInWithGoogle = async () => {
  try {
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
    
    if (result.error) {
      throw new Error(result.error.message || "Failed to sign in with Google");
    }
    
    return result;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    const result = await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/";
        },
      },
    });
    
    if (result.error) {
      throw new Error(result.error.message || "Failed to sign out");
    }
    
    return result;
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
};

export const getSession = async () => {
  try {
    return await authClient.getSession();
  } catch (error) {
    console.error("Get session error:", error);
    return null;
  }
};

// Email authentication methods removed - only Google OAuth is supported

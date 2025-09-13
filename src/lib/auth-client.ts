import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
});

export const signInWithGoogle = async () => {
  return await authClient.signIn.social({
    provider: "google",
    callbackURL: "/dashboard",
  });
};

export const signOut = async () => {
  return await authClient.signOut();
};

// Email authentication methods removed - only Google OAuth is supported

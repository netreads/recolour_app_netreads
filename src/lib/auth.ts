import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./db";
import { prismaAdapter } from "better-auth/adapters/prisma";

// Resolve a single canonical base URL across envs to avoid redirect mismatches
const resolvedBaseURL =
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
  "http://localhost:3000";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: resolvedBaseURL,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // redirectURI: `${resolvedBaseURL}/api/auth/callback/google`,
    },
  },
  plugins: [nextCookies()],
  secret: process.env.BETTERAUTH_SECRET!,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 5, // 5 minutes (reduced for development)
    cookieCache: {
      enabled: process.env.NODE_ENV === 'production', // Disable in development
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },});

export type Session = typeof auth.$Infer.Session;

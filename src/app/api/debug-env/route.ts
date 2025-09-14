import { NextResponse } from "next/server";

export async function GET() {
  // Only show this in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    BETTERAUTH_SECRET: process.env.BETTERAUTH_SECRET ? 'SET' : 'NOT SET',
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'NOT SET',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
    VERCEL_URL: process.env.VERCEL_URL || 'NOT SET',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET',
    R2_BUCKET: process.env.R2_BUCKET || 'NOT SET',
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? 'SET' : 'NOT SET',
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET',
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || 'NOT SET',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
  };

  return NextResponse.json(envVars);
}

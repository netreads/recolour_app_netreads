import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Only show this in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const cookies = request.cookies;
  const sessionCookie = cookies.get('better-auth.session_token')?.value || null;
  const cookieNames = cookies.getAll().map((c) => c.name);

  const baseCandidates = {
    NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || null,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || null,
    VERCEL_URL: process.env.VERCEL_URL || null,
  } as const;

  const resolvedBaseURL =
    baseCandidates.NEXT_PUBLIC_BETTER_AUTH_URL ||
    baseCandidates.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "http://localhost:3000";

  return NextResponse.json({
    cookieNames,
    hasSessionCookie: Boolean(sessionCookie),
    sessionCookiePreview: sessionCookie ? `${sessionCookie.slice(0, 12)}...` : null,
    baseCandidates,
    resolvedBaseURL,
  });
}



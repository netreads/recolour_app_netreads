import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Skip middleware for auth routes, static files, and public routes
  const publicPaths = [
    "/", "/login", "/signup", "/pricing", "/privacy", "/tos", 
    "/api/auth", "/api/payments/webhook", "/_next", "/favicon.ico", "/public"
  ];
  
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check if the request is for a protected route
  const protectedPaths = ["/dashboard", "/api/get-upload-url", "/api/submit-job", "/api/jobs", "/api/payments/create-order", "/api/payments/status"];
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // For protected routes, check if user has a session cookie
  // Better Auth uses 'better-auth.session_token' cookie
  const sessionCookie = request.cookies.get('better-auth.session_token');
  
  if (!sessionCookie || !sessionCookie.value) {
    // Redirect to login for page routes
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    
    // Return unauthorized for API routes
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // If session cookie exists, let the request through
  // The actual session validation will happen in the API routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/get-upload-url",
    "/api/submit-job", 
    "/api/jobs/:path*"
  ],
};

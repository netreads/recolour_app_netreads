// Security utilities for authentication and headers

export function getSecurityHeaders() {
  return {
    // Allow framing ONLY for specific trusted domains (Google, Facebook)
    // This is more flexible than X-Frame-Options: DENY
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://connect.facebook.net https://va.vercel-scripts.com https://www.clarity.ms https://static.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' https://pub-a16f47f2729e4df8b1e83fdf9703d1ca.r2.dev",
      "connect-src 'self' https://*.supabase.co https://*.supabase.io wss://*.supabase.co wss://*.supabase.io https://www.facebook.com https://connect.facebook.net https://va.vercel-scripts.com https://www.clarity.ms https://*.run.app https://*.conversionsapigateway.com https://*.r2.cloudflarestorage.com https://*.r2.dev",
      "frame-src 'self' https://accounts.google.com https://www.facebook.com https://connect.facebook.net",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://www.facebook.com",
      "frame-ancestors 'none'"
    ].join('; ')
  };
}

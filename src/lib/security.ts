// Security utilities for authentication and headers

export function getSecurityHeaders() {
  return {
    // Lenient security headers for production payment flows
    // Allows all necessary third-party integrations while maintaining core security
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': [
      // Allow self and data URIs
      "default-src 'self' data:",
      
      // Scripts: Allow inline scripts and common CDNs (needed for payment gateways)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:",
      
      // Styles: Allow inline styles and external stylesheets
      "style-src 'self' 'unsafe-inline' https:",
      
      // Fonts: Allow from anywhere over HTTPS
      "font-src 'self' data: https:",
      
      // Images: Allow from anywhere (needed for dynamic payment gateway images)
      "img-src 'self' data: https: blob:",
      
      // Media: Allow from R2 and other HTTPS sources
      "media-src 'self' https: data: blob:",
      
      // Connect: Allow API calls to payment gateways and services
      "connect-src 'self' https: wss: data: blob:",
      
      // Frames: Allow payment gateway iframes and authentication
      "frame-src 'self' https: data:",
      
      // Object/Embed: Block for security
      "object-src 'none'",
      "base-uri 'self'",
      
      // Form actions: Allow submissions to payment gateways
      "form-action 'self' https:",
      
      // Frame ancestors: Allow embedding on same origin
      "frame-ancestors 'self'",
      
      // Upgrade insecure requests to HTTPS
      "upgrade-insecure-requests"
    ].join('; ')
  };
}

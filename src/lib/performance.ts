/**
 * Performance Monitoring Utilities
 * 
 * These utilities help track function execution times and cache effectiveness
 * to monitor the impact of cost optimizations.
 */

/**
 * Measure execution time of an async function
 * Usage: const result = await measureTime('functionName', async () => { ... })
 */
export async function measureTime<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[Performance] ${label} failed after ${duration.toFixed(2)}ms`);
    throw error;
  }
}

/**
 * Cache helper to create consistent cache control headers
 */
export const CacheHeaders = {
  /**
   * Cache for images and static assets (1 year, immutable)
   */
  immutable: {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'CDN-Cache-Control': 'public, max-age=31536000',
    'Vercel-CDN-Cache-Control': 'public, max-age=31536000',
  },
  
  /**
   * Cache for API responses (short duration with stale-while-revalidate)
   */
  api: (maxAge: number = 10, swr: number = 30) => ({
    'Cache-Control': `private, max-age=${maxAge}, stale-while-revalidate=${swr}`,
  }),
  
  /**
   * Cache for public API responses
   */
  publicApi: (maxAge: number = 60, swr: number = 120) => ({
    'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=${swr}`,
    'CDN-Cache-Control': `public, max-age=${maxAge}`,
  }),
  
  /**
   * No cache for sensitive or frequently changing data
   */
  noCache: {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
};

/**
 * Track cache hit/miss for monitoring
 */
export function logCacheStatus(
  resource: string,
  hit: boolean,
  source: 'browser' | 'cdn' | 'function'
) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Cache ${hit ? 'HIT' : 'MISS'}] ${resource} (${source})`);
  }
}

/**
 * Cost monitoring helper - logs function invocations in development
 */
export function logFunctionInvocation(
  functionName: string,
  metadata?: Record<string, any>
) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Function Invocation] ${functionName}`, metadata || '');
  }
}

/**
 * Helper to add standard headers to responses
 */
export function withStandardHeaders(
  headers: HeadersInit,
  additionalHeaders: HeadersInit = {}
): HeadersInit {
  return {
    ...headers,
    ...additionalHeaders,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  };
}

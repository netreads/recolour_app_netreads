/**
 * In-memory cache for payment verification status
 * Prevents redundant PhonePe API calls for the same order
 * 
 * This is cost-effective and works well for serverless:
 * - Each instance maintains its own cache
 * - Cache is short-lived (30-60 seconds)
 * - Worst case: 1 extra PhonePe call per instance
 * 
 * For multi-region production, consider Vercel KV (Redis)
 */

interface CacheEntry {
  status: string;
  timestamp: number;
  data?: unknown;
}

class PaymentCache {
  private cache: Map<string, CacheEntry>;
  private cleanupInterval: NodeJS.Timeout | null;
  private readonly defaultTTL = 30000; // 30 seconds
  private readonly cleanupIntervalMs = 60000; // Clean up every 60 seconds

  constructor() {
    this.cache = new Map();
    this.cleanupInterval = null;
    
    // Start cleanup only in production (not during builds)
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
      this.startCleanup();
    }
  }

  /**
   * Get cached payment status
   * Returns null if not cached or expired
   */
  get(key: string): string | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > this.defaultTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.status;
  }

  /**
   * Get cached entry with full data
   */
  getEntry(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > this.defaultTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return entry;
  }

  /**
   * Cache payment status
   * @param key - Cache key (e.g., "payment_verify_{orderId}")
   * @param status - Payment status (COMPLETED, FAILED, PENDING)
   * @param ttl - Time to live in seconds (default: 30)
   * @param data - Optional additional data to cache
   */
  set(key: string, status: string, ttl: number = 30, data?: unknown): void {
    this.cache.set(key, {
      status,
      timestamp: Date.now(),
      data,
    });
    
    // Auto-cleanup after TTL + buffer
    setTimeout(() => {
      this.cache.delete(key);
    }, (ttl + 5) * 1000);
  }

  /**
   * Manually invalidate a cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }

  /**
   * Periodic cleanup of expired entries
   */
  private startCleanup(): void {
    if (this.cleanupInterval) {
      return;
    }
    
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];
      
      for (const [key, entry] of this.cache.entries()) {
        const age = now - entry.timestamp;
        if (age > this.defaultTTL) {
          keysToDelete.push(key);
        }
      }
      
      for (const key of keysToDelete) {
        this.cache.delete(key);
      }
      
      if (keysToDelete.length > 0) {
        console.log(`[CACHE] Cleaned up ${keysToDelete.length} expired entries`);
      }
    }, this.cleanupIntervalMs);
  }

  /**
   * Stop cleanup interval (for graceful shutdown)
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export singleton instance
export const paymentCache = new PaymentCache();

// Helper functions for common operations
export function getCachedPaymentStatus(orderId: string): string | null {
  return paymentCache.get(`payment_verify_${orderId}`);
}

export function setCachedPaymentStatus(
  orderId: string,
  status: string,
  ttl: number = 30,
  data?: unknown
): void {
  paymentCache.set(`payment_verify_${orderId}`, status, ttl, data);
}

export function invalidatePaymentCache(orderId: string): void {
  paymentCache.invalidate(`payment_verify_${orderId}`);
}

// Helper to create rate-limited PhonePe verification
export function shouldSkipVerification(orderId: string): {
  skip: boolean;
  cachedStatus?: string;
  reason?: string;
} {
  const cached = paymentCache.getEntry(`payment_verify_${orderId}`);
  
  if (!cached) {
    return { skip: false };
  }
  
  // If cached as COMPLETED or FAILED, skip verification (final states)
  if (cached.status === 'COMPLETED' || cached.status === 'FAILED') {
    return {
      skip: true,
      cachedStatus: cached.status,
      reason: 'Final state cached',
    };
  }
  
  // If cached as PENDING and cache is fresh (< 10 seconds), skip
  const age = Date.now() - cached.timestamp;
  if (cached.status === 'PENDING' && age < 10000) {
    return {
      skip: true,
      cachedStatus: cached.status,
      reason: 'Recently verified as pending',
    };
  }
  
  return { skip: false };
}


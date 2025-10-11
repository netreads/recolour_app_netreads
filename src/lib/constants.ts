// Application constants - Single source of truth for pricing and configuration

// Pricing (in paise - multiply by 100 to convert rupees to paise)
export const PRICING = {
  SINGLE_IMAGE: {
    RUPEES: 49,
    PAISE: 4900,
    NAME: 'Single Image Colorization',
    DESCRIPTION: 'Try It Once',
  },
} as const;

// File upload constraints
export const FILE_CONSTRAINTS = {
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
} as const;

// API timeouts and limits
export const API_CONFIG = {
  ORDER_EXPIRY_SECONDS: 3600, // 1 hour
  MIN_ORDER_EXPIRY: 300, // 5 minutes
  MAX_ORDER_EXPIRY: 3600, // 1 hour
  IMAGE_CACHE_SECONDS: 31536000, // 1 year (images are immutable)
  IMAGE_CDN_CACHE_SECONDS: 31536000, // 1 year
  API_MAX_DURATION: 60, // 60 seconds max for API routes (Vercel limit)
} as const;

// Job status values
export const JOB_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  DONE: 'DONE',
  FAILED: 'FAILED',
} as const;

// Order status values
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

// Payment status values
export const PAYMENT_STATUS = {
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  PENDING: 'PENDING',
} as const;

// Helper functions
export function formatRupees(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

export function parseRupees(rupees: number): number {
  return Math.round(rupees * 100);
}


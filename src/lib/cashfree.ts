import { Cashfree } from 'cashfree-pg-sdk-javascript';

// Cashfree configuration
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID!;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY!;
const CASHFREE_ENVIRONMENT = process.env.CASHFREE_ENVIRONMENT || 'sandbox'; // 'sandbox' or 'production'

// Initialize Cashfree client
export const cashfree = new Cashfree({
  appId: CASHFREE_APP_ID,
  secretKey: CASHFREE_SECRET_KEY,
  environment: CASHFREE_ENVIRONMENT as 'sandbox' | 'production',
});

// Credit packages configuration
export const CREDIT_PACKAGES = {
  'starter': {
    name: 'Starter Pack',
    credits: 1,
    amount: 4900, // ₹49 in paise
    description: 'Perfect for trying out our service'
  },
  'value': {
    name: 'Value Pack',
    credits: 5,
    amount: 19900, // ₹199 in paise
    description: 'Best value for regular users'
  },
  'pro': {
    name: 'Pro Pack',
    credits: 12,
    amount: 39900, // ₹399 in paise
    description: 'For power users and professionals'
  },
  'business': {
    name: 'Business Pack',
    credits: 35,
    amount: 99900, // ₹999 in paise
    description: 'For teams and businesses'
  }
} as const;

export type CreditPackageType = keyof typeof CREDIT_PACKAGES;

// Utility functions
export function formatAmount(amount: number): string {
  return `₹${(amount / 100).toFixed(2)}`;
}

export function parseAmount(amountString: string): number {
  // Convert ₹49.90 to 4990 paise
  const numericValue = parseFloat(amountString.replace('₹', ''));
  return Math.round(numericValue * 100);
}

// Generate unique order ID
export function generateOrderId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `order_${timestamp}_${random}`;
}

// Validate webhook signature
export function validateWebhookSignature(payload: string, signature: string): boolean {
  // Cashfree webhook signature validation
  // This is a simplified version - implement proper signature validation
  return true; // TODO: Implement proper signature validation
}

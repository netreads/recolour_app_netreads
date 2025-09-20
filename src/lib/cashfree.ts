// Cashfree configuration (server-side REST)
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID!;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY!;
const CASHFREE_ENVIRONMENT = process.env.CASHFREE_ENVIRONMENT || 'sandbox'; // 'sandbox' | 'production'

const CASHFREE_BASE_URL =
  CASHFREE_ENVIRONMENT === 'production'
    ? 'https://api.cashfree.com'
    : 'https://sandbox.cashfree.com';

type CreateOrderParams = {
  orderId: string;
  orderAmountRupees: number; // amount in rupees
  orderNote: string;
  customerDetails: {
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  };
  returnUrl?: string; // optional per docs
  notifyUrl?: string; // optional per docs
};

type CreateOrderResponse = {
  cfOrderId: string;
  paymentSessionId: string;
  customerDetails?: unknown;
};

export async function createCashfreeOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
  const payload: any = {
    order_id: params.orderId,
    order_amount: Number(params.orderAmountRupees.toFixed(2)),
    order_currency: 'INR',
    customer_details: {
      customer_id: params.customerDetails.customerId,
      customer_phone: params.customerDetails.customerPhone,
    },
  };
  // Optional fields if available (kept minimal to match docs)
  if (params.customerDetails.customerName) payload.customer_details.customer_name = params.customerDetails.customerName;
  if (params.customerDetails.customerEmail) payload.customer_details.customer_email = params.customerDetails.customerEmail;
  if (params.orderNote) payload.order_note = params.orderNote;
  if (params.returnUrl || params.notifyUrl) {
    payload.order_meta = {} as any;
    if (params.returnUrl) payload.order_meta.return_url = params.returnUrl;
    if (params.notifyUrl) payload.order_meta.notify_url = params.notifyUrl;
  }

  type VersionType = '2025-01-01' | '2023-08-01' | '2022-01-01';
  async function attempt(version: VersionType) {
    const res = await fetch(`${CASHFREE_BASE_URL}/pg/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': version,
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let data: any = undefined;
    try { data = text ? JSON.parse(text) : undefined; } catch {}
    return { res, data, text };
  }

  const versions: VersionType[] = ['2025-01-01', '2023-08-01', '2022-01-01'];
  let attemptResult = await attempt(versions[0]);
  let response = attemptResult.res;
  let data = attemptResult.data;
  let text = attemptResult.text;
  let vIndex = 1;
  while ((response.status === 404 || (data && data.code === 'request_failed')) && vIndex < versions.length) {
    attemptResult = await attempt(versions[vIndex]);
    response = attemptResult.res;
    data = attemptResult.data;
    text = attemptResult.text;
    vIndex++;
  }

  // data/text already set from the last attempt

  if (!response.ok) {
    const errMessage = data?.message || data?.error || response.statusText || 'Cashfree order creation failed';
    console.error('Cashfree create order failed', {
      status: response.status,
      statusText: response.statusText,
      body: data ?? text,
      requestId: response.headers.get('x-request-id') || undefined,
    });
    const error: any = new Error(errMessage);
    error.status = response.status;
    error.details = data ?? text;
    throw error;
  }

  return {
    cfOrderId: data?.cf_order_id != null ? String(data.cf_order_id) : '',
    paymentSessionId: data?.payment_session_id != null ? String(data.payment_session_id) : '',
    customerDetails: data?.customer_details,
  };
}

export async function getCashfreeOrder(orderId: string): Promise<any> {
  type VersionType = '2025-01-01' | '2023-08-01' | '2022-01-01';
  async function attempt(version: VersionType) {
    const res = await fetch(`${CASHFREE_BASE_URL}/pg/orders/${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': version,
      },
    });
    const text = await res.text();
    let data: any = undefined;
    try { data = text ? JSON.parse(text) : undefined; } catch {}
    return { res, data, text };
  }

  const versions: VersionType[] = ['2025-01-01', '2023-08-01', '2022-01-01'];
  let attemptResult = await attempt(versions[0]);
  let response = attemptResult.res;
  let data = attemptResult.data;
  let text = attemptResult.text;
  let vIndex = 1;
  while ((response.status === 404 || (data && data.code === 'request_failed')) && vIndex < versions.length) {
    attemptResult = await attempt(versions[vIndex]);
    response = attemptResult.res;
    data = attemptResult.data;
    text = attemptResult.text;
    vIndex++;
  }

  if (!response.ok) {
    console.error('Cashfree get order failed', {
      status: response.status,
      statusText: response.statusText,
      body: data ?? text,
      requestId: response.headers.get('x-request-id') || undefined,
    });
    const error: any = new Error(data?.message || data?.error || response.statusText || 'Cashfree get order failed');
    error.status = response.status;
    error.details = data ?? text;
    throw error;
  }

  return data;
}

// Credit packages configuration
export const CREDIT_PACKAGES = {
  'starter': {
    name: 'Starter Pack',
    credits: 3,
    amount: 9900, // stored in paise
    description: 'Perfect for trying out our service'
  },
  'value': {
    name: 'Value Pack',
    credits: 10,
    amount: 24900, // stored in paise
    description: 'Best value for regular users'
  },
  'pro': {
    name: 'Pro Pack',
    credits: 25,
    amount: 49900, // stored in paise
    description: 'For power users and professionals'
  },
  'business': {
    name: 'Business Pack',
    credits: 60,
    amount: 99900, // stored in paise
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

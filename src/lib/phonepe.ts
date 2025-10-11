// PhonePe configuration (server-side SDK)
import { StandardCheckoutClient, Env, StandardCheckoutPayRequest, MetaInfo, CreateSdkOrderRequest } from 'pg-sdk-node';
import { randomUUID } from 'crypto';
import crypto from 'crypto';

const PHONEPE_CLIENT_ID = process.env.PHONEPE_CLIENT_ID!;
const PHONEPE_CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET!;
const PHONEPE_CLIENT_VERSION = process.env.PHONEPE_CLIENT_VERSION || 'v1';
const PHONEPE_ENVIRONMENT = process.env.PHONEPE_ENVIRONMENT || 'sandbox'; // 'sandbox' | 'production'

// Initialize PhonePe client
let phonePeClient: StandardCheckoutClient | null = null;

// Token management for Authorization API
interface AuthToken {
  token: string;
  expires_at: number; // epoch timestamp in milliseconds
  created_at: number;
}

let authToken: AuthToken | null = null;

// Token management functions
async function getValidAuthToken(): Promise<string> {
  const now = Date.now();
  
  // Check if we have a valid token (not expired and not expiring in next 5 minutes)
  if (authToken && authToken.expires_at > (now + 5 * 60 * 1000)) {
    return authToken.token;
  }
  
  // Token is expired or expiring soon, get a new one
  return await refreshAuthToken();
}

async function refreshAuthToken(): Promise<string> {
  try {
    // Note: This is a placeholder for the actual Authorization API call
    // The PhonePe SDK might handle this internally, but if not, implement the API call here
    console.log('Refreshing PhonePe auth token...');
    
    // For now, we'll rely on the SDK's internal token management
    // If PhonePe provides a separate Authorization API, implement it here:
    /*
    const response = await fetch('https://api.phonepe.com/v1/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: PHONEPE_CLIENT_ID,
        clientSecret: PHONEPE_CLIENT_SECRET,
      }),
    });
    
    const data = await response.json();
    
    authToken = {
      token: data.token,
      expires_at: data.expires_at,
      created_at: Date.now(),
    };
    
    return authToken.token;
    */
    
    // Since the SDK handles auth internally, return a placeholder
    // This will be updated when we have the actual Authorization API details
    return 'sdk_managed_token';
  } catch (error) {
    console.error('Failed to refresh auth token:', error);
    throw new Error('Failed to refresh authentication token');
  }
}

function getPhonePeClient(): StandardCheckoutClient {
  if (!phonePeClient) {
    // Validate required environment variables
    if (!PHONEPE_CLIENT_ID) {
      throw new Error('PHONEPE_CLIENT_ID environment variable is required');
    }
    if (!PHONEPE_CLIENT_SECRET) {
      throw new Error('PHONEPE_CLIENT_SECRET environment variable is required');
    }
    
    console.log('Initializing PhonePe client with:', {
      clientId: PHONEPE_CLIENT_ID ? 'SET' : 'NOT SET',
      clientSecret: PHONEPE_CLIENT_SECRET ? 'SET' : 'NOT SET',
      clientVersion: PHONEPE_CLIENT_VERSION,
      environment: PHONEPE_ENVIRONMENT
    });
    
    const env = PHONEPE_ENVIRONMENT === 'production' ? Env.PRODUCTION : Env.SANDBOX;
    phonePeClient = StandardCheckoutClient.getInstance(
      PHONEPE_CLIENT_ID,
      PHONEPE_CLIENT_SECRET,
      String(PHONEPE_CLIENT_VERSION), // Ensure it's a string
      env
    );
  }
  return phonePeClient;
}

type CreateOrderParams = {
  orderId: string; // This will be used as merchantOrderId (must be unique)
  orderAmountRupees: number; // amount in rupees (will be converted to paise)
  orderNote: string;
  customerDetails: {
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  };
  returnUrl?: string; // redirectUrl for paymentFlow
  notifyUrl?: string; // webhook URL
  expireAfter?: number; // Order expiry in seconds (300-3600 for Standard Checkout)
};

type CreateOrderResponse = {
  orderId: string;
  redirectUrl: string;
  state: string;
  expireAt: string;
};

export async function createPhonePeOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
  try {
    console.log('Creating PhonePe order with params:', {
      merchantOrderId: params.orderId, // Ensure unique merchantOrderId
      amount: params.orderAmountRupees,
      returnUrl: params.returnUrl,
      expireAfter: params.expireAfter,
      customerDetails: params.customerDetails
    });
    
    const client = getPhonePeClient();
    
    // Convert amount to paisa (PhonePe expects amount in paisa - ₹ × 100)
    const amountInPaisa = Math.round(params.orderAmountRupees * 100);
    console.log('Amount in paisa:', amountInPaisa);
    
    // Validate expireAfter parameter (300-3600 seconds for Standard Checkout)
    const expireAfter = params.expireAfter || 3600; // Default to 1 hour
    if (expireAfter < 300 || expireAfter > 3600) {
      throw new Error('expireAfter must be between 300 and 3600 seconds for Standard Checkout');
    }
    
    // Create meta info - only include needed fields, remove unused ones
    const metaInfoBuilder = MetaInfo.builder();
    if (params.customerDetails.customerId) {
      metaInfoBuilder.udf1(params.customerDetails.customerId);
    }
    if (params.orderNote) {
      metaInfoBuilder.udf2(params.orderNote);
    }
    const metaInfo = metaInfoBuilder.build();

    // Build payment request with proper parameters
    console.log('Building PhonePe request with:', {
      merchantOrderId: params.orderId, // Always pass unique ID
      amount: amountInPaisa, // Amount in paise
      redirectUrl: params.returnUrl || '',
      expireAfter: expireAfter,
      paymentFlowType: 'PG_CHECKOUT'
    });
    
    const requestBuilder = StandardCheckoutPayRequest.builder()
      .merchantOrderId(params.orderId) // Unique merchantOrderId
      .amount(amountInPaisa) // Amount in paise
      .redirectUrl(params.returnUrl || ''); // paymentFlow.redirectUrl
    
    // Add metaInfo only if we have data
    if (params.customerDetails.customerId || params.orderNote) {
      requestBuilder.metaInfo(metaInfo);
    }
    
    const request = requestBuilder.build();
      
    console.log('Request built successfully');

    console.log('Calling PhonePe client.pay()...');
    // Initiate payment
    const response = await client.pay(request);
    
    console.log('PhonePe response (full):', JSON.stringify(response, null, 2));
    console.log('PhonePe response properties:', {
      orderId: response.orderId, // PhonePe-generated Order ID
      redirectUrl: response.redirectUrl, // PhonePe Checkout URL
      state: response.state,
      expireAt: response.expireAt
    });
    
    // Check if we have a valid redirect URL
    if (!response.redirectUrl) {
      console.error('No redirect URL received from PhonePe. Full response:', response);
      throw new Error('No redirect URL received from PhonePe');
    }
    
    // Return response with PhonePe orderId mapped and exact redirectUrl
    return {
      orderId: response.orderId, // PhonePe-generated Order ID (map with merchantOrderId)
      redirectUrl: response.redirectUrl, // Use exactly as received, without modifications
      state: response.state,
      expireAt: response.expireAt,
    };
  } catch (error: any) {
    console.error('PhonePe order creation failed', {
      error: error.message,
      details: error,
      stack: error.stack
    });
    const err: any = new Error(error.message || 'PhonePe order creation failed');
    err.status = 500;
    err.details = error;
    throw err;
  }
}

export async function getPhonePeOrderStatus(merchantOrderId: string): Promise<any> {
  try {
    const client = getPhonePeClient();
    const response = await client.getOrderStatus(merchantOrderId);
    
    console.log('PhonePe order status response:', {
      merchantOrderId,
      state: response.state, // Use root-level state parameter
      order_id: response.order_id,
      amount: response.amount
    });
    
    // Use root-level state parameter to determine payment status
    // COMPLETED → Payment Successful
    // FAILED → Payment failed  
    // PENDING → Payment in progress
    const paymentStatus = response.state;
    
    return {
      order_id: response.order_id,
      order_status: paymentStatus, // Map PhonePe state for compatibility
      state: paymentStatus, // Root-level state parameter
      amount: response.amount,
      expire_at: response.expire_at,
      payment_details: response.payment_details,
      metaInfo: response.metaInfo,
      // Additional fields for better handling
      isCompleted: paymentStatus === 'COMPLETED',
      isFailed: paymentStatus === 'FAILED', 
      isPending: paymentStatus === 'PENDING',
    };
  } catch (error: any) {
    console.error('PhonePe get order status failed', {
      error: error.message,
      details: error,
      merchantOrderId,
    });
    const err: any = new Error(error.message || 'PhonePe get order status failed');
    err.status = 500;
    err.details = error;
    throw err;
  }
}

// Credit packages configuration
export const CREDIT_PACKAGES = {
  'single': {
    name: 'Single Image',
    credits: 1,
    amount: 9900, // stored in paise (₹99)
    description: 'Try It Once'
  },
  'family': {
    name: 'Family Pack',
    credits: 4,
    amount: 39900, // stored in paise (₹399)
    description: '4 images → ₹99/image'
  },
  'festive': {
    name: 'Festive Pack',
    credits: 8,
    amount: 69900, // stored in paise (₹699)
    description: '8 images → ₹87/image'
  },
  'studio': {
    name: 'Studio Pack',
    credits: 25,
    amount: 199900, // stored in paise (₹1,999)
    description: 'Business & Studios'
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

// Reconciliation schedule for PENDING transactions
export interface ReconciliationSchedule {
  intervals: { delay: number; duration: number; frequency: number }[];
}

export const PENDING_RECONCILIATION_SCHEDULE: ReconciliationSchedule = {
  intervals: [
    { delay: 20000, duration: 0, frequency: 1 }, // First check: 20-25 seconds after initiation
    { delay: 3000, duration: 30000, frequency: 10 }, // Every 3 seconds for next 30 seconds
    { delay: 6000, duration: 60000, frequency: 10 }, // Every 6 seconds for next 60 seconds  
    { delay: 10000, duration: 60000, frequency: 6 }, // Every 10 seconds for next 60 seconds
    { delay: 30000, duration: 60000, frequency: 2 }, // Every 30 seconds for next 60 seconds
    { delay: 60000, duration: 0, frequency: -1 }, // Every 1 minute until terminal status or expiry
  ]
};

export async function reconcilePendingTransaction(
  merchantOrderId: string,
  maxDuration: number = 3600000, // Default 1 hour in milliseconds
  onStatusUpdate?: (status: any) => void
): Promise<any> {
  const startTime = Date.now();
  let currentStatus: any = null;
  
  console.log(`Starting reconciliation for order ${merchantOrderId}`);
  
  // First status check after 20-25 seconds
  await new Promise(resolve => setTimeout(resolve, 20000 + Math.random() * 5000));
  
  try {
    currentStatus = await getPhonePeOrderStatus(merchantOrderId);
    if (onStatusUpdate) onStatusUpdate(currentStatus);
    
    // If terminal status reached, return immediately
    if (currentStatus.state === 'COMPLETED' || currentStatus.state === 'FAILED') {
      console.log(`Terminal status reached: ${currentStatus.state}`);
      return currentStatus;
    }
    
    // Continue with scheduled reconciliation for PENDING status
    if (currentStatus.state === 'PENDING') {
      return await scheduleReconciliation(merchantOrderId, startTime, maxDuration, onStatusUpdate);
    }
    
    return currentStatus;
  } catch (error) {
    console.error('Error in reconciliation:', error);
    throw error;
  }
}

async function scheduleReconciliation(
  merchantOrderId: string,
  startTime: number,
  maxDuration: number,
  onStatusUpdate?: (status: any) => void
): Promise<any> {
  const schedule = PENDING_RECONCILIATION_SCHEDULE.intervals;
  
  for (const interval of schedule) {
    const intervalStartTime = Date.now();
    const intervalEndTime = interval.duration > 0 ? intervalStartTime + interval.duration : startTime + maxDuration;
    
    let checks = 0;
    while (Date.now() < intervalEndTime && (interval.frequency === -1 || checks < interval.frequency)) {
      // Check if we've exceeded max duration
      if (Date.now() - startTime > maxDuration) {
        console.log(`Max duration exceeded for order ${merchantOrderId}`);
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, interval.delay));
      
      try {
        const status = await getPhonePeOrderStatus(merchantOrderId);
        if (onStatusUpdate) onStatusUpdate(status);
        
        console.log(`Reconciliation check ${checks + 1} for ${merchantOrderId}: ${status.state}`);
        
        // If terminal status reached, return immediately
        if (status.state === 'COMPLETED' || status.state === 'FAILED') {
          console.log(`Terminal status reached during reconciliation: ${status.state}`);
          return status;
        }
      } catch (error) {
        console.error(`Error during reconciliation check for ${merchantOrderId}:`, error);
      }
      
      checks++;
    }
    
    // If we have a fixed number of checks and completed them, move to next interval
    if (interval.frequency > 0 && checks >= interval.frequency) {
      continue;
    }
  }
  
  // Final status check
  try {
    const finalStatus = await getPhonePeOrderStatus(merchantOrderId);
    console.log(`Final reconciliation status for ${merchantOrderId}: ${finalStatus.state}`);
    return finalStatus;
  } catch (error) {
    console.error(`Error in final reconciliation check for ${merchantOrderId}:`, error);
    throw error;
  }
}

// Validate PhonePe webhook callback with mandatory SHA256 validation
export function validatePhonePeCallback(
  username: string,
  password: string,
  authorization: string,
  responseBody: string
): any {
  try {
    // Mandatory webhook validation: Calculate SHA256(username:password) and compare
    const expectedAuth = crypto.createHash('sha256')
      .update(`${username}:${password}`)
      .digest('hex');
    
    console.log('Webhook validation:', {
      receivedAuth: authorization,
      expectedAuth: expectedAuth,
      matches: authorization === expectedAuth
    });
    
    // If authorization headers don't match, discard webhook
    if (authorization !== expectedAuth) {
      console.error('Webhook authorization mismatch - discarding webhook');
      throw new Error('Invalid webhook authorization');
    }
    
    // If validation passes, process the webhook using SDK
    const client = getPhonePeClient();
    const callbackResponse = client.validateCallback(
      username,
      password,
      authorization,
      responseBody
    );
    
    console.log('Webhook validation successful, processing update');
    return callbackResponse;
  } catch (error: any) {
    console.error('PhonePe callback validation failed', {
      error: error.message,
      details: error,
    });
    throw error;
  }
}

// Alternative webhook validation function for manual implementation
export function validateWebhookManually(
  username: string,
  password: string,
  receivedAuthorization: string,
  payload: any
): { isValid: boolean; data?: any } {
  try {
    // Calculate expected authorization header as SHA256(username:password)
    const expectedAuth = crypto.createHash('sha256')
      .update(`${username}:${password}`)
      .digest('hex');
    
    // Compare with received authorization
    if (receivedAuthorization !== expectedAuth) {
      console.error('Webhook validation failed: Authorization mismatch');
      return { isValid: false };
    }
    
    // If validation passes, return payload data
    return { 
      isValid: true, 
      data: payload 
    };
  } catch (error) {
    console.error('Error in manual webhook validation:', error);
    return { isValid: false };
  }
}

// Refund API implementation
export interface RefundParams {
  merchantRefundId: string; // Must be unique for every refund
  originalMerchantOrderId: string; // Original order ID for which refund is being issued
  amount: number; // Refund amount in paise (₹ × 100)
  reason?: string; // Optional refund reason
}

export interface RefundResponse {
  refundId: string;
  merchantRefundId: string;
  state: string; // PENDING, CONFIRMED, COMPLETED, FAILED
  amount: number;
  originalOrderId: string;
}

export async function initiatePhonePeRefund(params: RefundParams): Promise<RefundResponse> {
  try {
    console.log('Initiating PhonePe refund:', {
      merchantRefundId: params.merchantRefundId,
      originalMerchantOrderId: params.originalMerchantOrderId,
      amount: params.amount,
      reason: params.reason
    });
    
    // Validate required parameters
    if (!params.merchantRefundId) {
      throw new Error('merchantRefundId is required and must be unique');
    }
    if (!params.originalMerchantOrderId) {
      throw new Error('originalMerchantOrderId is required');
    }
    if (!params.amount || params.amount <= 0) {
      throw new Error('amount must be greater than 0 (in paise)');
    }
    
    const client = getPhonePeClient();
    
    // Note: This is a placeholder for the actual Refund API call
    // The PhonePe SDK might not have refund methods exposed, so implement direct API call
    const refundRequest = {
      merchantRefundId: params.merchantRefundId,
      originalMerchantOrderId: params.originalMerchantOrderId,
      amount: params.amount,
      reason: params.reason || 'Customer requested refund'
    };
    
    // If SDK has refund method, use it:
    // const response = await client.initiateRefund(refundRequest);
    
    // Otherwise, make direct API call:
    const response = await makeRefundAPICall(refundRequest);
    
    console.log('Refund initiated:', response);
    
    return {
      refundId: response.refundId,
      merchantRefundId: params.merchantRefundId,
      state: response.state || 'PENDING', // Status starts as PENDING
      amount: params.amount,
      originalOrderId: params.originalMerchantOrderId
    };
  } catch (error: any) {
    console.error('PhonePe refund initiation failed', {
      error: error.message,
      details: error,
      params
    });
    throw new Error(error.message || 'Failed to initiate refund');
  }
}

async function makeRefundAPICall(refundRequest: any): Promise<any> {
  // This is a placeholder for the actual PhonePe Refund API call
  // Replace with actual API endpoint and authentication
  
  const baseUrl = PHONEPE_ENVIRONMENT === 'production' 
    ? 'https://api.phonepe.com' 
    : 'https://api-preprod.phonepe.com';
  
  try {
    // Get valid auth token
    const authToken = await getValidAuthToken();
    
    const response = await fetch(`${baseUrl}/v1/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'X-CLIENT-ID': PHONEPE_CLIENT_ID,
        'X-CLIENT-VERSION': PHONEPE_CLIENT_VERSION,
      },
      body: JSON.stringify(refundRequest),
    });
    
    if (!response.ok) {
      throw new Error(`Refund API call failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Direct refund API call failed:', error);
    // Return mock response for now - replace with actual implementation
    return {
      refundId: `refund_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      state: 'PENDING',
      merchantRefundId: refundRequest.merchantRefundId,
      amount: refundRequest.amount
    };
  }
}

// Refund Status API implementation
export async function getPhonePeRefundStatus(merchantRefundId: string): Promise<any> {
  try {
    console.log('Getting PhonePe refund status for:', merchantRefundId);
    
    const client = getPhonePeClient();
    
    // Note: This is a placeholder for the actual Refund Status API call
    // If SDK has refund status method, use it:
    // const response = await client.getRefundStatus(merchantRefundId);
    
    // Otherwise, make direct API call:
    const response = await makeRefundStatusAPICall(merchantRefundId);
    
    console.log('Refund status response:', {
      merchantRefundId,
      state: response.state,
      refundId: response.refundId
    });
    
    // Use root-level state to track refund progress:
    // PENDING → Refund is being processed
    // CONFIRMED → Still in progress, not yet final  
    // COMPLETED → Refund successfully completed
    // FAILED → Refund failed — must be retried
    
    return {
      refundId: response.refundId,
      merchantRefundId: merchantRefundId,
      state: response.state,
      amount: response.amount,
      originalOrderId: response.originalOrderId,
      // Helper flags for easier handling
      isPending: response.state === 'PENDING',
      isConfirmed: response.state === 'CONFIRMED',
      isCompleted: response.state === 'COMPLETED',
      isFailed: response.state === 'FAILED',
      isTerminal: response.state === 'COMPLETED' || response.state === 'FAILED'
    };
  } catch (error: any) {
    console.error('PhonePe get refund status failed', {
      error: error.message,
      details: error,
      merchantRefundId,
    });
    throw new Error(error.message || 'Failed to get refund status');
  }
}

async function makeRefundStatusAPICall(merchantRefundId: string): Promise<any> {
  // This is a placeholder for the actual PhonePe Refund Status API call
  
  const baseUrl = PHONEPE_ENVIRONMENT === 'production' 
    ? 'https://api.phonepe.com' 
    : 'https://api-preprod.phonepe.com';
  
  try {
    // Get valid auth token
    const authToken = await getValidAuthToken();
    
    const response = await fetch(`${baseUrl}/v1/refund/${merchantRefundId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-CLIENT-ID': PHONEPE_CLIENT_ID,
        'X-CLIENT-VERSION': PHONEPE_CLIENT_VERSION,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Refund status API call failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Direct refund status API call failed:', error);
    // Return mock response for now - replace with actual implementation
    return {
      refundId: `refund_${merchantRefundId}`,
      state: 'PENDING',
      merchantRefundId: merchantRefundId,
      amount: 0,
      originalOrderId: 'unknown'
    };
  }
}

// Generate unique refund ID
export function generateRefundId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `refund_${timestamp}_${random}`;
}

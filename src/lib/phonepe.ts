// PhonePe configuration (server-side SDK)
import { StandardCheckoutClient, Env, StandardCheckoutPayRequest, MetaInfo } from 'pg-sdk-node';
import crypto from 'crypto';
import { getServerEnv } from './env';

// Initialize PhonePe client
let phonePeClient: StandardCheckoutClient | null = null;

function getPhonePeClient(): StandardCheckoutClient {
  if (!phonePeClient) {
    const env = getServerEnv();
    
    const phonePeEnv = env.PHONEPE_ENVIRONMENT === 'production' ? Env.PRODUCTION : Env.SANDBOX;
    const clientVersion = env.PHONEPE_CLIENT_VERSION || 'v1';
    
    phonePeClient = StandardCheckoutClient.getInstance(
      env.PHONEPE_CLIENT_ID,
      env.PHONEPE_CLIENT_SECRET,
      String(clientVersion),
      phonePeEnv
    );
  }
  return phonePeClient;
}

export type CreateOrderParams = {
  orderId: string;
  orderAmountRupees: number;
  orderNote: string;
  customerDetails: {
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  };
  returnUrl?: string;
  notifyUrl?: string;
  expireAfter?: number;
};

export type CreateOrderResponse = {
  orderId: string;
  redirectUrl: string;
  state: string;
  expireAt: string;
};

export type PhonePeOrderStatus = {
  order_id: string;
  order_status: string;
  state: string;
  amount: number;
  expire_at: string | number;
  payment_details: unknown;
  metaInfo: unknown;
  isCompleted: boolean;
  isFailed: boolean;
  isPending: boolean;
};

export async function createPhonePeOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
  try {
    const client = getPhonePeClient();
    const env = getServerEnv();
    
    // Convert amount to paisa (PhonePe expects amount in paisa - ₹ × 100)
    const amountInPaisa = Math.round(params.orderAmountRupees * 100);
    
    // Validate expireAfter parameter (300-3600 seconds for Standard Checkout)
    const expireAfter = params.expireAfter || 3600;
    if (expireAfter < 300 || expireAfter > 3600) {
      throw new Error('expireAfter must be between 300 and 3600 seconds for Standard Checkout');
    }
    
    // Create meta info - only include needed fields
    const metaInfoBuilder = MetaInfo.builder();
    if (params.customerDetails.customerId) {
      metaInfoBuilder.udf1(params.customerDetails.customerId);
    }
    if (params.orderNote) {
      metaInfoBuilder.udf2(params.orderNote);
    }
    const metaInfo = metaInfoBuilder.build();

    // Build payment request with proper parameters
    const requestBuilder = StandardCheckoutPayRequest.builder()
      .merchantOrderId(params.orderId)
      .amount(amountInPaisa)
      .redirectUrl(params.returnUrl || '');
    
    // Add metaInfo only if we have data
    if (params.customerDetails.customerId || params.orderNote) {
      requestBuilder.metaInfo(metaInfo);
    }
    
    const request = requestBuilder.build();

    // Initiate payment
    const response = await client.pay(request);
    
    // Check if we have a valid redirect URL
    if (!response.redirectUrl) {
      throw new Error('No redirect URL received from PhonePe');
    }
    
    // Return response with PhonePe orderId mapped and exact redirectUrl
    return {
      orderId: response.orderId,
      redirectUrl: response.redirectUrl,
      state: response.state,
      expireAt: response.expireAt,
    };
  } catch (error: unknown) {
    const err = error as Error & { status?: number; details?: unknown };
    const wrappedError = new Error(err.message || 'PhonePe order creation failed') as Error & { status: number; details: unknown };
    wrappedError.status = err.status || 500;
    wrappedError.details = error;
    throw wrappedError;
  }
}

export async function getPhonePeOrderStatus(merchantOrderId: string): Promise<PhonePeOrderStatus> {
  try {
    const client = getPhonePeClient();
    const response = await client.getOrderStatus(merchantOrderId);
    
    // Use root-level state parameter to determine payment status
    // COMPLETED → Payment Successful
    // FAILED → Payment failed  
    // PENDING → Payment in progress
    const paymentStatus = response.state;
    
    return {
      order_id: response.order_id,
      order_status: paymentStatus,
      state: paymentStatus,
      amount: response.amount,
      expire_at: response.expire_at,
      payment_details: response.payment_details,
      metaInfo: response.metaInfo,
      isCompleted: paymentStatus === 'COMPLETED',
      isFailed: paymentStatus === 'FAILED', 
      isPending: paymentStatus === 'PENDING',
    };
  } catch (error: unknown) {
    const err = error as Error & { status?: number; details?: unknown };
    const wrappedError = new Error(err.message || 'PhonePe get order status failed') as Error & { status: number; details: unknown };
    wrappedError.status = err.status || 500;
    wrappedError.details = error;
    throw wrappedError;
  }
}

// Note: Credit packages removed as app only supports single image purchases
// See constants.ts for pricing configuration

// Generate unique order ID
export function generateOrderId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `order_${timestamp}_${random}`;
}


// Validate PhonePe webhook callback with mandatory SHA256 validation
export function validatePhonePeCallback(
  username: string,
  password: string,
  authorization: string,
  responseBody: string
): unknown {
  // Mandatory webhook validation: Calculate SHA256(username:password) and compare
  const expectedAuth = crypto.createHash('sha256')
    .update(`${username}:${password}`)
    .digest('hex');
  
  // If authorization headers don't match, discard webhook
  if (authorization !== expectedAuth) {
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
  
  return callbackResponse;
}


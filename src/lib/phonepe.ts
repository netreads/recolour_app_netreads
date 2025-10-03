// PhonePe configuration (server-side SDK)
import { StandardCheckoutClient, Env, StandardCheckoutPayRequest, MetaInfo, CreateSdkOrderRequest } from 'pg-sdk-node';
import { randomUUID } from 'crypto';

const PHONEPE_CLIENT_ID = process.env.PHONEPE_CLIENT_ID!;
const PHONEPE_CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET!;
const PHONEPE_CLIENT_VERSION = process.env.PHONEPE_CLIENT_VERSION || 'v1';
const PHONEPE_ENVIRONMENT = process.env.PHONEPE_ENVIRONMENT || 'sandbox'; // 'sandbox' | 'production'

// Initialize PhonePe client
let phonePeClient: StandardCheckoutClient | null = null;

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
  orderId: string;
  redirectUrl: string;
  state: string;
  expireAt: string;
};

export async function createPhonePeOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
  try {
    console.log('Creating PhonePe order with params:', {
      orderId: params.orderId,
      amount: params.orderAmountRupees,
      returnUrl: params.returnUrl,
      customerDetails: params.customerDetails
    });
    
    const client = getPhonePeClient();
    
    // Convert amount to paisa (PhonePe expects amount in paisa)
    const amountInPaisa = Math.round(params.orderAmountRupees * 100);
    console.log('Amount in paisa:', amountInPaisa);
    
    // Create meta info if needed
    const metaInfo = MetaInfo.builder()
      .udf1(params.customerDetails.customerId)
      .udf2(params.orderNote)
      .build();

    // Build payment request
    console.log('Building PhonePe request with:', {
      merchantOrderId: params.orderId,
      amount: amountInPaisa,
      redirectUrl: params.returnUrl || '',
      metaInfo: 'MetaInfo object created'
    });
    
    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(params.orderId)
      .amount(amountInPaisa)
      .redirectUrl(params.returnUrl || '')
      .metaInfo(metaInfo)
      .build();
      
    console.log('Request built successfully');

    console.log('Calling PhonePe client.pay()...');
    // Initiate payment
    const response = await client.pay(request);
    
    console.log('PhonePe response (full):', JSON.stringify(response, null, 2));
    console.log('PhonePe response properties:', {
      orderId: response.orderId,
      redirectUrl: response.redirectUrl,
      state: response.state,
      expireAt: response.expireAt
    });
    
    // Check if we have a valid redirect URL
    if (!response.redirectUrl) {
      console.error('No redirect URL received from PhonePe. Full response:', response);
      throw new Error('No redirect URL received from PhonePe');
    }
    
    return {
      orderId: response.orderId,
      redirectUrl: response.redirectUrl,
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
    
    return {
      order_id: response.order_id,
      order_status: response.state, // Map PhonePe state to Cashfree format for compatibility
      state: response.state,
      amount: response.amount,
      expire_at: response.expire_at,
      payment_details: response.payment_details,
      metaInfo: response.metaInfo,
    };
  } catch (error: any) {
    console.error('PhonePe get order status failed', {
      error: error.message,
      details: error,
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
    name: 'Single Edit',
    credits: 1,
    amount: 14900, // stored in paise
    description: 'For one-time users'
  },
  'saver': {
    name: 'Saver Pack',
    credits: 4,
    amount: 49900, // stored in paise
    description: 'Best for casual users'
  },
  'pro': {
    name: 'Pro Pack',
    credits: 7,
    amount: 69900, // stored in paise
    description: 'Best value for regulars'
  },
  'business': {
    name: 'Business Pack',
    credits: 20,
    amount: 249900, // stored in paise
    description: 'For professionals & studios'
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

// Validate PhonePe webhook callback
export function validatePhonePeCallback(
  username: string,
  password: string,
  authorization: string,
  responseBody: string
): any {
  try {
    const client = getPhonePeClient();
    const callbackResponse = client.validateCallback(
      username,
      password,
      authorization,
      responseBody
    );
    return callbackResponse;
  } catch (error: any) {
    console.error('PhonePe callback validation failed', {
      error: error.message,
      details: error,
    });
    throw error;
  }
}

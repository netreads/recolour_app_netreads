import { getServerEnv } from '@/lib/env';
import crypto from 'crypto';

interface ConversionEventData {
  eventName: 'Purchase' | 'InitiateCheckout' | 'ViewContent' | 'AddToCart';
  eventTime: number; // Unix timestamp in seconds
  eventSourceUrl: string;
  actionSource: 'website';
  eventId?: string; // For deduplication with browser pixel
  userData: {
    em?: string; // email (hashed with SHA256)
    ph?: string; // phone (hashed with SHA256)
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string; // Facebook click ID
    fbp?: string; // Facebook browser ID
    external_id?: string; // Your user ID
  };
  customData?: {
    value?: number;
    currency?: string;
    content_ids?: string[];
    content_type?: string;
  };
}

function hashData(data: string): string {
  return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

export async function sendFacebookConversionEvent(
  eventData: ConversionEventData
): Promise<{ success: boolean; error?: string }> {
  try {
    const env = getServerEnv();
    const pixelId = process.env.FACEBOOK_PIXEL_ID;
    const accessToken = process.env.FACEBOOK_CONVERSIONS_API_TOKEN;

    if (!pixelId || !accessToken) {
      if (env.NODE_ENV === 'development') {
        console.warn('Facebook Conversions API not configured. Set FACEBOOK_PIXEL_ID and FACEBOOK_CONVERSIONS_API_TOKEN');
      }
      return { success: false, error: 'Not configured' };
    }

    const url = `https://graph.facebook.com/v21.0/${pixelId}/events`;

    const payload = {
      data: [eventData],
      test_event_code: env.NODE_ENV === 'development' ? 'TEST12345' : undefined,
    };

    const response = await fetch(`${url}?access_token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      if (env.NODE_ENV === 'development') {
        console.error('Facebook CAPI Error:', result);
      }
      return { success: false, error: result.error?.message || 'API request failed' };
    }

    return { success: true };
  } catch (error) {
    const env = getServerEnv();
    if (env.NODE_ENV === 'development') {
      console.error('Error sending Facebook conversion event:', error);
    }
    return { success: false, error: String(error) };
  }
}

export async function trackPurchaseServerSide(params: {
  orderId: string;
  jobId?: string;
  amount: number;
  currency?: string;
  userEmail?: string;
  userPhone?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  fbc?: string; // From _fbc cookie
  fbp?: string; // From _fbp cookie
  eventSourceUrl?: string;
}): Promise<void> {
  const {
    orderId,
    jobId,
    amount,
    currency = 'INR',
    userEmail,
    userPhone,
    userId,
    ipAddress,
    userAgent,
    fbc,
    fbp,
    eventSourceUrl,
  } = params;

  const userData: ConversionEventData['userData'] = {
    client_ip_address: ipAddress,
    client_user_agent: userAgent,
    fbc,
    fbp,
    external_id: userId,
  };

  // Hash PII data
  if (userEmail) {
    userData.em = hashData(userEmail);
  }
  if (userPhone) {
    userData.ph = hashData(userPhone);
  }

  const eventId = `${orderId}_${jobId || orderId}`;

  const finalEventSourceUrl = eventSourceUrl || 
                               process.env.NEXT_PUBLIC_APP_URL || 
                               'https://app.example.com';

  const eventData: ConversionEventData = {
    eventName: 'Purchase',
    eventTime: Math.floor(Date.now() / 1000),
    eventSourceUrl: finalEventSourceUrl,
    actionSource: 'website',
    eventId,
    userData,
    customData: {
      value: amount,
      currency,
      content_ids: jobId ? [jobId] : [orderId],
      content_type: 'product',
    },
  };

  if (process.env.NODE_ENV === 'development') {
    const missingFields: string[] = [];
    if (!userData.client_ip_address) missingFields.push('IP address');
    if (!userData.client_user_agent) missingFields.push('user agent');
    if (!userData.fbc && !userData.fbp) missingFields.push('Facebook cookies (fbc/fbp)');
    if (missingFields.length > 0) {
      console.warn(`[Facebook CAPI] Missing user data for better Event Match Quality: ${missingFields.join(', ')}`);
      console.warn('[Facebook CAPI] Events may show as "__missing_event" without proper user data.');
    }
  }

  await sendFacebookConversionEvent(eventData);
}

export async function trackInitiateCheckoutServerSide(params: {
  orderId: string;
  jobId?: string;
  amount: number;
  currency?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  fbc?: string;
  fbp?: string;
  eventSourceUrl?: string;
}): Promise<void> {
  const {
    orderId,
    jobId,
    amount,
    currency = 'INR',
    userId,
    ipAddress,
    userAgent,
    fbc,
    fbp,
    eventSourceUrl,
  } = params;

  const finalEventSourceUrl = eventSourceUrl || 
                               process.env.NEXT_PUBLIC_APP_URL || 
                               'https://app.example.com';

  const eventData: ConversionEventData = {
    eventName: 'InitiateCheckout',
    eventTime: Math.floor(Date.now() / 1000),
    eventSourceUrl: finalEventSourceUrl,
    actionSource: 'website',
    userData: {
      client_ip_address: ipAddress,
      client_user_agent: userAgent,
      fbc,
      fbp,
      external_id: userId,
    },
    customData: {
      value: amount,
      currency,
      content_ids: jobId ? [jobId] : [orderId],
      content_type: 'product',
    },
  };

  await sendFacebookConversionEvent(eventData);
}


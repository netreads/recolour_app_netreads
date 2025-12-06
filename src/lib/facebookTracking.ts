'use client';

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export const trackFacebookEvent = (eventName: string, parameters?: unknown, options?: { eventID?: string }) => {
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      if (options?.eventID) {
        window.fbq('track', eventName, parameters, { eventID: options.eventID });
      } else {
        window.fbq('track', eventName, parameters);
      }
    } catch (error) {
      // Silently fail
    }
  }
};

export const trackInitiateCheckout = (value?: number, currency?: string, contentIds?: string[]) => {
  trackFacebookEvent('InitiateCheckout', {
    value,
    currency: currency || 'INR',
    content_ids: contentIds,
  });
};

export const trackPurchase = (value?: number, currency?: string, contentIds?: string[], eventId?: string) => {
  trackFacebookEvent('Purchase', {
    value,
    currency: currency || 'INR',
    content_ids: contentIds,
  }, eventId ? { eventID: eventId } : undefined);
};

// Track upscale add-on purchases with unique content_id for proper Meta attribution
export const trackUpscalePurchase = (params: {
  tier: '2K' | '4K' | '6K';
  value: number;
  jobId: string;
  orderId: string;
  currency?: string;
}) => {
  const { tier, value, jobId, orderId, currency = 'INR' } = params;
  
  // Unique content_id format for upscale add-ons: "upscale_{tier}_{jobId}"
  // This differentiates from main colorization purchases which use just "{jobId}"
  const contentId = `upscale_${tier}_${jobId}`;
  
  // Unique event ID for deduplication with server-side tracking
  const eventId = `upscale_${orderId}_${jobId}`;
  
  trackFacebookEvent('Purchase', {
    value,
    currency,
    content_ids: [contentId],
    content_type: 'product',
    content_name: `${tier} Upscale`,
    content_category: 'upscale_addon',
  }, { eventID: eventId });
};

export const trackPageView = () => {
  trackFacebookEvent('PageView');
};


'use client';

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export const trackFacebookEvent = (eventName: string, parameters?: unknown) => {
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      window.fbq('track', eventName, parameters);
    } catch (error) {
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

export const trackPurchase = (value?: number, currency?: string, contentIds?: string[]) => {
  trackFacebookEvent('Purchase', {
    value,
    currency: currency || 'INR',
    content_ids: contentIds,
  });
};

export const trackPageView = () => {
  trackFacebookEvent('PageView');
};


'use client';

import { useEffect } from 'react';

/**
 * Facebook Pixel Component
 * 
 * To use this component, add your Facebook Pixel ID to your environment variables:
 * NEXT_PUBLIC_FACEBOOK_PIXEL_ID=your_pixel_id_here
 * 
 * This component automatically tracks:
 * - PageView: Tracks when pages are viewed
 * - InitiateCheckout: Tracks when users start the checkout process
 * - Purchase: Tracks completed purchases
 */

declare global {
  interface Window {
    fbq: any;
  }
}

interface FacebookPixelProps {
  pixelId: string;
}

export function FacebookPixel({ pixelId }: FacebookPixelProps) {
  useEffect(() => {
    if (!pixelId) return;

    // Load Facebook Pixel script
    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      const existingScript = document.querySelector('script[src*="fbevents.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [pixelId]);

  return null;
}

// Facebook Pixel event tracking functions
export const trackFacebookEvent = (eventName: string, parameters?: any) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, parameters);
  }
};

// Specific event functions
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

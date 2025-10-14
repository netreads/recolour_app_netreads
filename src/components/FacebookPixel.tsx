import Script from 'next/script';

/**
 * Facebook Pixel Component (Server Component)
 * 
 * To use this component, add your Facebook Pixel ID to your environment variables:
 * FACEBOOK_PIXEL_ID=your_pixel_id_here
 * 
 * This component automatically tracks:
 * - PageView: Tracks when pages are viewed
 * 
 * For client-side event tracking (InitiateCheckout, Purchase, etc.),
 * import from '@/lib/facebookTracking' instead.
 */

interface FacebookPixelProps {
  pixelId: string;
}

export function FacebookPixel({ pixelId }: FacebookPixelProps) {
  if (!pixelId) {
    return null;
  }

  return (
    <>
      <Script
        id="facebook-pixel"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
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
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

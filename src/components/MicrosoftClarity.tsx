'use client';

import Script from 'next/script';

/**
 * Microsoft Clarity Component
 * 
 * This component adds Microsoft Clarity tracking to your application.
 * Clarity provides session recordings and heatmaps to understand user behavior.
 */

declare global {
  interface Window {
    clarity: any;
  }
}

export function MicrosoftClarity() {
  return (
    <Script
      id="microsoft-clarity"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "tonvre0k75");
        `,
      }}
    />
  );
}


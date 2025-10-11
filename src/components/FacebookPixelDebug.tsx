'use client';

import { useEffect, useState } from 'react';

export function FacebookPixelDebug() {
  const [pixelStatus, setPixelStatus] = useState<{
    loaded: boolean;
    pixelId: string | null;
    envVarSet: boolean;
  }>({
    loaded: false,
    pixelId: null,
    envVarSet: false,
  });

  useEffect(() => {
    const checkPixel = () => {
      const fbqExists = typeof window !== 'undefined' && !!window.fbq;
      const envVar = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
      
      setPixelStatus({
        loaded: fbqExists,
        pixelId: envVar || null,
        envVarSet: !!envVar,
      });

      console.log('📊 Facebook Pixel Debug:', {
        'fbq loaded': fbqExists,
        'ENV VAR set': !!envVar,
        'Pixel ID': envVar ? `${envVar.slice(0, 4)}...${envVar.slice(-4)}` : 'NOT SET',
        'window.fbq': fbqExists ? 'Available' : 'Not Available',
      });
    };

    // Check immediately
    checkPixel();

    // Check again after 2 seconds
    const timer = setTimeout(checkPixel, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        backgroundColor: pixelStatus.loaded ? '#10b981' : '#ef4444',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        FB Pixel: {pixelStatus.loaded ? '✅ Loaded' : '❌ Not Loaded'}
      </div>
      <div style={{ fontSize: '10px', opacity: 0.9 }}>
        ENV: {pixelStatus.envVarSet ? '✅ Set' : '❌ Not Set'}
      </div>
      {pixelStatus.pixelId && (
        <div style={{ fontSize: '10px', opacity: 0.7 }}>
          ID: {pixelStatus.pixelId.slice(0, 8)}...
        </div>
      )}
    </div>
  );
}


'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { trackPurchase } from '@/components/FacebookPixel';
import { PRICING } from '@/lib/constants';
import { getDirectImageUrl } from '@/lib/utils';

interface PaymentStatus {
  success: boolean;
  orderId?: string;
  credits?: number;
  amount?: number;
  message?: string;
  jobId?: string;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const jobId = searchParams.get('job_id');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [purchaseTracked, setPurchaseTracked] = useState(false);
  const [imageUrls, setImageUrls] = useState<{ original: string; output: string } | null>(null);
  const mountedRef = useRef(false);

  // Track component mount
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
    }
  }, [orderId, jobId]);

  useEffect(() => {
    if (orderId) {
      checkPaymentStatus(orderId);
    } else {
      setPaymentStatus({
        success: false,
        message: 'No order ID provided'
      });
      setLoading(false);
    }
  }, [orderId]);

  // Track purchase event - fires immediately when we have jobId OR when payment succeeds
  useEffect(() => {
    // Don't track if already tracked
    if (purchaseTracked) {
      return;
    }

    // Get jobId from payment status or URL params
    const trackingJobId = paymentStatus?.jobId || jobId;
    
    if (!trackingJobId) {
      return;
    }
    
    // Function to track purchase with retries
    const trackPurchaseWithRetry = (attempts = 0, maxAttempts = 20): ReturnType<typeof setTimeout> | null => {
      if (typeof window !== 'undefined' && window.fbq) {
        try {
          trackPurchase(PRICING.SINGLE_IMAGE.RUPEES, 'INR', [trackingJobId]);
          setPurchaseTracked(true);
          return null;
        } catch (error) {
          return null;
        }
      } else if (attempts < maxAttempts) {
        return setTimeout(() => trackPurchaseWithRetry(attempts + 1, maxAttempts), 300);
      } else {
        return null;
      }
    };

    // Start immediately
    const cleanupTimer = trackPurchaseWithRetry();
    
    return () => {
      if (cleanupTimer) clearTimeout(cleanupTimer);
    };
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, paymentStatus]); // Don't include purchaseTracked in deps to avoid re-running after tracking

  const checkPaymentStatus = async (orderId: string) => {
    try {
      const response = await fetch(`/api/payments/status?order_id=${orderId}`);
      const data = await response.json();
      
      // Use jobId from API response, fallback to URL parameter
      const statusWithJobId = { ...data, jobId: data.jobId || jobId };
      setPaymentStatus(statusWithJobId);

      // If this is a single image purchase, verify and mark job as paid
      const finalJobId = data.jobId || jobId;
      if (data?.success && finalJobId) {
        try {
            await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId, jobId: finalJobId }),
            });
            
            // Fetch the actual image URLs from the database
            const [originalResponse, outputResponse] = await Promise.all([
              fetch(`/api/get-image-url?jobId=${finalJobId}&type=original`),
              fetch(`/api/get-image-url?jobId=${finalJobId}&type=output`)
            ]);
            
            const originalData = await originalResponse.json();
            const outputData = await outputResponse.json();
            
            setImageUrls({
              original: originalData.url || '',
              output: outputData.url || ''
            });
        } catch (err) {
          // Silent fail - job will be marked as paid by webhook or status check
          console.error('Error fetching image URLs:', err);
        }
      }
    } catch (error) {
      setPaymentStatus({
        success: false,
        message: 'Failed to verify payment status'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!paymentStatus?.jobId) return;
    
    setDownloading(true);
    try {
      // Use the actual output URL if we have it
      let imageUrl = imageUrls?.output;
      
      if (!imageUrl) {
        // Fallback: fetch the URL from the API
        const response = await fetch(`/api/get-image-url?jobId=${paymentStatus.jobId}&type=output`);
        const data = await response.json();
        imageUrl = data.url;
      }
      
      if (!imageUrl) {
        throw new Error('Image URL not available');
      }
      
      // Fetch the image as a blob
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `colorized-image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download image. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying payment status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:py-16">
      <div className="max-w-5xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            {paymentStatus?.success ? (
              <>
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
                <CardDescription>
                  Your payment has been processed successfully.
                </CardDescription>
              </>
            ) : (
              <>
                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-600 text-2xl">✕</span>
                </div>
                <CardTitle className="text-2xl text-red-600">Payment Failed</CardTitle>
                <CardDescription>
                  {paymentStatus?.message || 'There was an issue processing your payment.'}
                </CardDescription>
              </>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6">
            {paymentStatus?.success && (
                <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Payment Details</h3>
                <div className="space-y-1 text-sm text-green-700">
                  <p><strong>Order ID:</strong> {paymentStatus.orderId}</p>
                  <p><strong>Product:</strong> {PRICING.SINGLE_IMAGE.NAME}</p>
                  <p><strong>Amount Paid:</strong> ₹{PRICING.SINGLE_IMAGE.RUPEES}</p>
                </div>
              </div>
            )}

            {/* Show the full HD colorized image */}
            {paymentStatus?.success && paymentStatus.jobId && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">🎨 Your Colorized Image is Ready!</h3>
                  <p className="text-base text-gray-600">Full HD quality • No watermark • Yours forever</p>
                </div>
                
                {/* Side-by-side comparison */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Original Image */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700 text-center uppercase tracking-wide">Original</p>
                    <div className="relative aspect-[4/3] bg-gray-50 rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrls?.original || getDirectImageUrl(paymentStatus.jobId, 'original')}
                        alt="Original black and white"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Colorized Image - Full HD, No Blur */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-green-700 text-center uppercase tracking-wide">AI Colorized (HD)</p>
                    <div className="relative aspect-[4/3] bg-gray-50 rounded-xl overflow-hidden border-2 border-green-500 shadow-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrls?.output || getDirectImageUrl(paymentStatus.jobId, 'output')}
                        alt="Colorized HD version"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-3 right-3">
                        <span className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                          ✓ HD Unlocked
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Full width preview option */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-center text-gray-700">
                    💡 <strong>Tip:</strong> Right-click on the colorized image to view it in full size or open in a new tab
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col space-y-3 pt-4">
              {paymentStatus?.success && paymentStatus.jobId && (
                <Button 
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white font-semibold"
                  size="lg"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Downloading HD Image...
                    </>
                  ) : (
                    <>
                      📥 Download Full HD Image
                    </>
                  )}
                </Button>
              )}
              
              <Button asChild className="w-full" variant={paymentStatus?.jobId ? "outline" : "default"} size="lg">
                <Link href="/">
                  {paymentStatus?.jobId ? '🎨 Colorize Another Photo' : 'Back to Home'}
                </Link>
              </Button>
              
              {!paymentStatus?.success && (
                <Button variant="outline" asChild className="w-full" size="lg">
                  <Link href="/">
                    Try Again
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

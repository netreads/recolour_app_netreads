'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { trackPurchase } from '@/lib/facebookTracking';
import { PRICING } from '@/lib/constants';

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

  // Track purchase event - fires ONLY when payment succeeds
  useEffect(() => {
    // Don't track if already tracked
    if (purchaseTracked) {
      return;
    }

    // Get jobId from payment status or URL params
    const trackingJobId = paymentStatus?.jobId || jobId;
    
    // Only track if we have a jobId AND payment was successful
    if (!trackingJobId || !paymentStatus?.success) {
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
      // Use the download API endpoint which handles authentication and CORS properly
      const downloadUrl = `/api/download-image?jobId=${paymentStatus.jobId}&type=output`;
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `colorized-image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download image. Please try again or right-click on the image and select "Save image as..."');
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
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto">
          {paymentStatus?.success ? (
            <div className="space-y-8">
              {/* Success Header */}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-2 animate-bounce">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-orange-500 to-green-600 bg-clip-text text-transparent">
                    Your Memory is Restored! 🎉
                  </span>
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Full HD quality • No watermark • Yours forever
                </p>
              </div>

              {/* Colorized Image Card */}
              {paymentStatus.jobId && (
                <div className="space-y-6">
                  <Card className="border shadow-lg overflow-hidden bg-white">
                    <CardContent className="p-6 sm:p-8 space-y-6">
                      {/* Main Image Display */}
                      <div className="relative">
                        <div className="relative aspect-[4/3] bg-gray-50 rounded-xl overflow-hidden border-2 border-gray-200">
                          {imageUrls?.output ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={imageUrls.output}
                              alt="Your colorized HD image"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full space-y-3">
                              <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
                              <p className="text-gray-500 font-medium">Loading your HD image...</p>
                            </div>
                          )}
                          <div className="absolute top-3 right-3">
                            <span className="bg-gradient-to-r from-orange-500 to-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                              ✨ HD Unlocked
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Download Button */}
                      <Button 
                        onClick={handleDownload}
                        disabled={downloading || !imageUrls?.output}
                        className="w-full h-14 bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                        size="lg"
                      >
                        {downloading ? (
                          <>
                            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            📥 Download Full HD Image
                          </>
                        )}
                      </Button>

                      {/* Bulk Order WhatsApp Button */}
                      <Button 
                        asChild 
                        variant="outline" 
                        size="lg" 
                        className="w-full h-12 border-2 border-green-600 text-green-700 hover:bg-green-50 font-semibold"
                      >
                        <Link href="https://wa.me/917984837468?text=Hi!%20I%20have%2020%2B%20photos%20to%20restore.%20Can%20I%20get%20a%20bulk%20discount%3F" target="_blank">
                          💬 WhatsApp Us for Bulk Orders (10+ Images)
                        </Link>
                      </Button>

                      {/* Colorize Another Button */}
                      <Button asChild variant="outline" size="lg" className="w-full h-12 border-2 hover:bg-gray-50">
                        <Link href="/">
                          🎨 Colorize Another Memory
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            /* Payment Failed State */
            <Card className="border shadow-lg bg-white">
              <CardHeader className="text-center space-y-4 pt-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto">
                  <span className="text-red-600 text-3xl font-bold">✕</span>
                </div>
                <CardTitle className="text-3xl text-red-600">Payment Failed</CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  {paymentStatus?.message || 'There was an issue processing your payment.'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 pb-12 px-6">
                <Button asChild className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700" size="lg">
                  <Link href="/">
                    Try Again
                  </Link>
                </Button>
                
                <Button 
                  asChild 
                  variant="outline" 
                  size="lg" 
                  className="w-full h-14 text-lg border-2 hover:bg-gray-50"
                >
                  <Link href="https://wa.me/917984837468?text=Hi%2C%20I%20had%20a%20payment%20issue.%20Can%20you%20help%3F" target="_blank">
                    💬 Contact Support on WhatsApp
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
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

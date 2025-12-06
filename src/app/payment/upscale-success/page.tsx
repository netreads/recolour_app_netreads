'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Sparkles, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PRICING, UpscaleTier } from '@/lib/constants';
import { trackUpscalePurchase } from '@/lib/facebookTracking';

const UPSCALE_TIPS = [
  "🎨 AI is analyzing your image for optimal enhancement",
  "✨ Enhancing fine details and textures",
  "🖼️ Applying advanced super-resolution algorithms",
  "🌈 Preserving color accuracy while upscaling",
  "📸 Processing with state-of-the-art neural networks",
  "💎 Creating print-ready high-resolution output",
  "🎭 Enhancing facial features and expressions",
  "🔍 Sharpening edges and improving clarity",
];

type UpscaleStatus = 'verifying' | 'processing' | 'completed' | 'failed';

function UpscaleSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const jobId = searchParams.get('job_id');
  const tier = searchParams.get('tier') as UpscaleTier | null;

  const [status, setStatus] = useState<UpscaleStatus>('verifying');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const [upscaledImageUrl, setUpscaledImageUrl] = useState<string | null>(null);
  const [imageBlobUrl, setImageBlobUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [purchaseTracked, setPurchaseTracked] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const processStartedRef = useRef(false);

  // Rotate tips
  useEffect(() => {
    if (status === 'processing' || status === 'verifying') {
      const tipInterval = setInterval(() => {
        setCurrentTip((prev) => (prev + 1) % UPSCALE_TIPS.length);
      }, 3000);
      return () => clearInterval(tipInterval);
    }
  }, [status]);

  // Progress animation
  useEffect(() => {
    if (status === 'processing') {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90; // Cap at 90% until complete
          return prev + Math.random() * 3;
        });
      }, 500);
      return () => clearInterval(progressInterval);
    }
  }, [status]);

  // Track retry attempts for payment verification
  const paymentVerificationRetryRef = useRef(0);
  const MAX_PAYMENT_VERIFICATION_RETRIES = 10; // Max 10 retries (50 seconds total)
  
  // Track retry attempts for upscale processing
  const upscaleRetryRef = useRef(0);
  const MAX_UPSCALE_RETRIES = 3;

  // Verify payment status first (CRITICAL: Only start upscale if payment confirmed)
  const verifyPayment = async (attempt: number = 1): Promise<boolean> => {
    if (!orderId) return false;

    try {
      console.log(`[UPSCALE VERIFY] Attempt ${attempt}: Verifying payment for order ${orderId}...`);
      
      // Check payment status via the status API
      const statusResponse = await fetch(`/api/payments/status?order_id=${orderId}`, {
        signal: AbortSignal.timeout(20000), // 20 second timeout
      });

      if (!statusResponse.ok) {
        const errorData = await statusResponse.json().catch(() => ({}));
        console.log(`[UPSCALE VERIFY] Status API returned ${statusResponse.status}:`, errorData);
        
        // Don't retry on client errors (4xx) - these are permanent failures
        if (statusResponse.status >= 400 && statusResponse.status < 500) {
          if (statusResponse.status === 404) {
            setError('Order not found. Please contact support.');
          } else {
            setError(errorData.error || 'Invalid request. Please try again.');
          }
          setStatus('failed');
          return false;
        }
        
        // Retry on server errors (5xx)
        if (statusResponse.status >= 500 && attempt < MAX_PAYMENT_VERIFICATION_RETRIES) {
          console.log(`[UPSCALE VERIFY] Server error, retrying in 5s...`);
          setTimeout(() => verifyPayment(attempt + 1), 5000);
          return false;
        }
        
        // Unknown error - retry if we have attempts left
        if (attempt < MAX_PAYMENT_VERIFICATION_RETRIES) {
          console.log(`[UPSCALE VERIFY] Unknown error, retrying in 5s...`);
          setTimeout(() => verifyPayment(attempt + 1), 5000);
          return false;
        }
        
        throw new Error(errorData.error || 'Failed to verify payment status');
      }

      const statusData = await statusResponse.json();
      console.log(`[UPSCALE VERIFY] Payment status: ${statusData.status}, success: ${statusData.success}`);

      // Payment confirmed - proceed to upscale
      if (statusData.success && statusData.status === 'PAID') {
        console.log(`[UPSCALE VERIFY] ✅ Payment confirmed! Proceeding to upscale...`);
        return true;
      }

      // Payment failed or cancelled
      if (statusData.status === 'FAILED') {
        console.log(`[UPSCALE VERIFY] ❌ Payment failed or cancelled`);
        setError(statusData.message || 'Payment was not completed. Please try again.');
        setStatus('failed');
        return false;
      }

      // Payment still pending - retry
      if (statusData.status === 'PENDING') {
        paymentVerificationRetryRef.current = attempt;
        
        if (attempt >= MAX_PAYMENT_VERIFICATION_RETRIES) {
          console.log(`[UPSCALE VERIFY] ⏰ Max retry attempts reached`);
          setError('Payment verification is taking longer than expected. If your payment was deducted, please contact support.');
          setStatus('failed');
          return false;
        }
        
        console.log(`[UPSCALE VERIFY] ⏳ Payment pending, retry ${attempt}/${MAX_PAYMENT_VERIFICATION_RETRIES}...`);
        setTimeout(() => verifyPayment(attempt + 1), 5000);
        return false;
      }

      // Unknown status - treat as failed
      console.log(`[UPSCALE VERIFY] ❌ Unknown payment status: ${statusData.status}`);
      setError('Payment status could not be determined. Please try again.');
      setStatus('failed');
      return false;

    } catch (err) {
      console.error(`[UPSCALE VERIFY] ❌ Error on attempt ${attempt}:`, err);
      
      // Retry on network errors
      if (attempt < MAX_PAYMENT_VERIFICATION_RETRIES) {
        console.log(`[UPSCALE VERIFY] 🔄 Network error, retrying in 5s...`);
        setTimeout(() => verifyPayment(attempt + 1), 5000);
        return false;
      }
      
      setError('Failed to verify payment. Please contact support.');
      setStatus('failed');
      return false;
    }
  };

  // Process upscale (only called after payment is verified)
  const processUpscale = async () => {
    if (!orderId || !jobId) return;

    try {
      setStatus('processing');
      setProgress(10);

      const response = await fetch('/api/upscale/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, jobId }),
      });

      const data = await response.json();

      if (response.status === 402) {
        // Payment verification failed during upscale (shouldn't happen if we verified first, but handle it)
        if (data.code === 'PAYMENT_PENDING') {
          upscaleRetryRef.current += 1;
          
          if (upscaleRetryRef.current >= MAX_UPSCALE_RETRIES) {
            console.log('[UPSCALE] Max retry attempts reached');
            throw new Error('Payment verification timed out. If your payment was deducted, please contact support.');
          }
          
          console.log(`[UPSCALE] Payment pending, retry ${upscaleRetryRef.current}/${MAX_UPSCALE_RETRIES}...`);
          setTimeout(() => processUpscale(), 5000);
          return;
        }
        
        // Payment failed or cancelled
        if (data.code === 'PAYMENT_FAILED' || data.code === 'PAYMENT_CANCELLED') {
          throw new Error(data.message || 'Payment was not completed. Please try again.');
        }
        
        throw new Error(data.error || 'Payment verification failed');
      }

      // Handle service unavailable (temporary error)
      if (response.status === 503) {
        upscaleRetryRef.current += 1;
        
        if (upscaleRetryRef.current >= MAX_UPSCALE_RETRIES) {
          throw new Error('Service temporarily unavailable. Please try again later.');
        }
        
        console.log(`[UPSCALE] Service error, retry ${upscaleRetryRef.current}/${MAX_UPSCALE_RETRIES}...`);
        setTimeout(() => processUpscale(), data.retryAfter ? data.retryAfter * 1000 : 5000);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process upscale');
      }

      // Success!
      setProgress(100);
      setUpscaledImageUrl(data.upscaledImageUrl);
      
      // Load the image
      const imageResponse = await fetch(`/api/upscale/download?orderId=${orderId}&jobId=${jobId}`);
      if (imageResponse.ok) {
        const blob = await imageResponse.blob();
        setImageBlobUrl(URL.createObjectURL(blob));
      }

      setStatus('completed');

    } catch (err) {
      console.error('[UPSCALE] Error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('failed');
    }
  };

  // Start payment verification on mount, then proceed to upscale only if payment confirmed
  useEffect(() => {
    if (!orderId || !jobId || !tier) {
      setError('Missing order details');
      setStatus('failed');
      return;
    }

    if (!processStartedRef.current) {
      processStartedRef.current = true;
      
      // First verify payment, then start upscale only if payment is confirmed
      const startFlow = async () => {
        // Small delay to let PhonePe process the redirect
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verify payment first (CRITICAL)
        const paymentConfirmed = await verifyPayment();
        
        if (paymentConfirmed) {
          // Payment confirmed - proceed to upscale
          await processUpscale();
        }
        // If payment not confirmed, verifyPayment already set error state
      };
      
      startFlow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, jobId, tier]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (imageBlobUrl) {
        URL.revokeObjectURL(imageBlobUrl);
      }
    };
  }, [imageBlobUrl]);

  // Track upscale Purchase event when upscale completes successfully
  useEffect(() => {
    // Only track if:
    // 1. Not already tracked
    // 2. Status is completed (upscale was successful)
    // 3. We have all required params (orderId, jobId, tier)
    if (purchaseTracked || status !== 'completed' || !orderId || !jobId || !tier) {
      return;
    }

    // Get the pricing for this tier
    const tierConfig = PRICING.UPSCALE[tier];
    if (!tierConfig) {
      return;
    }

    // Track with retry (wait for fbq to be available)
    const trackWithRetry = (attempts = 0, maxAttempts = 20): ReturnType<typeof setTimeout> | null => {
      if (typeof window !== 'undefined' && window.fbq) {
        try {
          trackUpscalePurchase({
            tier,
            value: tierConfig.RUPEES,
            jobId,
            orderId,
            currency: 'INR',
          });
          console.log(`[UPSCALE PIXEL] ✅ Tracked Purchase for ${tier} upscale - ₹${tierConfig.RUPEES}`);
          setPurchaseTracked(true);
          return null;
        } catch (error) {
          console.error('[UPSCALE PIXEL] Error tracking purchase:', error);
          return null;
        }
      } else if (attempts < maxAttempts) {
        // Retry after 300ms if fbq not ready
        return setTimeout(() => trackWithRetry(attempts + 1, maxAttempts), 300);
      } else {
        console.warn('[UPSCALE PIXEL] Failed to track - fbq not available after retries');
        return null;
      }
    };

    const cleanupTimer = trackWithRetry();
    
    return () => {
      if (cleanupTimer) clearTimeout(cleanupTimer);
    };
  }, [status, orderId, jobId, tier, purchaseTracked]);

  const handleDownload = async () => {
    if (!orderId || !jobId) return;

    setDownloading(true);
    try {
      const response = await fetch(`/api/upscale/download?orderId=${orderId}&jobId=${jobId}`);
      
      if (!response.ok) {
        throw new Error('Failed to download');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Get extension from content type (PNG for full quality)
      const contentType = response.headers.get('content-type') || 'image/png';
      const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'png';
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `upscaled-${tier}-${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('[DOWNLOAD] Error:', err);
      alert('Failed to download. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Handle "Retry Payment" - creates new upscale order and redirects to payment
  const handlePayAgain = async () => {
    if (!jobId || !tier) return;
    
    setIsProcessingPayment(true);
    try {
      const orderResponse = await fetch('/api/upscale/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: jobId,
          tier: tier,
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const { redirectUrl } = await orderResponse.json();
      
      // Redirect to payment page
      window.location.href = redirectUrl;
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  // No params provided
  if (!orderId || !jobId || !tier) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="border shadow-lg bg-white">
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-500 text-2xl">!</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Invalid Link
              </h2>
              <p className="text-gray-600 mb-6">
                This link appears to be invalid or expired.
              </p>
              <Button asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const tierConfig = tier ? PRICING.UPSCALE[tier] : null;

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
        <div className="max-w-2xl mx-auto">
          
          {/* Processing State */}
          {(status === 'verifying' || status === 'processing') && (
            <Card className="border shadow-lg bg-white">
              <CardContent className="p-6 sm:p-10">
                <div className="text-center space-y-6">
                  {/* Animated Icon */}
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-100 to-green-100 rounded-full">
                    <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-green-600 rounded-full flex items-center justify-center animate-pulse">
                      <Sparkles className="h-7 w-7 text-white" />
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                      {status === 'verifying' ? 'Verifying Payment...' : `Upscaling to ${tier}...`}
                    </h2>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {status === 'verifying' 
                        ? 'Confirming your payment with PhonePe'
                        : 'AI is enhancing your image to ultra-high resolution'
                      }
                    </p>
                  </div>

                  {/* Progress Bar */}
                  {status === 'processing' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Processing...</span>
                        <span className="font-semibold text-orange-600">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-green-600 transition-all duration-500 ease-out rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Tips */}
                  <div className="bg-gradient-to-r from-orange-50 to-green-50 border border-orange-200 rounded-xl p-4 sm:p-5">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 text-orange-500 animate-spin flex-shrink-0" />
                      <p key={currentTip} className="text-sm text-gray-700 text-left animate-fade-in">
                        {UPSCALE_TIPS[currentTip]}
                      </p>
                    </div>
                  </div>

                  {/* Info */}
                  {tierConfig && (
                    <div className="flex items-center justify-center gap-4 text-xs sm:text-sm text-gray-500">
                      <span>📐 {tierConfig.RESOLUTION}</span>
                      <span>•</span>
                      <span>✨ AI Enhanced</span>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 italic">
                    This usually takes 30-60 seconds. Please don't close this page!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success State */}
          {status === 'completed' && (
            <div className="space-y-6">
              {/* Success Header */}
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full animate-bounce">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  <span className="bg-gradient-to-r from-orange-500 to-green-600 bg-clip-text text-transparent">
                    {tier} Upscale Complete! 🎉
                  </span>
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Your print-ready image is ready for download
                </p>
              </div>

              {/* Image Card */}
              <Card className="border shadow-lg overflow-hidden bg-white">
                <CardContent className="p-4 sm:p-6 space-y-4">
                  {/* Image Preview */}
                  <div className="relative aspect-video sm:aspect-[4/3] bg-gray-50 rounded-xl overflow-hidden border-2 border-green-200">
                    {imageBlobUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageBlobUrl}
                        alt={`Your ${tier} upscaled image`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className="bg-gradient-to-r from-orange-500 to-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                        ✨ {tier} Upscaled
                      </span>
                    </div>
                  </div>

                  {/* Download Button */}
                  <Button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full h-12 sm:h-14 bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white font-bold text-base sm:text-lg shadow-lg"
                    size="lg"
                  >
                    {downloading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-5 w-5" />
                        Download {tier} Image
                      </>
                    )}
                  </Button>

                  {/* Back to colorize */}
                  <Button asChild variant="outline" size="lg" className="w-full h-11 border-2">
                    <Link href="/">
                      🎨 Colorize Another Photo
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Resolution info */}
              {tierConfig && (
                <div className="text-center text-sm text-gray-500">
                  <p>Resolution: {tierConfig.RESOLUTION} • {tierConfig.DESCRIPTION}</p>
                </div>
              )}
            </div>
          )}

          {/* Error State */}
          {status === 'failed' && (
            <Card className="border shadow-lg bg-white">
              <CardContent className="p-6 sm:p-10 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-500 text-2xl">✕</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  {error?.toLowerCase().includes('payment') || error?.toLowerCase().includes('cancelled') 
                    ? 'Payment Not Completed' 
                    : 'Upscale Failed'}
                </h2>
                <p className="text-gray-600 mb-6">
                  {error || 'Something went wrong during upscaling.'}
                </p>
                
                {/* Show payment-related error message */}
                {(error?.toLowerCase().includes('payment') || error?.toLowerCase().includes('cancelled')) && (
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 mb-6 text-left">
                    <p className="text-sm text-orange-800 mb-2">
                      <strong>What happened?</strong>
                    </p>
                    <p className="text-sm text-orange-700">
                      Your payment was not completed. This usually happens if you cancelled the payment or the payment failed.
                    </p>
                    {orderId && (
                      <p className="text-xs text-orange-600 mt-2">
                        <strong>Order ID:</strong> {orderId}
                      </p>
                    )}
                  </div>
                )}
                
                <div className="space-y-3">
                  {/* Only show "Try Again" if it's not a payment cancellation error */}
                  {!(error?.toLowerCase().includes('payment') || error?.toLowerCase().includes('cancelled')) && (
                    <Button
                      onClick={() => {
                        processStartedRef.current = false;
                        paymentVerificationRetryRef.current = 0;
                        upscaleRetryRef.current = 0;
                        setError(null);
                        setStatus('verifying');
                        setProgress(0);
                        // Restart the flow
                        const startFlow = async () => {
                          await new Promise(resolve => setTimeout(resolve, 1000));
                          const paymentConfirmed = await verifyPayment();
                          if (paymentConfirmed) {
                            await processUpscale();
                          }
                        };
                        startFlow();
                      }}
                      className="w-full bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700"
                    >
                      🔄 Try Again
                    </Button>
                  )}
                  
                  {/* Show "Retry Payment" for payment cancellation */}
                  {(error?.toLowerCase().includes('payment') || error?.toLowerCase().includes('cancelled')) && (
                    <>
                      <Button 
                        onClick={handlePayAgain}
                        disabled={isProcessingPayment || !jobId || !tier}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                      >
                        {isProcessingPayment ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Creating New Order...
                          </>
                        ) : (
                          <>💳  Retry Payment</>
                        )}
                      </Button>
                      <Button asChild variant="outline" className="w-full border-2 hover:bg-gray-50">
                        <Link href="/">
                          ← Go Back to Home
                        </Link>
                      </Button>
                    </>
                  )}
                  
                  <Button asChild variant="outline" className="w-full border-2 border-green-600 text-green-700">
                    <Link 
                      href={`https://wa.me/917984837468?text=Hi%2C%20my%20upscale%20${error?.toLowerCase().includes('payment') || error?.toLowerCase().includes('cancelled') ? 'payment was not completed' : 'failed'}.%20Order%20ID%3A%20${encodeURIComponent(orderId || 'N/A')}`}
                      target="_blank"
                    >
                      📱 Contact Support
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}

export default function UpscaleSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="border shadow-lg bg-white">
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-100 to-green-100 rounded-full mb-4">
                <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Loading...
              </h2>
              <p className="text-gray-600">
                Preparing your upscaled image
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <UpscaleSuccessContent />
    </Suspense>
  );
}


'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { PRICING } from '@/lib/constants';

interface PaymentStatus {
  success: boolean;
  orderId?: string;
  credits?: number;
  amount?: number;
  message?: string;
  jobId?: string;
  status?: string;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const jobId = searchParams.get('job_id');
  
  // Add error boundary for debugging
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="border shadow-lg bg-white">
            <CardContent className="p-8 sm:p-12">
              <div className="text-center space-y-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-red-600">
                  Something went wrong
                </h2>
                <p className="text-base sm:text-lg text-gray-600">
                  There was an error loading your payment details. Please try refreshing the page.
                </p>
                <Button onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [purchaseTracked, setPurchaseTracked] = useState(false);
  const [imageBlobUrl, setImageBlobUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [showSupportMessage, setShowSupportMessage] = useState(false);
  const mountedRef = useRef(false);
  const loadingStartTimeRef = useRef<number | null>(null);

  // Track component mount
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
    }
  }, [orderId, jobId]);

  // Verify payment and mark as paid - Fixed Architecture
  const verifyPaymentAndMarkAsPaid = async (orderId: string, jobId: string) => {
    try {
      console.log(`[VERIFY] Verifying payment for order ${orderId}`);
      
      // Step 1: Check payment status via API
      const response = await fetch(`/api/payments/status?order_id=${orderId}`);
      const data = await response.json();
      
      console.log(`[VERIFY] Payment status response:`, data);
      
      if (data.success) {
        // Payment successful! Mark job as paid and load image
        console.log(`[VERIFY] ✅ Payment verified successful for order ${orderId}`);
        
        await markJobAsPaid(jobId);
        
        setPaymentStatus({
          success: true,
          orderId: orderId,
          jobId: jobId,
          message: 'Payment successful! Your image is ready.'
        });
        setLoading(false);
        
        // Load image immediately
        loadImageSecurely(jobId);
        
      } else if (data.status === 'FAILED') {
        // Payment failed
        console.log(`[VERIFY] ❌ Payment failed for order ${orderId}`);
        
        setPaymentStatus({
          success: false,
          orderId: orderId,
          jobId: jobId,
          status: 'FAILED',
          message: 'Payment failed. Please try again.'
        });
        setLoading(false);
        
      } else {
        // Payment still pending - start polling
        console.log(`[VERIFY] ⏳ Payment still pending for order ${orderId}, starting verification...`);
        
        setPaymentStatus({
          success: false,
          orderId: orderId,
          jobId: jobId,
          status: 'PENDING',
          message: 'Verifying your payment...'
        });
        
        // Start polling for verification
        startPaymentVerification(orderId, jobId);
      }
      
    } catch (error) {
      console.error(`[VERIFY] ❌ Error verifying payment for order ${orderId}:`, error);
      
      setPaymentStatus({
        success: false,
        orderId: orderId,
        jobId: jobId,
        message: 'Failed to verify payment. Please contact support.'
      });
      setLoading(false);
      setShowSupportMessage(true);
    }
  };

  // Mark job as paid after verification
  const markJobAsPaid = async (jobId: string) => {
    try {
      console.log(`[MARK-PAID] Marking job ${jobId} as paid`);
      
      const response = await fetch('/api/mark-job-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });

      if (response.ok) {
        console.log(`[MARK-PAID] ✅ Job ${jobId} marked as paid successfully`);
      } else {
        console.error(`[MARK-PAID] ❌ Failed to mark job ${jobId} as paid`);
      }
    } catch (error) {
      console.error(`[MARK-PAID] ❌ Error marking job ${jobId} as paid:`, error);
    }
  };

  // Better payment verification with timeout and circuit breaker
  const startPaymentVerification = async (orderId: string, jobId: string) => {
    const maxAttempts = 6; // Reduced attempts for 12 seconds
    const maxDuration = 12000; // 12 seconds total timeout
    const startTime = Date.now();
    let attempt = 0;
    let consecutiveErrors = 0;
    let timeoutId: NodeJS.Timeout | null = null;

    const poll = async (): Promise<void> => {
      try {
        // Check if we've exceeded total time limit
        if (Date.now() - startTime > maxDuration) {
          console.log(`[VERIFY-POLL] ⏰ Total timeout reached for order ${orderId}`);
          handleTimeout(orderId, jobId);
          return;
        }

        attempt++;
        console.log(`[VERIFY-POLL] Attempt ${attempt}/${maxAttempts} for order ${orderId}`);

        // Circuit breaker: Stop if too many consecutive errors
        if (consecutiveErrors >= 3) {
          console.log(`[VERIFY-POLL] 🔴 Circuit breaker triggered for order ${orderId}`);
          handleCircuitBreaker(orderId, jobId);
          return;
        }

        const response = await fetch(`/api/payments/status?order_id=${orderId}`, {
          signal: AbortSignal.timeout(10000) // 10 second timeout per request
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`[VERIFY-POLL] Response:`, data);

        // Reset error counter on successful API call
        consecutiveErrors = 0;

        if (data.success) {
          // Payment successful!
          console.log(`[VERIFY-POLL] ✅ Payment verified successful for order ${orderId}`);
          
          await markJobAsPaid(jobId);
          
          setPaymentStatus({
            success: true,
            orderId: orderId,
            jobId: jobId,
            message: 'Payment successful! Your image is ready.'
          });
          setLoading(false);
          
          // Load image immediately
          loadImageSecurely(jobId);
          return; // Stop polling
          
        } else if (data.status === 'FAILED') {
          // Payment failed
          console.log(`[VERIFY-POLL] ❌ Payment failed for order ${orderId}`);
          
          setPaymentStatus({
            success: false,
            orderId: orderId,
            jobId: jobId,
            status: 'FAILED',
            message: 'Payment failed. Please try again.'
          });
          setLoading(false);
          return; // Stop polling
          
        } else if (attempt >= maxAttempts) {
          // Max attempts reached
          console.log(`[VERIFY-POLL] ⏰ Max attempts reached for order ${orderId}`);
          handleMaxAttempts(orderId, jobId);
          return;
          
        } else {
          // Still pending, schedule next poll with smart delay
          const delay = calculateDelay(attempt);
          console.log(`[VERIFY-POLL] Payment still pending, retrying in ${delay}ms...`);
          
          timeoutId = setTimeout(poll, delay);
        }
        
      } catch (error) {
        consecutiveErrors++;
        console.error(`[VERIFY-POLL] Error (${consecutiveErrors}/3):`, error);
        
        if (attempt >= maxAttempts || consecutiveErrors >= 3) {
          handleMaxAttempts(orderId, jobId);
          return;
        }

        // Retry on error with longer delay
        const delay = calculateDelay(attempt) * 1.5; // 50% longer delay for errors
        console.log(`[VERIFY-POLL] Retrying after error in ${delay}ms...`);
        
        timeoutId = setTimeout(poll, delay);
      }
    };

    // Smart delay calculation optimized for 12 seconds
    const calculateDelay = (attempt: number): number => {
      const baseDelay = 1500; // 1.5 seconds
      const maxDelay = 3000; // 3 seconds max
      const delay = Math.min(baseDelay * Math.pow(1.3, attempt - 1), maxDelay);
      return Math.round(delay);
    };

    // Handle timeout scenarios - simplified messages for better UX
    const handleTimeout = (orderId: string, jobId: string) => {
      console.log(`[VERIFY-POLL] ⏰ Verification timeout for order ${orderId}`);
      setPaymentStatus({
        success: false,
        orderId: orderId,
        jobId: jobId,
        status: 'PENDING',
        message: 'Payment verification is taking longer than expected. Please contact support.'
      });
      setLoading(false);
      setShowSupportMessage(true);
      console.log(`[VERIFY-POLL] ✅ Loading state cleared for timeout`);
    };

    const handleMaxAttempts = (orderId: string, jobId: string) => {
      console.log(`[VERIFY-POLL] ⏰ Max attempts reached for order ${orderId}`);
      setPaymentStatus({
        success: false,
        orderId: orderId,
        jobId: jobId,
        status: 'PENDING',
        message: 'Payment verification is taking longer than expected. Please contact support.'
      });
      setLoading(false);
      setShowSupportMessage(true);
      console.log(`[VERIFY-POLL] ✅ Loading state cleared for max attempts`);
    };

    const handleCircuitBreaker = (orderId: string, jobId: string) => {
      console.log(`[VERIFY-POLL] 🔴 Circuit breaker activated for order ${orderId}`);
      setPaymentStatus({
        success: false,
        orderId: orderId,
        jobId: jobId,
        status: 'PENDING',
        message: 'Payment verification is taking longer than expected. Please contact support.'
      });
      setLoading(false);
      setShowSupportMessage(true);
      console.log(`[VERIFY-POLL] ✅ Loading state cleared for circuit breaker`);
    };

    // Cleanup function
    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    // Start polling
    try {
      await poll();
    } finally {
      cleanup();
      // Safety: Ensure loading is always cleared
      setTimeout(() => {
        if (loading) {
          console.log(`[VERIFY-POLL] 🛡️ Safety: Force clearing loading state`);
          setLoading(false);
        }
      }, 100);
    }
  };

  // Fixed Architecture: Verify payment before marking as paid
  useEffect(() => {
    try {
      if (orderId && jobId) {
        // Step 1: Verify payment status first
        verifyPaymentAndMarkAsPaid(orderId, jobId);
        
        // Safety timeout: Force clear loading after 15 seconds
        const safetyTimeout = setTimeout(() => {
          if (loading) {
            console.log(`[SAFETY] 🛡️ Force clearing loading state after 15 seconds`);
            setLoading(false);
            setPaymentStatus({
              success: false,
              orderId: orderId,
              jobId: jobId,
              status: 'PENDING',
              message: 'Payment verification is taking longer than expected. Please contact support.'
            });
            setShowSupportMessage(true);
          }
        }, 15000);
        
        // Cleanup safety timeout
        return () => {
          clearTimeout(safetyTimeout);
        };
      } else {
        setPaymentStatus({
          success: false,
          message: 'No order ID or job ID provided'
        });
        setLoading(false);
      }
    } catch (error) {
      console.error('Error in payment success page:', error);
      setHasError(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, jobId]);

  // Debug loading state changes and track loading start time
  useEffect(() => {
    console.log(`[DEBUG] Loading state changed to: ${loading}`);
    if (loading && !loadingStartTimeRef.current) {
      loadingStartTimeRef.current = Date.now();
      console.log(`[DEBUG] Loading started at: ${loadingStartTimeRef.current}`);
    } else if (!loading && loadingStartTimeRef.current) {
      const duration = Date.now() - loadingStartTimeRef.current;
      console.log(`[DEBUG] Loading ended after: ${duration}ms`);
      loadingStartTimeRef.current = null;
    }
  }, [loading]);

  // Cleanup blob URL and timeouts on unmount
  useEffect(() => {
    return () => {
      if (imageBlobUrl) {
        URL.revokeObjectURL(imageBlobUrl);
      }
      // Cleanup any pending timeouts
      const timeouts = document.querySelectorAll('[data-timeout-id]');
      timeouts.forEach(timeout => {
        const timeoutId = timeout.getAttribute('data-timeout-id');
        if (timeoutId) {
          clearTimeout(parseInt(timeoutId));
        }
      });
    };
  }, [imageBlobUrl]);

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
    
    // Generate event_id for deduplication with server-side tracking
    const eventId = `${paymentStatus.orderId || orderId}_${trackingJobId}`;
    
    // Function to track purchase with retries
    const trackPurchaseWithRetry = (attempts = 0, maxAttempts = 20): ReturnType<typeof setTimeout> | null => {
      if (typeof window !== 'undefined' && window.fbq) {
        try {
          window.fbq('track', 'Purchase', {
            value: PRICING.SINGLE_IMAGE.RUPEES,
            currency: 'INR',
            content_ids: [trackingJobId],
          }, {
            eventID: eventId
          });
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

    const cleanupTimer = trackPurchaseWithRetry();
    
    return () => {
      if (cleanupTimer) clearTimeout(cleanupTimer);
    };
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, paymentStatus]);

  // Load image securely via download API (not direct R2 URL)
  const loadImageSecurely = async (jobId: string) => {
    try {
      setImageLoading(true);
      console.log(`[IMAGE] Loading image for job ${jobId} via secure API`);

      const response = await fetch(`/api/download-image?jobId=${jobId}&type=output`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[IMAGE] Failed to load image: ${response.status}`, errorData);
        
        // Handle specific error cases
        if (response.status === 403) {
          // Payment not confirmed - this shouldn't happen with zero-polling
          console.error('[IMAGE] Payment not confirmed error - this indicates a system issue');
          setShowSupportMessage(true);
        } else if (response.status === 404) {
          // Image not ready
          console.error('[IMAGE] Image not ready - may still be processing');
          // Don't show support message immediately, might be processing
        } else {
          setShowSupportMessage(true);
        }
        return;
      }
      
      const blob = await response.blob();
      
      // Validate that we received an actual image
      if (blob.size === 0) {
        throw new Error('Received empty image blob');
      }
      
      const blobUrl = URL.createObjectURL(blob);
      setImageBlobUrl(blobUrl);
      console.log(`[IMAGE] Image loaded successfully (${blob.size} bytes)`);
    } catch (error) {
      console.error('[IMAGE] Error loading image:', error);
      setShowSupportMessage(true);
    } finally {
      setImageLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!paymentStatus?.jobId) return;
    
    setDownloading(true);
    try {
      console.log(`[DOWNLOAD] Downloading image for job ${paymentStatus.jobId}`);
      
      const response = await fetch(`/api/download-image?jobId=${paymentStatus.jobId}&type=output`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[DOWNLOAD] Failed to download image: ${response.status}`, errorData);
        
        if (response.status === 403) {
          alert('Payment verification is still in progress. Please wait a moment and try again.');
        } else if (response.status === 404) {
          alert('Image is still being processed. Please wait a moment and try again.');
        } else {
          alert('Failed to download image. Please try again or contact support.');
        }
        return;
      }
      
      const blob = await response.blob();
      
      // Validate blob
      if (blob.size === 0) {
        throw new Error('Received empty image file');
      }
      
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `colorized-image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      
      console.log(`[DOWNLOAD] Download successful (${blob.size} bytes)`);
    } catch (error) {
      console.error('[DOWNLOAD] Download error:', error);
      alert('Failed to download image. Please try again or contact support.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    // Safety check: If loading for more than 15 seconds, show error
    if (loadingStartTimeRef.current) {
      const loadingDuration = Date.now() - loadingStartTimeRef.current;
      
      if (loadingDuration > 15000) {
        console.log(`[SAFETY] 🛡️ Loading duration exceeded 15 seconds (${loadingDuration}ms), forcing error state`);
        setLoading(false);
        setPaymentStatus({
          success: false,
          orderId: orderId || undefined,
          jobId: jobId || undefined,
          status: 'PENDING',
          message: 'Payment verification is taking longer than expected. Please contact support.'
        });
        setShowSupportMessage(true);
        return null; // Don't render loading UI
      }
    }
    
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="border shadow-lg bg-white">
            <CardContent className="p-8 sm:p-12">
              <div className="text-center space-y-6">
                {/* Animated Icon */}
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-100 to-green-100 rounded-full mb-2">
                  <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
                </div>
                
                {/* Main Message */}
                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Verifying Your Payment... ✨
                  </h2>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    We're confirming your payment with PhonePe. This usually takes just a few seconds.
                  </p>
                </div>

                {/* Progress Steps */}
                <div className="bg-gradient-to-r from-orange-50 to-green-50 border-2 border-orange-200 rounded-xl p-6 text-left space-y-3">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Payment Initiated</p>
                      <p className="text-sm text-gray-600">You completed the payment process</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Loader2 className="h-5 w-5 text-orange-600 animate-spin mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Verifying with PhonePe</p>
                      <p className="text-sm text-gray-600">Confirming payment status...</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="h-5 w-5 border-2 border-gray-300 rounded-full mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-700">Loading Your HD Image</p>
                      <p className="text-sm text-gray-500">Next step after verification</p>
                    </div>
                  </div>
                </div>

                {/* Reassurance */}
                <p className="text-sm text-gray-500 italic">
                  Please wait while we verify your payment. This ensures security! 🔒
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-6 sm:py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          {paymentStatus?.success ? (
            <div className="space-y-4 sm:space-y-8">
              {/* Success Header */}
              <div className="text-center space-y-2 sm:space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full mb-1 sm:mb-2 animate-bounce">
                  <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
                </div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-orange-500 to-green-600 bg-clip-text text-transparent">
                    Your Memory is Restored! 🎉
                  </span>
                </h1>
                <p className="text-sm sm:text-lg text-gray-600 max-w-2xl mx-auto">
                  Full HD quality • No watermark • Yours forever
                </p>
              </div>

              {/* Colorized Image Card */}
              {paymentStatus.jobId && (
                <div className="space-y-4 sm:space-y-6">
                  <Card className="border shadow-lg overflow-hidden bg-white">
                    <CardContent className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
                      {/* Main Image Display */}
                      <div className="relative">
                        <div className="relative aspect-video sm:aspect-[4/3] bg-gray-50 rounded-lg sm:rounded-xl overflow-hidden border-2 border-gray-200">
                          {imageBlobUrl && !imageLoading ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={imageBlobUrl}
                              alt="Your colorized HD image"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full space-y-2 sm:space-y-3">
                              <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-orange-500" />
                              <p className="text-sm sm:text-base text-gray-500 font-medium">Loading your HD image securely...</p>
                            </div>
                          )}
                          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                            <span className="bg-gradient-to-r from-orange-500 to-green-600 text-white text-xs font-bold px-2 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-lg">
                              ✨ HD Unlocked
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Support Message if images fail to load */}
                      {showSupportMessage && !imageBlobUrl && (
                        <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 sm:p-6">
                          <div className="flex items-start space-x-3">
                            <span className="text-orange-600 text-2xl">⚠️</span>
                            <div className="flex-1">
                              <h3 className="font-semibold text-orange-900 text-base sm:text-lg mb-2">
                                Payment Received - Image Loading Issue
                              </h3>
                              <p className="text-sm sm:text-base text-orange-800 leading-relaxed mb-3">
                                We've confirmed your payment, but there's a temporary issue loading your colorized image. 
                                Don't worry - your image is safe and we'll help you get it!
                              </p>
                              <p className="text-sm text-orange-700 mb-4">
                                <strong>Order ID:</strong> {paymentStatus?.orderId}
                                <br />
                                <strong>Job ID:</strong> {paymentStatus?.jobId}
                              </p>
                              <Button 
                                asChild 
                                size="lg" 
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Link 
                                  href={`https://wa.me/917984837468?text=Hi%2C%20my%20payment%20was%20successful%20but%20I%20can't%20see%20my%20image.%20Order%20ID%3A%20${encodeURIComponent(paymentStatus?.orderId || 'N/A')}%20%7C%20Job%20ID%3A%20${encodeURIComponent(paymentStatus?.jobId || 'N/A')}`} 
                                  target="_blank"
                                >
                                  📱 Contact Support on WhatsApp
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Download Button */}
                      <Button 
                        onClick={handleDownload}
                        disabled={downloading || !imageBlobUrl}
                        className="w-full h-12 sm:h-14 bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        size="lg"
                      >
                        {downloading ? (
                          <>
                            <Loader2 className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                            Downloading...
                          </>
                        ) : !imageBlobUrl ? (
                          <>
                            ⏳ Loading your image...
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
                        className="w-full h-11 sm:h-12 border-2 border-green-600 text-green-700 hover:bg-green-50 font-semibold text-sm sm:text-base"
                      >
                        <Link href="https://wa.me/917984837468?text=Hi!%20I%20have%2020%2B%20photos%20to%20restore.%20Can%20I%20get%20a%20bulk%20discount%3F" target="_blank">
                          💬 WhatsApp Us for Bulk Orders (10+ Images)
                        </Link>
                      </Button>

                      {/* Colorize Another Button */}
                      <Button asChild variant="outline" size="lg" className="w-full h-11 sm:h-12 border-2 hover:bg-gray-50 text-sm sm:text-base">
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
                <CardTitle className="text-3xl text-red-600">
                  {paymentStatus?.status === 'FAILED' ? 'Payment Failed' : 'Payment Still Processing'}
                </CardTitle>
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
                
                {/* Payment Deducted Notice */}
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 sm:p-6 space-y-3">
                  <div className="flex items-start space-x-3">
                    <span className="text-orange-600 text-xl sm:text-2xl">⚠️</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-orange-900 text-base sm:text-lg mb-2">
                        Payment Deducted from Your Account?
                      </h3>
                      <p className="text-sm sm:text-base text-orange-800 leading-relaxed mb-2">
                        If the payment amount was deducted from your account, please take a screenshot of your bank/payment confirmation and WhatsApp us immediately. We'll resolve this for you right away.
                      </p>
                      {orderId && (
                        <p className="text-sm text-orange-700 mb-3">
                          <strong>Order ID:</strong> {orderId}
                          {jobId && (
                            <>
                              <br />
                              <strong>Job ID:</strong> {jobId}
                            </>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    asChild 
                    size="lg" 
                    className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Link 
                      href={`https://wa.me/917984837468?text=Hi%2C%20my%20payment%20verification%20failed%20but%20amount%20was%20deducted.%20Order%20ID%3A%20${encodeURIComponent(orderId || 'N/A')}%20%7C%20Job%20ID%3A%20${encodeURIComponent(jobId || 'N/A')}`}
                      target="_blank"
                    >
                      📱 WhatsApp Us with Screenshot
                    </Link>
                  </Button>
                </div>
                
                <Button 
                  asChild 
                  variant="outline" 
                  size="lg" 
                  className="w-full h-14 text-lg border-2 hover:bg-gray-50"
                >
                  <Link href="https://wa.me/917984837468?text=Hi%2C%20I%20need%20help%20with%20my%20payment." target="_blank">
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
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <Card className="border shadow-lg bg-white">
              <CardContent className="p-8 sm:p-12">
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-100 to-green-100 rounded-full mb-2">
                    <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      Almost There! 🎉
                    </h2>
                    <p className="text-base sm:text-lg text-gray-600">
                      Loading your payment details and colorized image...
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 italic">
                    Your restored memory is just moments away! ✨
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      }>
        <PaymentSuccessContent />
      </Suspense>
    </div>
  );
}

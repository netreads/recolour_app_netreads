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

  // NEW ARCHITECTURE: Smart delayed verification via download attempt
  const verifyPaymentViaDownload = async (orderId: string, jobId: string, attempt: number = 1) => {
    try {
      console.log(`[VERIFY] Attempt ${attempt}: Loading image for job ${jobId}...`);
      
      // Try to download/load the image - this triggers payment verification
      const response = await fetch(`/api/download-image?jobId=${jobId}&type=output`, {
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });
      
      if (response.ok) {
        // ✅ SUCCESS! Payment verified and image ready
        console.log(`[VERIFY] ✅ Payment verified, image ready!`);
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        setImageBlobUrl(blobUrl);
        setPaymentStatus({
          success: true,
          orderId: orderId,
          jobId: jobId,
          message: 'Payment successful! Your image is ready.'
        });
        setLoading(false);
        setImageLoading(false);
        
      } else {
        // Handle different error codes
        const data = await response.json().catch(() => ({}));
        console.log(`[VERIFY] Response ${response.status}:`, data);
        
        if (response.status === 402) {
          // Payment pending or failed
          if (data.code === 'PAYMENT_PENDING') {
            // Payment still processing, retry after suggested delay
            console.log(`[VERIFY] ⏳ Payment pending, will retry in ${data.retryAfter || 5}s...`);
            
            setPaymentStatus({
              success: false,
              orderId: orderId,
              jobId: jobId,
              status: 'PENDING',
              message: data.message || 'Verifying your payment with PhonePe...'
            });
            
            // Smart retry with exponential backoff (max 5 attempts)
            if (attempt < 5) {
              const delay = (data.retryAfter || 5) * 1000;
              setTimeout(() => {
                verifyPaymentViaDownload(orderId, jobId, attempt + 1);
              }, delay);
            } else {
              // Max attempts reached
              console.log(`[VERIFY] ⏰ Max retry attempts reached`);
              setPaymentStatus({
                success: false,
                orderId: orderId,
                jobId: jobId,
                status: 'PENDING',
                message: 'Payment verification is taking longer than expected. Please contact support.'
              });
              setLoading(false);
              setShowSupportMessage(true);
            }
            
          } else if (data.code === 'PAYMENT_FAILED') {
            // Payment failed
            console.log(`[VERIFY] ❌ Payment failed`);
            
            setPaymentStatus({
              success: false,
              orderId: orderId,
              jobId: jobId,
              status: 'FAILED',
              message: data.message || 'Payment failed. Please try again.'
            });
            setLoading(false);
            
          } else if (data.code === 'NO_PAYMENT') {
            // No payment found
            console.log(`[VERIFY] ❌ No payment found`);
            
            setPaymentStatus({
              success: false,
              orderId: orderId,
              jobId: jobId,
              message: data.message || 'No payment found for this image.'
            });
            setLoading(false);
            setShowSupportMessage(true);
          }
          
        } else if (response.status === 503) {
          // Service error, retry once more
          console.log(`[VERIFY] ⚠️ Service error, will retry...`);
          
          if (attempt < 3) {
            setTimeout(() => {
              verifyPaymentViaDownload(orderId, jobId, attempt + 1);
            }, 10000); // Wait 10 seconds
          } else {
            setPaymentStatus({
              success: false,
              orderId: orderId,
              jobId: jobId,
              message: 'Unable to verify payment. Please try again or contact support.'
            });
            setLoading(false);
            setShowSupportMessage(true);
          }
          
        } else {
          // Other errors
          console.error(`[VERIFY] ❌ Unexpected error: ${response.status}`);
          
          setPaymentStatus({
            success: false,
            orderId: orderId,
            jobId: jobId,
            message: data.message || 'Unable to load image. Please contact support.'
          });
          setLoading(false);
          setShowSupportMessage(true);
        }
      }
      
    } catch (error) {
      console.error(`[VERIFY] ❌ Error on attempt ${attempt}:`, error);
      
      // Retry on network errors (up to 3 times)
      if (attempt < 3) {
        console.log(`[VERIFY] 🔄 Network error, retrying in 5s...`);
        setTimeout(() => {
          verifyPaymentViaDownload(orderId, jobId, attempt + 1);
        }, 5000);
      } else {
        setPaymentStatus({
          success: false,
          orderId: orderId,
          jobId: jobId,
          message: 'Failed to verify payment. Please contact support.'
        });
        setLoading(false);
        setShowSupportMessage(true);
      }
    }
  };

  // NEW ARCHITECTURE: Start verification after short delay
  useEffect(() => {
    try {
      if (orderId && jobId) {
        console.log(`[SUCCESS] Starting verification for order ${orderId}, job ${jobId}`);
        
        // Give PhonePe a few seconds to process (they're usually fast)
        // Then attempt to load image which triggers verification
        const initialDelay = setTimeout(() => {
          verifyPaymentViaDownload(orderId, jobId);
        }, 3000); // 3 second delay
        
        // Safety timeout: Force clear loading after 60 seconds
        const safetyTimeout = setTimeout(() => {
          if (loading) {
            console.log(`[SAFETY] 🛡️ Force clearing loading state after 60 seconds`);
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
        }, 60000);
        
        // Cleanup
        return () => {
          clearTimeout(initialDelay);
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
      console.error('[SUCCESS] Error in payment success page:', error);
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

  // Manual retry button handler
  const handleRetryVerification = () => {
    if (!orderId || !jobId) return;
    
    console.log(`[RETRY] User manually retrying verification...`);
    setLoading(true);
    setShowSupportMessage(false);
    
    // Start verification again
    verifyPaymentViaDownload(orderId, jobId);
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
                    {paymentStatus?.message || 'Verifying Your Payment... ✨'}
                  </h2>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    We're confirming your payment with PhonePe and loading your colorized image.
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
                      <p className="font-semibold text-gray-900">Verifying & Loading</p>
                      <p className="text-sm text-gray-600">Confirming payment and preparing your image...</p>
                    </div>
                  </div>
                </div>

                {/* Reassurance */}
                <p className="text-sm text-gray-500 italic">
                  This usually takes 5-10 seconds. Please don't close this page! 🔒
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
                                Payment Verification Issue
                              </h3>
                              <p className="text-sm sm:text-base text-orange-800 leading-relaxed mb-3">
                                We're having trouble verifying your payment. This is usually temporary. 
                                Please try clicking "Retry" below, or contact support if the issue persists.
                              </p>
                              <p className="text-sm text-orange-700 mb-4">
                                <strong>Order ID:</strong> {paymentStatus?.orderId}
                                <br />
                                <strong>Job ID:</strong> {paymentStatus?.jobId}
                              </p>
                              <div className="space-y-3">
                                <Button 
                                  onClick={handleRetryVerification}
                                  disabled={loading}
                                  size="lg" 
                                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                  {loading ? (
                                    <>
                                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                      Retrying...
                                    </>
                                  ) : (
                                    <>🔄 Retry Verification</>
                                  )}
                                </Button>
                                <Button 
                                  asChild 
                                  size="lg" 
                                  variant="outline"
                                  className="w-full border-2 border-green-600 text-green-700 hover:bg-green-50"
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

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { PRICING } from '@/lib/constants';

interface PaymentStatus {
  success: boolean;
  orderId?: string;
  amount?: number;
  message?: string;
  jobId?: string;
  status?: string;
  alreadyPaid?: boolean;
  alreadyFailed?: boolean;
  timeout?: boolean;
  retryAfter?: number;
  phonePeState?: string;
  transactionId?: string;
  error?: boolean;
}

function SimplePaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const jobId = searchParams.get('job_id');
  
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [imageBlobUrl, setImageBlobUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [showSupportMessage, setShowSupportMessage] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retryTimer, setRetryTimer] = useState<number | null>(null);

  // Check payment status once on mount
  useEffect(() => {
    if (orderId) {
      checkPaymentStatus();
    } else {
      setPaymentStatus({
        success: false,
        message: 'No order ID provided'
      });
      setLoading(false);
    }
  }, [orderId]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (imageBlobUrl) {
        URL.revokeObjectURL(imageBlobUrl);
      }
    };
  }, [imageBlobUrl]);

  // Track purchase event when payment succeeds
  useEffect(() => {
    if (!paymentStatus?.success || !paymentStatus?.jobId) return;

    const trackingJobId = paymentStatus.jobId || jobId;
    if (!trackingJobId) return;
    
    // Generate event_id for deduplication
    const eventId = `${paymentStatus.orderId || orderId}_${trackingJobId}`;
    
    // Track purchase with retries
    const trackPurchaseWithRetry = (attempts = 0, maxAttempts = 10): ReturnType<typeof setTimeout> | null => {
      if (typeof window !== 'undefined' && window.fbq) {
        try {
          window.fbq('track', 'Purchase', {
            value: PRICING.SINGLE_IMAGE.RUPEES,
            currency: 'INR',
            content_ids: [trackingJobId],
          }, {
            eventID: eventId
          });
          return null;
        } catch (error) {
          return null;
        }
      } else if (attempts < maxAttempts) {
        return setTimeout(() => trackPurchaseWithRetry(attempts + 1, maxAttempts), 500);
      } else {
        return null;
      }
    };

    const cleanupTimer = trackPurchaseWithRetry();
    return () => {
      if (cleanupTimer) clearTimeout(cleanupTimer);
    };
  }, [paymentStatus, jobId, orderId]);

  // Retry timer countdown
  useEffect(() => {
    if (retryTimer && retryTimer > 0) {
      const interval = setInterval(() => {
        setRetryTimer(prev => {
          if (prev && prev <= 1) {
            clearInterval(interval);
            return null;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [retryTimer]);

  const checkPaymentStatus = async () => {
    try {
      setLoading(true);
      console.log(`[SIMPLE-CHECK] Checking payment status for order ${orderId}`);

      const response = await fetch(`/api/payments/status?order_id=${orderId}`);
      const data = await response.json();
      
      console.log(`[SIMPLE-CHECK] Response:`, data);
      console.log(`[SIMPLE-CHECK] Payment success:`, data.success);
      console.log(`[SIMPLE-CHECK] Payment status:`, data.status);
      console.log(`[SIMPLE-CHECK] PhonePe state:`, data.phonePeState);

      setPaymentStatus(data);

      if (data.success) {
        console.log(`[SIMPLE-CHECK] ✅ Payment successful - loading image`);
        // Payment successful - load image
        const finalJobId = data.jobId || jobId;
        if (finalJobId) {
          await loadImageSecurely(finalJobId);
        }
      } else {
        console.log(`[SIMPLE-CHECK] ❌ Payment failed or pending`);
        if (data.retryAfter && retryCount < 3) {
          console.log(`[SIMPLE-CHECK] Setting retry timer: ${data.retryAfter}s`);
          // Set retry timer
          setRetryTimer(data.retryAfter);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error(`[SIMPLE-CHECK] Error checking payment status:`, error);
      setPaymentStatus({
        success: false,
        message: 'Failed to verify payment status. Please contact support.',
        error: true
      });
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setRetryTimer(null);
    checkPaymentStatus();
  };

  const loadImageSecurely = async (jobId: string) => {
    try {
      setImageLoading(true);
      console.log(`[IMAGE] Loading image for job ${jobId} via secure API`);

      const response = await fetch(`/api/download-image?jobId=${jobId}&type=output`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[IMAGE] Failed to load image: ${response.status}`, errorData);
        
        if (response.status === 403) {
          console.error('[IMAGE] Payment not confirmed error');
          setShowSupportMessage(true);
        } else if (response.status === 404) {
          console.error('[IMAGE] Image not ready');
        } else {
          setShowSupportMessage(true);
        }
        return;
      }
      
      const blob = await response.blob();
      
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
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-100 to-green-100 rounded-full mb-2">
                  <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
                </div>
                
                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Verifying Your Payment... ✨
                  </h2>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    We're confirming your payment with PhonePe. This usually takes just a few seconds.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-green-50 border-2 border-orange-200 rounded-xl p-6 text-left space-y-3">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Payment Initiated</p>
                      <p className="text-sm text-gray-600">You completed the payment successfully</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Loader2 className="h-5 w-5 text-orange-600 animate-spin mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Confirming with PhonePe</p>
                      <p className="text-sm text-gray-600">Single verification check (10s timeout)</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="h-5 w-5 border-2 border-gray-300 rounded-full mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-700">Loading Your HD Image</p>
                      <p className="text-sm text-gray-500">Next step after confirmation</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-500 italic">
                  Please wait, do not refresh or close this page. This process is automatic. 🎨
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
                {paymentStatus.transactionId && (
                  <p className="text-xs text-gray-500">
                    Transaction ID: {paymentStatus.transactionId}
                  </p>
                )}
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
            /* Payment Failed/Pending State */
            <Card className="border shadow-lg bg-white">
              <CardHeader className="text-center space-y-4 pt-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-3xl text-red-600">
                  {paymentStatus?.timeout ? 'Payment Verification Timeout' : 
                   paymentStatus?.status === 'PENDING' ? 'Payment Still Processing' :
                   'Payment Failed'}
                </CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  {paymentStatus?.message || 'There was an issue processing your payment.'}
                </CardDescription>
                {paymentStatus?.phonePeState && (
                  <p className="text-sm text-gray-500">
                    PhonePe Status: {paymentStatus.phonePeState}
                  </p>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4 pb-12 px-6">
                {/* Retry Button with countdown */}
                {(paymentStatus?.retryAfter || paymentStatus?.timeout) && retryCount < 3 && (
                  <div className="space-y-3">
                    <Button 
                      onClick={handleRetry}
                      disabled={retryTimer !== null && retryTimer > 0}
                      className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50" 
                      size="lg"
                    >
                      {retryTimer && retryTimer > 0 ? (
                        <>🔄 Retry in {retryTimer}s (Attempt {retryCount + 1}/3)</>
                      ) : (
                        <>🔄 Retry Payment Verification (Attempt {retryCount + 1}/3)</>
                      )}
                    </Button>
                    {retryTimer && retryTimer > 0 && (
                      <p className="text-center text-sm text-gray-500">
                        Please wait {retryTimer} seconds before retrying...
                      </p>
                    )}
                  </div>
                )}
                
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
        <SimplePaymentSuccessContent />
      </Suspense>
    </div>
  );
}

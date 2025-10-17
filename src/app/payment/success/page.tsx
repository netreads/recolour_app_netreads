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
  const [showSupportMessage, setShowSupportMessage] = useState(false);
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
    
    // Generate event_id for deduplication with server-side tracking
    // Facebook uses this to deduplicate events sent from both browser and server
    const eventId = `${paymentStatus.orderId || orderId}_${trackingJobId}`;
    
    // Function to track purchase with retries
    const trackPurchaseWithRetry = (attempts = 0, maxAttempts = 20): ReturnType<typeof setTimeout> | null => {
      if (typeof window !== 'undefined' && window.fbq) {
        try {
          // Send with event_id for deduplication with CAPI
          window.fbq('track', 'Purchase', {
            value: PRICING.SINGLE_IMAGE.RUPEES,
            currency: 'INR',
            content_ids: [trackingJobId],
          }, {
            eventID: eventId // Facebook will deduplicate if CAPI also sends this event_id
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
        // Retry logic for verify-payment to handle network issues and race conditions
        let verifyAttempts = 0;
        const maxVerifyAttempts = 2; // Reduced from 5 to 2 for faster UX
        let verificationSuccess = false;
        
        while (verifyAttempts < maxVerifyAttempts && !verificationSuccess) {
          try {
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId, jobId: finalJobId }),
            });
            
            if (verifyResponse.ok) {
              verificationSuccess = true;
              break;
            } else {
              // If verification fails, wait and retry
              verifyAttempts++;
              if (verifyAttempts < maxVerifyAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000 * verifyAttempts)); // Exponential backoff
              }
            }
          } catch (err) {
            verifyAttempts++;
            console.error(`Verify payment attempt ${verifyAttempts} failed:`, err);
            if (verifyAttempts < maxVerifyAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000 * verifyAttempts)); // Exponential backoff
            }
          }
        }
        
        // Fetch the actual image URLs from the database with retry
        let fetchAttempts = 0;
        const maxFetchAttempts = 2; // Reduced from 3 to 2 for faster UX
        let fetchedUrls: { original: string; output: string } | null = null;
        
        while (fetchAttempts < maxFetchAttempts) {
          try {
            const [originalResponse, outputResponse] = await Promise.all([
              fetch(`/api/get-image-url?jobId=${finalJobId}&type=original`),
              fetch(`/api/get-image-url?jobId=${finalJobId}&type=output`)
            ]);
            
            // Check response status
            if (!originalResponse.ok) {
              console.error('Original image URL request failed:', originalResponse.status, await originalResponse.text());
            }
            if (!outputResponse.ok) {
              console.error('Output image URL request failed:', outputResponse.status, await outputResponse.text());
            }
            
            const originalData = originalResponse.ok ? await originalResponse.json() : { url: null };
            const outputData = outputResponse.ok ? await outputResponse.json() : { url: null };
            
            // Debug logging
            if (!originalData.url) {
              console.warn('Original image URL not found. Response:', originalData, 'JobId:', finalJobId);
            }
            if (!outputData.url) {
              console.warn('Output image URL not found. Response:', outputData, 'JobId:', finalJobId);
            }
            
            if (originalData.url && outputData.url) {
              fetchedUrls = {
                original: originalData.url || '',
                output: outputData.url || ''
              };
              setImageUrls(fetchedUrls);
              break;
            } else {
              fetchAttempts++;
              console.warn(`Image URLs incomplete on attempt ${fetchAttempts}. Original: ${!!originalData.url}, Output: ${!!outputData.url}`);
              if (fetchAttempts < maxFetchAttempts) {
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
          } catch (err) {
            fetchAttempts++;
            console.error(`Fetch image URLs attempt ${fetchAttempts} failed:`, err);
            if (fetchAttempts < maxFetchAttempts) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
        
        // If we still don't have images after all retries, try direct URL construction as last resort
        if (!fetchedUrls?.output) {
          console.warn('Failed to fetch URLs from API, attempting direct URL construction...');
          
          // Try to construct URLs directly from R2 public URL
          const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_URL;
          if (R2_PUBLIC_URL) {
            const cleanUrl = R2_PUBLIC_URL.replace(/\/$/, '');
            // Note: We don't know the original filename, so this is a best-effort attempt
            // The output URL pattern is predictable, but original URL is not
            fetchedUrls = {
              original: '', // We can't construct this without knowing the filename
              output: `${cleanUrl}/outputs/${finalJobId}-colorized.jpg`
            };
            setImageUrls(fetchedUrls);
            console.log('Constructed direct output URL:', fetchedUrls.output);
          } else {
            console.error('Failed to fetch images after all retry attempts. Verification success:', verificationSuccess);
            setShowSupportMessage(true);
          }
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
                    Processing Your Order... ✨
                  </h2>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    We're verifying your payment and preparing your colorized image in full HD quality.
                  </p>
                </div>

                {/* Progress Steps */}
                <div className="bg-gradient-to-r from-orange-50 to-green-50 border-2 border-orange-200 rounded-xl p-6 text-left space-y-3">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Payment Received</p>
                      <p className="text-sm text-gray-600">Your transaction is being confirmed</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Loader2 className="h-5 w-5 text-orange-600 animate-spin mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Preparing Your Image</p>
                      <p className="text-sm text-gray-600">Loading your restored memory in HD...</p>
                    </div>
                  </div>
                </div>

                {/* Reassurance */}
                <p className="text-sm text-gray-500 italic">
                  This usually takes just a few seconds. Your image will appear shortly! 🎨
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
                          {imageUrls?.output ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={imageUrls.output}
                              alt="Your colorized HD image"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full space-y-2 sm:space-y-3">
                              <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-orange-500" />
                              <p className="text-sm sm:text-base text-gray-500 font-medium">Loading your HD image...</p>
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
                      {showSupportMessage && !imageUrls?.output && (
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
                                  href={`https://wa.me/917984837468?text=Hi%2C%20my%20payment%20was%20successful%20but%20I%20can't%20download%20my%20image.%20Order%20ID%3A%20${encodeURIComponent(paymentStatus?.orderId || 'N/A')}%20%7C%20Job%20ID%3A%20${encodeURIComponent(paymentStatus?.jobId || 'N/A')}`} 
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
                        disabled={downloading || !imageUrls?.output}
                        className="w-full h-12 sm:h-14 bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        size="lg"
                      >
                        {downloading ? (
                          <>
                            <Loader2 className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                            Downloading...
                          </>
                        ) : !imageUrls?.output ? (
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
                
                {/* Payment Deducted Notice */}
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 sm:p-6 space-y-3">
                  <div className="flex items-start space-x-3">
                    <span className="text-orange-600 text-xl sm:text-2xl">⚠️</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-orange-900 text-base sm:text-lg mb-2">
                        Payment Deducted from Your Account?
                      </h3>
                      <p className="text-sm sm:text-base text-orange-800 leading-relaxed">
                        If the payment amount was deducted from your account, please take a screenshot of your bank/payment confirmation and WhatsApp us immediately. We'll resolve this for you right away.
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    asChild 
                    size="lg" 
                    className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Link href="https://wa.me/917984837468?text=Hi%2C%20my%20payment%20failed%20but%20the%20amount%20was%20deducted%20from%20my%20account.%20Order%20ID%3A%20%5BYour%20Order%20ID%5D.%20I%20am%20sharing%20the%20payment%20screenshot." target="_blank">
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
                  <Link href="https://wa.me/917984837468?text=Hi%2C%20I%20am%20unable%20to%do%payement%20for%20the%20image.%20Can%20you%20help%3F" target="_blank">
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
  );
}

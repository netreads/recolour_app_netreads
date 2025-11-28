'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Sparkles, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PRICING, UpscaleTier } from '@/lib/constants';

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

  // Process upscale
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
        if (data.code === 'PAYMENT_PENDING') {
          // Retry after delay
          setTimeout(() => processUpscale(), 5000);
          return;
        }
        throw new Error(data.error || 'Payment verification failed');
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

  // Start processing on mount
  useEffect(() => {
    if (!orderId || !jobId || !tier) {
      setError('Missing order details');
      setStatus('failed');
      return;
    }

    if (!processStartedRef.current) {
      processStartedRef.current = true;
      // Small delay to let payment complete
      setTimeout(() => processUpscale(), 2000);
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
                  Upscale Failed
                </h2>
                <p className="text-gray-600 mb-6">
                  {error || 'Something went wrong during upscaling.'}
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      processStartedRef.current = false;
                      setError(null);
                      setStatus('verifying');
                      setProgress(0);
                      setTimeout(() => processUpscale(), 1000);
                    }}
                    className="w-full bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700"
                  >
                    🔄 Try Again
                  </Button>
                  <Button asChild variant="outline" className="w-full border-2 border-green-600 text-green-700">
                    <Link 
                      href={`https://wa.me/917984837468?text=Hi%2C%20my%20upscale%20failed.%20Order%20ID%3A%20${encodeURIComponent(orderId || 'N/A')}`}
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


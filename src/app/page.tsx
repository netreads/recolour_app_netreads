"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Sparkles, Star, ArrowRight, ImageIcon, Shield, Award, CheckCircle, Quote, Upload, Download, RefreshCw, Wand2, Palette, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { trackPageView } from "@/components/FacebookPixel";
import { ImageViewer } from "@/components/features/ImageViewer";

interface Job {
  id: string;
  original_url: string;
  output_url: string | null;
  status: "pending" | "processing" | "done" | "failed";
  created_at: string;
}

const LOADING_TIPS = [
  "🎨 Our AI analyzes thousands of historical photos to understand authentic colors",
  "🖼️ The colorization process considers lighting, shadows, and context",
  "✨ Each image is processed with deep learning models trained on millions of photos",
  "🌈 Colors are carefully selected based on the era and subject matter",
  "🎭 Facial features help determine natural skin tones and makeup styles",
  "📸 Texture analysis helps identify materials like fabric, wood, and metal",
  "💡 The AI understands different lighting conditions for accurate colors",
  "🏛️ Historical accuracy is maintained by analyzing period-appropriate palettes",
];

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'uploading' | 'analyzing' | 'colorizing' | 'finalizing'>('uploading');
  const [currentTip, setCurrentTip] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [thumbViewByJob, setThumbViewByJob] = useState<Record<string, 'original' | 'colorized'>>({});
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerJob, setViewerJob] = useState<Job | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Track pageview for Facebook Pixel
    trackPageView();
    // Load jobs from local storage on mount
    loadJobsFromStorage();
  }, []);

  // Rotate tips during upload
  useEffect(() => {
    if (!isUploading) return;
    
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 3000);
    
    return () => clearInterval(tipInterval);
  }, [isUploading]);

  const loadJobsFromStorage = () => {
    try {
      const storedJobs = localStorage.getItem('recolor_jobs');
      if (storedJobs) {
        setJobs(JSON.parse(storedJobs));
      }
    } catch (error) {
      console.error("Error loading jobs from storage:", error);
    }
  };

  const saveJobsToStorage = (newJobs: Job[]) => {
    try {
      localStorage.setItem('recolor_jobs', JSON.stringify(newJobs));
    } catch (error) {
      console.error("Error saving jobs to storage:", error);
    }
  };

  const getImageUrl = (jobId: string, type: 'original' | 'output'): string => {
    return `/api/image-proxy?jobId=${jobId}&type=${type}`;
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStage('uploading');
    setCurrentTip(0);

    try {
      // Stage 1: Uploading (0-25%)
      setUploadStage('uploading');
      const formData = new FormData();
      formData.append('file', uploadFile);

      const uploadProgressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 5, 25));
      }, 100);

      const uploadResponse = await fetch("/api/upload-via-presigned", {
        method: "POST",
        body: formData,
      });

      clearInterval(uploadProgressInterval);
      setUploadProgress(25);

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      const { jobId } = await uploadResponse.json();

      // Stage 2: Analyzing (25-40%)
      setUploadStage('analyzing');
      const analyzingInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 3, 40));
      }, 150);

      await new Promise(resolve => setTimeout(resolve, 500));
      clearInterval(analyzingInterval);
      setUploadProgress(40);

      // Stage 3: Colorizing (40-85%)
      setUploadStage('colorizing');
      const submitResponse = await fetch("/api/submit-job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId }),
      });

      const colorizingInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 2, 85));
      }, 200);

      if (!submitResponse.ok) {
        clearInterval(colorizingInterval);
        const errorData = await submitResponse.json();
        throw new Error(errorData.error || "Failed to submit job");
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      clearInterval(colorizingInterval);
      setUploadProgress(85);

      // Stage 4: Finalizing (85-100%)
      setUploadStage('finalizing');
      const finalizingInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 3, 100));
      }, 100);

      await new Promise(resolve => setTimeout(resolve, 500));
      clearInterval(finalizingInterval);
      setUploadProgress(100);

      // Create a new job entry and add to local storage
      const newJob: Job = {
        id: jobId,
        original_url: '', // Will be filled by image proxy
        output_url: '', // Will be filled by image proxy
        status: 'done',
        created_at: new Date().toISOString(),
      };
      
      const updatedJobs = [newJob, ...jobs];
      setJobs(updatedJobs);
      saveJobsToStorage(updatedJobs);

      // Reset form
      setUploadFile(null);
    } catch (error) {
      console.error("Error uploading file:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload file. Please try again.";
      alert(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStage('uploading');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setUploadFile(file);
      } else {
        alert('Please upload an image file');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadFile(file);
    } else {
      alert('Please select an image file');
    }
  };

  const completedJobs = jobs
    .filter(job => job.status === 'done' && job.output_url)
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

  return (
    <>
      {/* SEO Structured Data for Video */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoObject",
            "name": "ReColor AI Demo Video",
            "description": "Watch how our AI transforms black and white photos into vibrant memories",
            "thumbnailUrl": "https://drive.google.com/thumbnail?id=1iya9BXxFIkCD3CHc6azrL5A1Pom7_6qu",
            "uploadDate": "2024-01-01",
            "duration": "PT30S",
            "contentUrl": "https://drive.google.com/file/d/1iya9BXxFIkCD3CHc6azrL5A1Pom7_6qu/view",
            "embedUrl": "https://drive.google.com/file/d/1iya9BXxFIkCD3CHc6azrL5A1Pom7_6qu/preview",
            "publisher": {
              "@type": "Organization",
              "name": "ReColor AI",
              "logo": {
                "@type": "ImageObject",
                "url": "/next.svg"
              }
            }
          })
        }}
      />
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-16 sm:pt-20 pb-12 sm:pb-16">
          <div className="text-center space-y-6 sm:space-y-8 max-w-5xl mx-auto">
            <div className="space-y-4 sm:space-y-6">
              <Badge variant="secondary" className="mx-auto bg-saffron-50 text-saffron-700 border-saffron-200 animate-pulse text-xs sm:text-sm">
                <Sparkles className="w-3 h-3 mr-1 animate-spin" />
                Trusted by 50,000+ Indian families 🇮🇳
              </Badge>
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-tight">
                Bring your old Photos back to life
                <br />
                <span className="bg-gradient-to-r from-orange-500 to-green-600 bg-clip-text text-transparent">
                  in stunning HD colors
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
                Restore faded photos to vivid HD color with professional AI
                <br className="hidden sm:block" />
                <span className="sm:hidden"> </span>— Perfect for family albums, weddings, and festivals.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-gray-500 px-4">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span>Studio-quality AI colorization</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span>Restore old & damaged photos</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span>Free to use</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span>100% secure & private</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Upload Section */}
        <section id="upload" className="py-8 sm:py-12 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors ${
                      dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    {uploadFile ? (
                      <div className="space-y-4">
                        <div className="relative w-full max-w-sm mx-auto">
                          <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={URL.createObjectURL(uploadFile)}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 truncate">{uploadFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setUploadFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                        >
                          Choose Different File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                        <div>
                          <p className="text-base font-medium text-gray-900">Drop your image here</p>
                          <p className="text-sm text-gray-500 mt-1">
                            or click to browse • JPG, PNG, WebP up to 10MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Select Image
                        </Button>
                      </div>
                    )}
                  </div>

                  {isUploading ? (
                    <div className="space-y-4 p-4 sm:p-6 bg-gradient-to-br from-orange-50 to-purple-50 border-2 border-orange-200 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {uploadStage === 'uploading' && (
                              <>
                                <Upload className="h-4 w-4 text-orange-500 animate-pulse" />
                                <span className="font-medium text-gray-700">Uploading your image...</span>
                              </>
                            )}
                            {uploadStage === 'analyzing' && (
                              <>
                                <Wand2 className="h-4 w-4 text-purple-500 animate-pulse" />
                                <span className="font-medium text-gray-700">Analyzing image details...</span>
                              </>
                            )}
                            {uploadStage === 'colorizing' && (
                              <>
                                <Palette className="h-4 w-4 text-pink-500 animate-pulse" />
                                <span className="font-medium text-gray-700">AI is colorizing...</span>
                              </>
                            )}
                            {uploadStage === 'finalizing' && (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-green-500 animate-pulse" />
                                <span className="font-medium text-gray-700">Finalizing your image...</span>
                              </>
                            )}
                          </div>
                          <span className="font-bold text-orange-600">{uploadProgress}%</span>
                        </div>
                        <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner">
                          <div
                            className="h-full bg-gradient-to-r from-orange-400 via-purple-400 to-pink-400 transition-all duration-300 ease-out rounded-full"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 px-2">
                        {[
                          { stage: 'uploading', icon: Upload, label: 'Upload' },
                          { stage: 'analyzing', icon: Wand2, label: 'Analyze' },
                          { stage: 'colorizing', icon: Palette, label: 'Colorize' },
                          { stage: 'finalizing', icon: CheckCircle2, label: 'Finalize' },
                        ].map(({ stage, icon: Icon, label }) => (
                          <div
                            key={stage}
                            className={`flex flex-col items-center gap-1 flex-1 ${
                              uploadStage === stage
                                ? 'opacity-100'
                                : uploadProgress > (
                                    stage === 'uploading' ? 0 :
                                    stage === 'analyzing' ? 25 :
                                    stage === 'colorizing' ? 40 : 85
                                  )
                                ? 'opacity-100'
                                : 'opacity-40'
                            }`}
                          >
                            <div className={`p-2 rounded-full ${
                              uploadStage === stage
                                ? 'bg-orange-500 text-white'
                                : uploadProgress > (
                                    stage === 'uploading' ? 0 :
                                    stage === 'analyzing' ? 25 :
                                    stage === 'colorizing' ? 40 : 85
                                  )
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-400'
                            }`}>
                              <Icon className="h-3 w-3" />
                            </div>
                            <span className="text-xs font-medium text-gray-600">{label}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 p-4 bg-white/70 rounded-lg border border-orange-100">
                        <div className="flex items-start gap-3">
                          <Loader2 className="h-5 w-5 text-orange-500 animate-spin flex-shrink-0 mt-0.5" />
                          <div className="min-h-[3rem] flex items-center">
                            <p key={currentTip} className="text-sm text-gray-700 leading-relaxed animate-fade-in">
                              {LOADING_TIPS[currentTip]}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="submit"
                      disabled={!uploadFile || isUploading}
                      className="w-full bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700"
                      size="lg"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Colorize Image - Free
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Gallery Section */}
        {completedJobs.length > 0 && (
          <section className="py-8 sm:py-12 bg-white">
            <div className="container mx-auto px-4 max-w-6xl">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">Your Colorized Images</CardTitle>
                      <CardDescription className="text-sm">
                        {completedJobs.length} {completedJobs.length === 1 ? 'image' : 'images'} colorized
                      </CardDescription>
                    </div>
                    {completedJobs.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
                      >
                        {sortBy === 'newest' ? 'Newest' : 'Oldest'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {completedJobs.map((job) => {
                      const active = thumbViewByJob[job.id] || 'colorized';
                      const thumbUrl = getImageUrl(job.id, active === 'colorized' ? 'output' : 'original');
                      return (
                        <div key={job.id} className="group relative rounded-lg overflow-hidden border bg-white hover:shadow-md transition-shadow">
                          <div
                            className="aspect-[4/3] w-full cursor-pointer bg-gray-100 flex items-center justify-center"
                            onClick={() => { setViewerJob(job); setViewerOpen(true); }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={thumbUrl} alt="Preview" className="h-full w-full object-contain" />
                          </div>
                          <div className="absolute top-2 left-2 flex gap-1">
                            <Button
                              size="sm"
                              variant={active === 'original' ? 'default' : 'secondary'}
                              onClick={(e) => { e.stopPropagation(); setThumbViewByJob(prev => ({ ...prev, [job.id]: 'original' })); }}
                              className="text-xs h-7 px-2"
                            >
                              Original
                            </Button>
                            <Button
                              size="sm"
                              variant={active === 'colorized' ? 'default' : 'secondary'}
                              onClick={(e) => { e.stopPropagation(); setThumbViewByJob(prev => ({ ...prev, [job.id]: 'colorized' })); }}
                              className="text-xs h-7 px-2"
                            >
                              Colorized
                            </Button>
                          </div>
                          <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50">
                            <div className="text-xs text-gray-500">
                              {new Date(job.created_at).toLocaleDateString()}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                const url = active === 'colorized' ? getImageUrl(job.id, 'output') : getImageUrl(job.id, 'original');
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `${active}-${job.id}.jpg`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="text-xs h-7 px-2"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Before/After Images Section */}
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">See the magic in action</h2>
              <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto px-4">
                Watch your family's precious memories transform into vibrant, lifelike images
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 sm:gap-12 max-w-8xl mx-auto">
              {/* Before/After Card 1 - Indian Wedding */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="relative">
                  <div className="grid grid-cols-2">
                    <div className="relative">
                      <Image
                        src="/indian wedding original.jpg"
                        alt="Indian wedding photo before colorization"
                        width={400}
                        height={400}
                        className="aspect-square object-cover w-full h-full"
                        loading="lazy"
                        quality={85}
                      />
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        Before
                      </div>
                    </div>
                    <div className="relative">
                      <Image
                        src="/indian wedding colour.jpg"
                        alt="Indian wedding photo after colorization"
                        width={400}
                        height={400}
                        className="aspect-square object-cover w-full h-full"
                        loading="lazy"
                        quality={85}
                      />
                      <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                        After
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <CardContent className="p-8">
                  <h3 className="font-semibold text-gray-900 mb-2">Family Wedding</h3>
                  <p className="text-sm text-gray-600">Traditional Indian wedding photo with vibrant sarees, jewelry, and festive colors</p>
                </CardContent>
              </Card>

              {/* Before/After Card 2 - Grandfather */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="relative">
                  <div className="grid grid-cols-2">
                    <div className="relative">
                      <Image
                        src="/grandfather original.jpg"
                        alt="Grandfather portrait before colorization"
                        width={400}
                        height={400}
                        className="aspect-square object-cover w-full h-full"
                        loading="lazy"
                        quality={85}
                      />
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        Before
                      </div>
                    </div>
                    <div className="relative">
                      <Image
                        src="/grandfather colour.jpg"
                        alt="Grandfather portrait after colorization"
                        width={400}
                        height={400}
                        className="aspect-square object-cover w-full h-full"
                        loading="lazy"
                        quality={85}
                      />
                      <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                        After
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <CardContent className="p-8">
                  <h3 className="font-semibold text-gray-900 mb-2">Grandfather's Portrait</h3>
                  <p className="text-sm text-gray-600">Vintage portrait of an Indian grandfather, restored with lifelike colors</p>
                </CardContent>
              </Card>

              {/* Before/After Card 3 - Festival */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="relative">
                  <div className="grid grid-cols-2">
                    <div className="relative">
                      <Image
                        src="/festival original.jpg"
                        alt="Festival celebration before colorization"
                        width={400}
                        height={400}
                        className="aspect-square object-cover w-full h-full"
                        loading="lazy"
                        quality={85}
                      />
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        Before
                      </div>
                    </div>
                    <div className="relative">
                      <Image
                        src="/festival colour.jpg"
                        alt="Festival celebration after colorization"
                        width={400}
                        height={400}
                        className="aspect-square object-cover w-full h-full"
                        loading="lazy"
                        quality={85}
                      />
                      <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                        After
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <CardContent className="p-8">
                  <h3 className="font-semibold text-gray-900 mb-2">Festival Celebration</h3>
                  <p className="text-sm text-gray-600">Diwali, Holi, or Durga Puja memories with vibrant festival colors and traditions</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Video Demo Section */}
        <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">See ReColor AI in action</h2>
              <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto px-4">
                Watch how our AI brings your family's heritage photos to life in real-time
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden shadow-xl sm:shadow-2xl hover:shadow-2xl sm:hover:shadow-3xl transition-shadow duration-300">
                <iframe
                  src="https://drive.google.com/file/d/1iya9BXxFIkCD3CHc6azrL5A1Pom7_6qu/preview"
                  title="ReColor AI Demo Video - Watch how our AI transforms black and white photos into vibrant memories"
                  className="w-full h-full"
                  loading="lazy"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  data-video-id="1iya9BXxFIkCD3CHc6azrL5A1Pom7_6qu"
                  data-video-title="ReColor AI Demo Video"
                  data-video-description="Watch how our AI transforms black and white photos into vibrant memories"
                />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-red-500 text-white">Demo</Badge>
                </div>
              </div>
              
              {/* CTA Button after video */}
              <div className="flex justify-center mt-8">
                <Button 
                  size="lg" 
                  className="text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4 bg-black text-white hover:bg-gray-800 rounded-xl font-semibold"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Start Colorizing Free
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section - Company Logos */}
        <section className="py-12 sm:py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 sm:mb-12">
              <p className="text-gray-600 text-sm font-medium">Trusted by Indian families and professionals</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap justify-center items-center gap-4 sm:gap-6 lg:gap-8 opacity-60">
              <div className="text-gray-400 font-semibold text-sm sm:text-base lg:text-lg text-center">Wedding Photographers</div>
              <div className="text-gray-400 font-semibold text-sm sm:text-base lg:text-lg text-center">Family Studios</div>
              <div className="text-gray-400 font-semibold text-sm sm:text-base lg:text-lg text-center">Heritage Museums</div>
              <div className="text-gray-400 font-semibold text-sm sm:text-base lg:text-lg text-center">Event Planners</div>
              <div className="text-gray-400 font-semibold text-sm sm:text-base lg:text-lg text-center">Photo Studios</div>
              <div className="text-gray-400 font-semibold text-sm sm:text-base lg:text-lg text-center">Archives</div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Perfect for Indian families</h2>
              <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto px-4">
                Your complete toolkit for preserving family heritage – everything you need in one place.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-center">Indian Heritage Colors</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-gray-600">
                    AI trained on Indian skin tones, traditional clothing colors, and cultural elements for authentic results.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-center">100% Secure</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-gray-600">
                    Your family photos are processed securely in India. No data leaves the country, ensuring complete privacy.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-center">Instant Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-gray-600">
                    Get beautiful colorized photos in seconds. Perfect for busy Indian families and wedding photographers.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>


        {/* Testimonials Section */}
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Loved by Indian families across the country</h2>
              <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto px-4">
                See what our Indian users are saying about ReColor AI
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <Quote className="w-8 h-8 text-gray-300 mb-4" />
                  <p className="text-gray-600 mb-4">
                    "बहुत बढ़िया! My grandmother's wedding photos look so authentic now. The colors are perfect for Indian skin tones."
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                      PS
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Priya Sharma</div>
                      <div className="text-sm text-gray-500">Delhi Wedding Photographer</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <Quote className="w-8 h-8 text-gray-300 mb-4" />
                  <p className="text-gray-600 mb-4">
                    "I've colorized over 200 family photos using ReColor AI. Perfect for our Diwali and wedding albums!"
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                      RK
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Rajesh Kumar</div>
                      <div className="text-sm text-gray-500">Mumbai Family Historian</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <Quote className="w-8 h-8 text-gray-300 mb-4" />
                  <p className="text-gray-600 mb-4">
                    "The privacy-first approach sold me. I can colorize our family's sacred photos without worrying about data security."
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                      AG
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Anita Gupta</div>
                      <div className="text-sm text-gray-500">Bangalore Digital Archivist</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>


        {/* Stats Section */}
        <section className="py-12 sm:py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-4xl mx-auto text-center">
              <div className="space-y-2">
                <div className="text-4xl font-bold text-gray-900">50K+</div>
                <div className="text-gray-600">Photos Colorized</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-gray-900">10K+</div>
                <div className="text-gray-600">Happy Users</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-gray-900">99%</div>
                <div className="text-gray-600">Accuracy Rate</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-gray-900">24/7</div>
                <div className="text-gray-600">Support</div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                Preserve your family's heritage today
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed px-4">
                ReColor AI gives you a way to bring your family's memories to life – fast, accurate, and secure.
                <br className="hidden sm:block" />
                <span className="sm:hidden"> </span>Completely free to use with no sign-up required.
              </p>

              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                  <Button 
                    size="lg" 
                    className="text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-green-600 text-white hover:from-orange-600 hover:to-green-700 rounded-xl font-semibold"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Start Colorizing Now
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-gray-500 px-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span>No sign-up required</span>
                  </div>
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 text-green-500 mr-2" />
                    <span>Privacy-first processing</span>
                  </div>
                  <div className="flex items-center">
                    <Sparkles className="w-4 h-4 text-green-500 mr-2" />
                    <span>Free forever</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Modal Viewer */}
      {viewerJob && (
        <ImageViewer
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          originalImageUrl={getImageUrl(viewerJob.id, 'original')}
          colorizedImageUrl={viewerJob.output_url ? getImageUrl(viewerJob.id, 'output') : undefined}
          jobId={viewerJob.id}
          status={viewerJob.status}
          createdAt={viewerJob.created_at}
        />
      )}
    </>
  );
}


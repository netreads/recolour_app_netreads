"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Image, Download, RefreshCw, Sparkles, AlertCircle, Loader2, Wand2, Palette, CheckCircle2 } from "lucide-react";
import { getSession } from "@/lib/auth-client";
import { ImageViewer } from "@/components/features/ImageViewer";

interface Job {
  id: string;
  original_url: string;
  output_url: string | null;
  status: "pending" | "processing" | "done" | "failed";
  created_at: string;
}

interface User {
  id: string;
  email: string;
  credits: number;
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

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'uploading' | 'analyzing' | 'colorizing' | 'finalizing'>('uploading');
  const [currentTip, setCurrentTip] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  // Only show completed recolor jobs in gallery for a simpler UX
  const [thumbViewByJob, setThumbViewByJob] = useState<Record<string, 'original' | 'colorized'>>({});
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerJob, setViewerJob] = useState<Job | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndFetchJobs();
  }, []);

  // Rotate tips during upload
  useEffect(() => {
    if (!isUploading) return;
    
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 3000);
    
    return () => clearInterval(tipInterval);
  }, [isUploading]);

  const checkAuthAndFetchJobs = async () => {
    try {
      const session = await getSession();
      
      if (session?.user) {
        setIsAuthenticated(true);
        // Set user with credits from session (will be updated by fetchUserData)
        // Ensure email is defined before setting user
        if (session.user.email) {
          setUser({ 
            id: session.user.id, 
            email: session.user.email, 
            credits: 0 
          });
        }
        fetchJobs();
        fetchUserData(); // Fetch fresh user data including credits
        giveWelcomeCredits(); // Give welcome credits if eligible
      } else {
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const getImageUrl = (jobId: string, type: 'original' | 'output'): string => {
    return `/api/image-proxy?jobId=${jobId}&type=${type}`;
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs");
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      // Use the refresh endpoint that bypasses session caching
      const response = await fetch("/api/refresh-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Fallback to regular user endpoint
        const fallbackResponse = await fetch("/api/user");
        if (fallbackResponse.ok) {
          const userData = await fallbackResponse.json();
          setUser(userData);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const giveWelcomeCredits = async () => {
    try {
      const response = await fetch("/api/give-welcome-credits", {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh user data to show updated credits
          fetchUserData();
        }
      }
    } catch (error) {
      console.error("Error giving welcome credits:", error);
    }
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

      // Simulate progress for upload stage
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
        if (uploadResponse.status === 401) {
          throw new Error("Please log in to upload files");
        }
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
        body: JSON.stringify({
          jobId,
        }),
      });

      // Simulate progress for colorizing stage
      const colorizingInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 2, 85));
      }, 200);

      if (!submitResponse.ok) {
        clearInterval(colorizingInterval);
        const errorData = await submitResponse.json();
        
        if (submitResponse.status === 402) {
          throw new Error(`Insufficient Credits: ${errorData.error || "You need more credits to process images."}. Please purchase credits to continue.`);
        }
        
        if (submitResponse.status === 429) {
          throw new Error(`Quota Exceeded: ${errorData.error || "API quota limits reached"}. ${errorData.retryAfter || "Please try again later."}`);
        }
        
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

      // Reset form and refresh jobs and user data
      setUploadFile(null);
      fetchJobs();
      fetchUserData(); // Refresh credits after successful processing
    } catch (error) {
      console.error("Error uploading file:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload file. Please try again.";
      alert(errorMessage);
      
      // If authentication error, redirect to login
      if (errorMessage.includes("log in")) {
        router.push('/login');
      }
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

  const validateFile = (file: File): boolean => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a JPG, PNG, or WebP image');
      return false;
    }
    
    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return false;
    }
    
    return true;
  };

  const completedJobs = jobs
    .filter(job => job.status === 'done' && job.output_url)
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const getStats = () => {
    const total = jobs.length;
    const completed = jobs.filter(job => job.status === 'done').length;
    const processing = jobs.filter(job => job.status === 'processing').length;
    const failed = jobs.filter(job => job.status === 'failed').length;
    
    return { total, completed, processing, failed };
  };


  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (isAuthenticated === false) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Transform your black & white photos with AI colorization
          </p>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to access your dashboard and upload photos.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
        
        {/* Simple Header with Credits */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Colorize your black & white photos with AI</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border">
              <Sparkles className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Credits</p>
                <p className="text-lg font-semibold">{user?.credits || 0}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchUserData}
                className="h-8 w-8 p-0 ml-2"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Simple Stats Bar */}
        {jobs.length > 0 && (
          <div className="flex items-center flex-wrap gap-4 sm:gap-6 text-sm text-gray-600 bg-white px-4 py-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-gray-400" />
              <span>{stats.total} Total</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span>{stats.completed} Completed</span>
            </div>
            {stats.processing > 0 && (
              <>
                <div className="hidden sm:block h-4 w-px bg-gray-200" />
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 text-blue-500 animate-spin" />
                  <span>{stats.processing} Processing</span>
                </div>
              </>
            )}
            {stats.failed > 0 && (
              <>
                <div className="hidden sm:block h-4 w-px bg-gray-200" />
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  <span>{stats.failed} Failed</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Simple Upload Section */}
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
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

              {user && user.credits < 1 ? (
                <div className="flex items-center justify-center">
                  <Button
                    onClick={() => router.push('/pricing')}
                    className="bg-orange-500 hover:bg-orange-600"
                    size="lg"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Buy Credits
                  </Button>
                </div>
              ) : isUploading ? (
                <div className="space-y-4 p-6 bg-gradient-to-br from-orange-50 to-purple-50 border-2 border-orange-200 rounded-lg">
                  {/* Progress Bar */}
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

                  {/* Stage Indicators */}
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

                  {/* Rotating Tips */}
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
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  size="lg"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Colorize Image
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Simple Gallery */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Your Images</CardTitle>
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
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-500">Loading...</p>
                </div>
              </div>
            ) : completedJobs.length === 0 ? (
              <div className="text-center py-12">
                <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base font-medium text-gray-900 mb-1">No images yet</h3>
                <p className="text-sm text-gray-500">
                  Upload a black & white image to get started
                </p>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>

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
      </div>
    </div>
  );
}



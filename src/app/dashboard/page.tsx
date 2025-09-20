"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Image, CheckCircle, XCircle, Download, RefreshCw, Plus, SortAsc, Sparkles, Zap, TrendingUp } from "lucide-react";
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


export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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

  const checkAuthAndFetchJobs = async () => {
    try {
      const session = await getSession();
      
      if (session?.user) {
        setIsAuthenticated(true);
        // Set user with credits from session (will be updated by fetchUserData)
        setUser({ ...session.user, credits: 0 });
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
        console.log("User data refreshed:", userData);
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
          console.log(data.message);
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

    try {
      // Try server-side upload first (bypasses SSL issues)
      const formData = new FormData();
      formData.append('file', uploadFile);

      const uploadResponse = await fetch("/api/upload-via-presigned", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        if (uploadResponse.status === 401) {
          throw new Error("Please log in to upload files");
        }
        throw new Error("Failed to upload file");
      }

      const { jobId } = await uploadResponse.json();
      console.log("Upload successful via server-side API, jobId:", jobId);

      // Submit job for processing
      const submitResponse = await fetch("/api/submit-job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
        }),
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        
        if (submitResponse.status === 402) {
          // Insufficient credits
          throw new Error(`Insufficient Credits: ${errorData.error || "You need more credits to process images."}. Please purchase credits to continue.`);
        }
        
        if (submitResponse.status === 429) {
          throw new Error(`Quota Exceeded: ${errorData.error || "API quota limits reached"}. ${errorData.retryAfter || "Please try again later."}`);
        }
        
        throw new Error(errorData.error || "Failed to submit job");
      }

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
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Enhanced Header */}
        <div className="text-center space-y-4 sm:space-y-6 max-w-5xl mx-auto">
          <div className="space-y-4 sm:space-y-6">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-orange-500 to-green-600 rounded-xl mb-2 sm:mb-4">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
              Welcome to
              <br />
              <span className="bg-gradient-to-r from-orange-500 to-green-600 bg-clip-text text-transparent">
                ReColor AI
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
              Transform your black & white photos into vibrant, colorized masterpieces using advanced AI technology.
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>Perfect for preserving your family's precious memories.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Credits</p>
                  <p className="text-lg sm:text-2xl font-bold">{user?.credits || 0}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchUserData}
                  className="ml-1 sm:ml-2 h-6 w-6 sm:h-8 sm:w-8 p-0"
                >
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                  <Image className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Images</p>
                  <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-lg sm:text-2xl font-bold">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg">
                  <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Processing</p>
                  <p className="text-lg sm:text-2xl font-bold">{stats.processing}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Failed</p>
                  <p className="text-lg sm:text-2xl font-bold">{stats.failed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Upload Section */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
          <CardHeader className="text-center pb-4 px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl flex items-center justify-center">
              <Zap className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              Upload New Photo
            </CardTitle>
            <CardDescription className="text-sm sm:text-base px-4">
              Drag & drop or click to select a black & white image for AI colorization
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleFileUpload} className="space-y-4 sm:space-y-6">
              {/* Drag & Drop Area */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-4 sm:p-8 text-center transition-all duration-200 ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
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
                  <div className="space-y-3 sm:space-y-4">
                    <div className="relative w-full max-w-xs sm:max-w-sm mx-auto">
                      <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden shadow-lg">
                        <img
                          src={URL.createObjectURL(uploadFile)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <p className="font-medium text-foreground text-sm sm:text-base truncate">{uploadFile.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
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
                      className="text-xs sm:text-sm"
                    >
                      Choose Different File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                      <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <p className="text-base sm:text-lg font-medium">Drop your image here</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        or click to browse files
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm sm:text-base"
                    >
                      <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Select Image
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Supports JPG, PNG, WebP up to 10MB
                    </p>
                  </div>
                )}
              </div>

              {user && user.credits < 1 ? (
                <div className="space-y-3 sm:space-y-4">
                  <div className="text-center p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 font-medium text-sm sm:text-base">No credits remaining</p>
                    <p className="text-yellow-600 text-xs sm:text-sm">Purchase credits to continue colorizing images</p>
                  </div>
                  <Button
                    type="button"
                    className="w-full bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white font-semibold py-2.5 sm:py-3 rounded-xl text-sm sm:text-base"
                    size="lg"
                    onClick={() => router.push('/pricing')}
                  >
                    <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Buy Credits
                  </Button>
                </div>
              ) : (
                <Button
                  type="submit"
                  disabled={!uploadFile || isUploading}
                  className="w-full bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white font-semibold py-2.5 sm:py-3 rounded-xl text-sm sm:text-base"
                  size="lg"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      Processing Your Image...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Colorize with AI
                    </>
                  )}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Gallery - Only completed recolored images */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
          <CardHeader className="px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl flex items-center">
                  <TrendingUp className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  Your Gallery (Recolored)
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Only completed AI recolors are shown here for a clean, focused view
                </CardDescription>
              </div>
              {jobs.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
                    className="text-xs sm:text-sm"
                  >
                    <SortAsc className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    {sortBy === 'newest' ? 'Newest First' : 'Oldest First'}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 sm:py-12">
                <div className="text-center space-y-3 sm:space-y-4">
                  <RefreshCw className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-blue-600 mx-auto" />
                  <p className="text-muted-foreground text-sm sm:text-base">Loading your gallery...</p>
                </div>
              </div>
            ) : completedJobs.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="mx-auto w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                  <Image className="h-8 w-8 sm:h-12 sm:w-12 text-blue-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">No recolored images yet</h3>
                <p className="text-muted-foreground mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base px-4">
                  Upload a black & white image to generate your first AI recolor.
                </p>
               
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {completedJobs.map((job) => {
                  const active = thumbViewByJob[job.id] || 'colorized';
                  const thumbUrl = getImageUrl(job.id, active === 'colorized' ? 'output' : 'original');
                  return (
                    <div key={job.id} className="group relative rounded-xl overflow-hidden border bg-white shadow-sm">
                      <div
                        className="aspect-[4/3] w-full cursor-zoom-in bg-muted"
                        onClick={() => { setViewerJob(job); setViewerOpen(true); }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumbUrl} alt="Recolored preview" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.01]" />
                      </div>
                      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex gap-1 sm:gap-2">
                        <Button
                          size="sm"
                          variant={active === 'original' ? 'default' : 'outline'}
                          onClick={(e) => { e.stopPropagation(); setThumbViewByJob(prev => ({ ...prev, [job.id]: 'original' })); }}
                          className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                        >
                          Original
                        </Button>
                        <Button
                          size="sm"
                          variant={active === 'colorized' ? 'default' : 'outline'}
                          onClick={(e) => { e.stopPropagation(); setThumbViewByJob(prev => ({ ...prev, [job.id]: 'colorized' })); }}
                          className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                        >
                          Colorized
                        </Button>
                      </div>
                      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3">
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          {new Date(job.created_at).toLocaleString()}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
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
                          className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                        >
                          <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          Download
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



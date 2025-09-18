"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Upload, Image, Clock, CheckCircle, XCircle, Download, RefreshCw, Plus, Filter, SortAsc, Sparkles, Zap, TrendingUp, Users } from "lucide-react";
import { getSession } from "@/lib/auth-client";
import { ImageCard } from "@/components/features/ImageCard";

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
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'processing' | 'done' | 'failed'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndFetchJobs();
  }, []);

  const checkAuthAndFetchJobs = async () => {
    try {
      const session = await getSession();
      if (session?.data?.user) {
        setIsAuthenticated(true);
        // Set user with credits from session (will be updated by fetchUserData)
        setUser({ ...session.data.user, credits: 0 });
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
      const response = await fetch("/api/user");
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
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

  const filteredAndSortedJobs = jobs
    .filter(job => filterStatus === 'all' || job.status === filterStatus)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Enhanced Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to ReColor AI
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transform your black & white photos into vibrant, colorized masterpieces using advanced AI technology
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Credits</p>
                  <p className="text-2xl font-bold">{user?.credits || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Image className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Images</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <RefreshCw className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Processing</p>
                  <p className="text-2xl font-bold">{stats.processing}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold">{stats.failed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Upload Section */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl flex items-center justify-center">
              <Zap className="mr-3 h-6 w-6 text-blue-600" />
              Upload New Photo
            </CardTitle>
            <CardDescription className="text-base">
              Drag & drop or click to select a black & white image for AI colorization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFileUpload} className="space-y-6">
              {/* Drag & Drop Area */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
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
                  <div className="space-y-4">
                    <div className="relative w-full max-w-sm mx-auto">
                      <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden shadow-lg">
                        <img
                          src={URL.createObjectURL(uploadFile)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium text-foreground">{uploadFile.name}</p>
                      <p className="text-sm text-muted-foreground">
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
                      className="text-sm"
                    >
                      Choose Different File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                      <Upload className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-medium">Drop your image here</p>
                      <p className="text-sm text-muted-foreground">
                        or click to browse files
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Select Image
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Supports JPG, PNG, WebP up to 10MB
                    </p>
                  </div>
                )}
              </div>

              {user && user.credits < 1 ? (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 font-medium">No credits remaining</p>
                    <p className="text-yellow-600 text-sm">Purchase credits to continue colorizing images</p>
                  </div>
                  <Button
                    type="button"
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3"
                    size="lg"
                    onClick={() => router.push('/pricing')}
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Buy Credits
                  </Button>
                </div>
              ) : (
                <Button
                  type="submit"
                  disabled={!uploadFile || isUploading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3"
                  size="lg"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                      Processing Your Image...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Colorize with AI
                    </>
                  )}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Enhanced Jobs Section */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl flex items-center">
                  <TrendingUp className="mr-3 h-6 w-6 text-green-600" />
                  Your Gallery
                </CardTitle>
                <CardDescription className="text-base">
                  View and manage your colorized images
                </CardDescription>
              </div>
              
              {jobs.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
                  >
                    <SortAsc className="mr-2 h-4 w-4" />
                    {sortBy === 'newest' ? 'Newest First' : 'Oldest First'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilterStatus(filterStatus === 'all' ? 'done' : 'all')}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    {filterStatus === 'all' ? 'Show Completed' : 'Show All'}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
                  <p className="text-muted-foreground">Loading your gallery...</p>
                </div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                  <Image className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No photos yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Upload your first black & white image to see the magic of AI colorization!
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Your First Image
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {filteredAndSortedJobs.map((job) => (
                  <ImageCard
                    key={job.id}
                    job={job}
                    getImageUrl={getImageUrl}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



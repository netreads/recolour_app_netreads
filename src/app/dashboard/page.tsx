"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Upload, Image, Clock, CheckCircle, XCircle, Download, RefreshCw } from "lucide-react";
import { getSession } from "@/lib/auth-client";
import { ImageCard } from "@/components/features/ImageCard";

interface Job {
  id: string;
  original_url: string;
  output_url: string | null;
  status: "pending" | "processing" | "done" | "failed";
  created_at: string;
}


export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndFetchJobs();
  }, []);

  const checkAuthAndFetchJobs = async () => {
    try {
      const session = await getSession();
      if (session?.data?.user) {
        setIsAuthenticated(true);
        fetchJobs();
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
        
        if (submitResponse.status === 429) {
          throw new Error(`Quota Exceeded: ${errorData.error || "API quota limits reached"}. ${errorData.retryAfter || "Please try again later."}`);
        }
        
        throw new Error(errorData.error || "Failed to submit job");
      }

      // Reset form and refresh jobs
      setUploadFile(null);
      fetchJobs();
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

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Transform your black & white photos with AI colorization
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            Upload New Photo
          </CardTitle>
          <CardDescription>
            Choose a black & white image to colorize with AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFileUpload} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="file">Image File</Label>
              <Input
                type="file"
                id="file"
                accept="image/*"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
                required
              />
              <p className="text-sm text-muted-foreground">
                Supports JPG, PNG, and other common image formats
              </p>
            </div>
            
            {uploadFile && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="relative w-full max-w-md">
                  <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(uploadFile)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    File: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={!uploadFile || isUploading}
              className="w-full sm:w-auto"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Process
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Jobs Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Image className="mr-2 h-5 w-5" />
            Your Photos
          </CardTitle>
          <CardDescription>
            View and manage your colorized images
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading...</span>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8">
              <Image className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No photos uploaded yet.</p>
              <p className="text-sm text-muted-foreground">
                Upload your first image to get started!
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
              {jobs.map((job) => (
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
  );
}



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
  const router = useRouter();

  useEffect(() => {
    fetchJobs();
  }, []);

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
      // Get upload URL
      const uploadResponse = await fetch("/api/get-upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: uploadFile.name,
        }),
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl, jobId } = await uploadResponse.json();

      // Upload file to R2
      const fileUploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: uploadFile,
        headers: {
          "Content-Type": uploadFile.type,
        },
      });

      if (!fileUploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

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
        throw new Error("Failed to submit job");
      }

      // Reset form and refresh jobs
      setUploadFile(null);
      fetchJobs();
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: Job["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "processing":
        return <Badge variant="default"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Processing</Badge>;
      case "done":
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

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
                <div className="relative w-full max-w-xs">
                  <img
                    src={URL.createObjectURL(uploadFile)}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-md border"
                  />
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <Card key={job.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="space-y-4 p-4">
                      <div className="flex items-center justify-between">
                        {getStatusBadge(job.status)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(job.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">
                            Original
                          </Label>
                          <img
                            src={job.original_url}
                            alt="Original"
                            className="w-full h-32 object-cover rounded-md border"
                          />
                        </div>
                        
                        {job.output_url && (
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">
                              Colorized
                            </Label>
                            <img
                              src={job.output_url}
                              alt="Colorized"
                              className="w-full h-32 object-cover rounded-md border"
                            />
                          </div>
                        )}
                        
                        {job.status === "processing" && (
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">
                              Processing...
                            </Label>
                            <Progress value={65} className="h-2" />
                          </div>
                        )}
                        
                        {job.output_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => window.open(job.output_url!, '_blank')}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ImageCard } from "@/components/ImageCard";
import UploadForm from "@/components/UploadForm";
import { 
  Download, 
  Share2, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle,
  Clock,
  XCircle,
  Upload
} from "lucide-react";

interface Job {
  id: string;
  original_url: string;
  output_url: string | null;
  status: "pending" | "processing" | "done" | "failed";
  created_at: string;
}

function RecolorPageContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams?.get('jobId');
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (jobId) {
      fetchJob();
      // Poll for updates if job is still processing
      const interval = setInterval(() => {
        if (job?.status === "processing" || job?.status === "pending") {
          fetchJob();
        }
      }, 3000);
      return () => clearInterval(interval);
    } else {
      setIsLoading(false);
    }
  }, [jobId, job?.status]);

  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setJob(data.job);
      } else {
        setError("Job not found");
      }
    } catch (error) {
      console.error("Error fetching job:", error);
      setError("Failed to fetch job details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (job?.output_url) {
      window.open(job.output_url, '_blank');
    }
  };

  const handleShare = async () => {
    if (job?.output_url && navigator.share) {
      try {
        await navigator.share({
          title: 'My Colorized Photo',
          text: 'Check out this amazing colorized photo created with ReColor AI!',
          url: job.output_url,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  const getStatusIcon = (status: Job["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "processing":
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case "done":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!jobId || !job) {
    return (
      <div className="container mx-auto px-4 py-16 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">AI Photo Colorization</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Transform your black & white photos into vibrant, colorized memories. 
            Upload an image below to get started.
          </p>
        </div>
        <UploadForm />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        
        <div className="flex items-center space-x-2">
          {getStatusIcon(job.status)}
          <span className="text-sm font-medium capitalize">{job.status}</span>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Colorization Progress</span>
            <Badge variant={job.status === "done" ? "default" : "secondary"}>
              {job.status === "done" ? "Completed" : job.status}
            </Badge>
          </CardTitle>
          <CardDescription>
            Job ID: {job.id} • Created {new Date(job.created_at).toLocaleString()}
          </CardDescription>
        </CardHeader>
        
        {job.status === "processing" && (
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing your image...</span>
                <span>75%</span>
              </div>
              <Progress value={75} className="w-full" />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Images Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Original Image */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Original</h2>
          <ImageCard
            src={job.original_url}
            alt="Original black and white photo"
            title="Original Photo"
            subtitle="Your uploaded black & white image"
          />
        </div>

        {/* Colorized Result */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Colorized Result</h2>
          {job.output_url ? (
            <ImageCard
              src={job.output_url}
              alt="AI colorized photo"
              title="Colorized Photo"
              subtitle="AI-enhanced with realistic colors"
              status="completed"
              showActions={true}
              onDownload={handleDownload}
              onShare={handleShare}
            />
          ) : (
            <Card className="h-64 flex items-center justify-center border-dashed">
              <div className="text-center space-y-2">
                {job.status === "processing" ? (
                  <>
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">AI is working on your image...</p>
                  </>
                ) : job.status === "failed" ? (
                  <>
                    <XCircle className="h-8 w-8 text-red-500 mx-auto" />
                    <p className="text-red-600">Processing failed. Please try again.</p>
                  </>
                ) : (
                  <>
                    <Clock className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">Waiting to start processing...</p>
                  </>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {job.status === "done" && job.output_url && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download High-Res
              </Button>
              <Button size="lg" variant="outline" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share Result
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/recolor">
                  <Upload className="mr-2 h-4 w-4" />
                  Colorize Another
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function RecolorPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading...</span>
        </div>
      </div>
    }>
      <RecolorPageContent />
    </Suspense>
  );
}



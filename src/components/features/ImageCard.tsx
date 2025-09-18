"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Download, Eye, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { ImageViewer } from "./ImageViewer";

interface Job {
  id: string;
  original_url: string;
  output_url: string | null;
  status: "pending" | "processing" | "done" | "failed";
  created_at: string;
}

interface ImageCardProps {
  job: Job;
  getImageUrl: (jobId: string, type: 'original' | 'output') => string;
}

export function ImageCard({ job, getImageUrl }: ImageCardProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [imageError, setImageError] = useState({ original: false, output: false });

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

  const handleImageError = (type: 'original' | 'output') => {
    setImageError(prev => ({ ...prev, [type]: true }));
  };

  const handleDownload = (type: 'original' | 'output') => {
    const link = document.createElement('a');
    link.href = getImageUrl(job.id, type);
    link.download = `${type}-${job.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openViewer = () => {
    setIsViewerOpen(true);
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm group">
        <CardContent className="p-0">
          <div className="space-y-4 p-6">
            {/* Enhanced Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusBadge(job.status)}
                <div className="text-xs text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                  {new Date(job.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={openViewer}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Images Grid */}
            <div className="space-y-6">
              {/* Original Image */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Original Image
                  </Label>
                </div>
                <div className="relative group">
                  <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl overflow-hidden shadow-lg">
                    {!imageError.original ? (
                      <img
                        src={getImageUrl(job.id, 'original')}
                        alt="Original"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={() => handleImageError('original')}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <div className="text-3xl mb-2">📷</div>
                          <div className="text-sm">Image not available</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={openViewer}
                      className="shadow-lg backdrop-blur-sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Full Size
                    </Button>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload('original')}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Original
                </Button>
              </div>

              {/* Colorized Image */}
              {job.output_url && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      AI Colorized Result
                    </Label>
                  </div>
                  <div className="relative group">
                    <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-xl overflow-hidden shadow-lg ring-2 ring-blue-200 dark:ring-blue-800">
                      {!imageError.output ? (
                        <img
                          src={getImageUrl(job.id, 'output')}
                          alt="Colorized"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={() => handleImageError('output')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center text-muted-foreground">
                            <div className="text-3xl mb-2">🎨</div>
                            <div className="text-sm">Result not available</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={openViewer}
                        className="shadow-lg backdrop-blur-sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Full Size
                      </Button>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload('output')}
                    className="w-full bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200 dark:border-blue-800"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Result
                  </Button>
                </div>
              )}

              {/* Processing State */}
              {job.status === "processing" && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      AI Processing
                    </Label>
                  </div>
                  <div className="space-y-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                    <Progress value={65} className="h-3 bg-yellow-100 dark:bg-yellow-900/30" />
                    <div className="text-center space-y-1">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        AI is analyzing your image...
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        This usually takes 30-60 seconds
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Failed State */}
              {job.status === "failed" && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Processing Failed
                    </Label>
                  </div>
                  <div className="text-center py-6 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <div className="text-3xl mb-3">❌</div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                      Processing failed
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Please try uploading again
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Viewer Modal */}
      <ImageViewer
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        originalImageUrl={getImageUrl(job.id, 'original')}
        colorizedImageUrl={job.output_url ? getImageUrl(job.id, 'output') : undefined}
        jobId={job.id}
        status={job.status}
        createdAt={job.created_at}
      />
    </>
  );
}

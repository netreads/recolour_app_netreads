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
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-0">
          <div className="space-y-4 p-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              {getStatusBadge(job.status)}
              <span className="text-xs text-muted-foreground">
                {new Date(job.created_at).toLocaleDateString()}
              </span>
            </div>
            
            {/* Images Grid */}
            <div className="grid grid-cols-1 gap-4">
              {/* Original Image */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Original Image
                </Label>
                <div className="relative group">
                  <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                    {!imageError.original ? (
                      <img
                        src={getImageUrl(job.id, 'original')}
                        alt="Original"
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        onError={() => handleImageError('original')}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <div className="text-center text-muted-foreground">
                          <div className="text-2xl mb-2">📷</div>
                          <div className="text-sm">Image not available</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={openViewer}
                      className="shadow-lg"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Full Size
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload('original')}
                    className="flex-1"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download Original
                  </Button>
                </div>
              </div>

              {/* Colorized Image */}
              {job.output_url && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Colorized Result
                  </Label>
                  <div className="relative group">
                    <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                      {!imageError.output ? (
                        <img
                          src={getImageUrl(job.id, 'output')}
                          alt="Colorized"
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          onError={() => handleImageError('output')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <div className="text-center text-muted-foreground">
                            <div className="text-2xl mb-2">🎨</div>
                            <div className="text-sm">Result not available</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={openViewer}
                        className="shadow-lg"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Full Size
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload('output')}
                      className="flex-1"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download Result
                    </Button>
                  </div>
                </div>
              )}

              {/* Processing State */}
              {job.status === "processing" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Processing Status
                  </Label>
                  <div className="space-y-2">
                    <Progress value={65} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      AI is analyzing and colorizing your image...
                    </p>
                  </div>
                </div>
              )}

              {/* Failed State */}
              {job.status === "failed" && (
                <div className="text-center py-4">
                  <div className="text-2xl mb-2">❌</div>
                  <p className="text-sm text-muted-foreground">
                    Processing failed. Please try uploading again.
                  </p>
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

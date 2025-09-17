"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, X } from "lucide-react";

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  originalImageUrl: string;
  colorizedImageUrl?: string;
  jobId: string;
  status: "pending" | "processing" | "done" | "failed";
  createdAt: string;
}

export function ImageViewer({
  isOpen,
  onClose,
  originalImageUrl,
  colorizedImageUrl,
  jobId,
  status,
  createdAt,
}: ImageViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeImage, setActiveImage] = useState<'original' | 'colorized'>('original');
  const [imageLoaded, setImageLoaded] = useState(false);

  const resetView = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleDownload = () => {
    const url = activeImage === 'original' ? originalImageUrl : colorizedImageUrl;
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activeImage}-${jobId}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "processing":
        return <Badge variant="default">Processing</Badge>;
      case "done":
        return <Badge variant="default" className="bg-green-600">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  useEffect(() => {
    if (isOpen) {
      resetView();
      setImageLoaded(false);
    }
  }, [isOpen]);

  const currentImageUrl = activeImage === 'original' ? originalImageUrl : colorizedImageUrl;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`max-w-7xl w-full h-[90vh] p-0 ${isFullscreen ? 'max-w-none h-screen' : ''}`}
        showCloseButton={false}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <DialogTitle className="text-xl font-semibold">
                  Image Viewer
                </DialogTitle>
                {getStatusBadge(status)}
                <span className="text-sm text-muted-foreground">
                  {new Date(createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Image Tabs */}
          <div className="flex-shrink-0 px-6 py-4 border-b">
            <div className="flex gap-2">
              <Button
                variant={activeImage === 'original' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveImage('original')}
              >
                Original
              </Button>
              {colorizedImageUrl && (
                <Button
                  variant={activeImage === 'colorized' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveImage('colorized')}
                >
                  Colorized
                </Button>
              )}
            </div>
          </div>

          {/* Image Container */}
          <div className="flex-1 relative overflow-hidden bg-muted/20">
            {currentImageUrl && (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div
                  className="relative transition-transform duration-200 ease-in-out"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  }}
                >
                  <img
                    src={currentImageUrl}
                    alt={activeImage}
                    className={`max-w-full max-h-full object-contain rounded-lg shadow-lg transition-opacity duration-200 ${
                      imageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageLoaded(true)}
                  />
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex-shrink-0 p-6 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.1}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 5}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetView}
                >
                  Reset
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                {currentImageUrl && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

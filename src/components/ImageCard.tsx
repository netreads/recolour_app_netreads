"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import { useState } from "react";

interface ImageCardProps {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  status?: "completed" | "processing" | "pending" | "failed";
  showActions?: boolean;
  onDownload?: () => void;
  onShare?: () => void;
}

export function ImageCard({
  src,
  alt,
  title,
  subtitle,
  status = "completed",
  showActions = false,
  onDownload,
  onShare,
}: ImageCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoaded(false);
    setImageError(true);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-square bg-gray-100">
          {imageError ? (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <div className="text-center text-gray-500">
                <p className="text-sm">Failed to load image</p>
              </div>
            </div>
          ) : (
            <>
              <img
                src={src}
                alt={alt}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-gray-600"></div>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          
          {showActions && status === "completed" && (
            <div className="flex gap-2 pt-2">
              {onDownload && (
                <Button size="sm" variant="outline" onClick={onDownload}>
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              )}
              {onShare && (
                <Button size="sm" variant="outline" onClick={onShare}>
                  <Share2 className="h-3 w-3 mr-1" />
                  Share
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

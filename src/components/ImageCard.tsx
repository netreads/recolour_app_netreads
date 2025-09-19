"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ImageCardStatus = "idle" | "completed" | "processing" | "failed";

interface ImageCardProps {
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
  status?: ImageCardStatus;
  showActions?: boolean;
  onDownload?: () => void;
  onShare?: () => void;
  className?: string;
}

export function ImageCard({
  src,
  alt,
  title,
  subtitle,
  status = "idle",
  showActions = false,
  onDownload,
  onShare,
  className,
}: ImageCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0">
        {title || subtitle ? (
          <div className="px-4 pt-4">
            {title && (
              <h3 className="text-base font-semibold leading-none tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
        ) : null}

        <div className="p-4">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="h-full w-full object-cover"
            />
          </div>

          {showActions && (
            <div className="mt-4 flex items-center gap-2">
              <Button size="sm" onClick={onDownload} disabled={!onDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onShare}
                disabled={!onShare}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              {status === "completed" && (
                <span className="ml-auto text-xs text-muted-foreground">
                  Ready
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ImageCard;



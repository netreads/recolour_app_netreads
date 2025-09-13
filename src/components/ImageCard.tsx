import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, Share2 } from "lucide-react";

type ImageCardProps = {
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
  status?: "processing" | "completed" | "failed";
  onDownload?: () => void;
  onView?: () => void;
  onShare?: () => void;
  showActions?: boolean;
};

export function ImageCard({ 
  src, 
  alt, 
  title, 
  subtitle, 
  status,
  onDownload,
  onView,
  onShare,
  showActions = false
}: ImageCardProps) {
  const getStatusBadge = () => {
    if (!status) return null;
    
    switch (status) {
      case "processing":
        return <Badge variant="secondary">Processing</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-green-600">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="relative">
        <img 
          src={src} 
          alt={alt} 
          className="w-full h-48 object-cover" 
        />
        {status && (
          <div className="absolute top-2 right-2">
            {getStatusBadge()}
          </div>
        )}
      </div>
      
      {(title || subtitle || showActions) && (
        <CardContent className="p-4">
          {(title || subtitle) && (
            <div className="space-y-1 mb-4">
              {title && <CardTitle className="text-base">{title}</CardTitle>}
              {subtitle && <CardDescription>{subtitle}</CardDescription>}
            </div>
          )}
          
          {showActions && (
            <div className="flex items-center space-x-2">
              {onView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onView}
                  className="flex-1"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
              )}
              {onDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownload}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              )}
              {onShare && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShare}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}



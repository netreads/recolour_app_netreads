"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, X, Move, Eye, EyeOff, Info, ArrowLeft, ArrowRight } from "lucide-react";

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
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [showComparison, setShowComparison] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; distance: number } | null>(null);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const resetView = () => {
    setZoom(1);
    setRotation(0);
    setImagePosition({ x: 0, y: 0 });
    setIsDragging(false);
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

  // Mouse wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
  }, []);

  // Mouse drag for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        if (colorizedImageUrl) {
          setActiveImage(activeImage === 'original' ? 'colorized' : 'original');
        }
        break;
      case 'ArrowRight':
        if (colorizedImageUrl) {
          setActiveImage(activeImage === 'original' ? 'colorized' : 'original');
        }
        break;
      case ' ':
        e.preventDefault();
        if (colorizedImageUrl) {
          setShowComparison(!showComparison);
        }
        break;
      case 'r':
        handleRotate();
        break;
      case 'f':
        toggleFullscreen();
        break;
      case '=':
      case '+':
        handleZoomIn();
        break;
      case '-':
        handleZoomOut();
        break;
      case '0':
        resetView();
        break;
    }
  }, [isOpen, onClose, colorizedImageUrl, activeImage, showComparison]);

  // Image load handler
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageLoaded(true);
    setImageError(false);
    const img = e.currentTarget;
    setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
  };

  const handleImageError = () => {
    setImageLoaded(true);
    setImageError(true);
  };

  // Touch handlers for mobile
  const getDistance = (touches: TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - start panning
      if (zoom > 1) {
        setIsDragging(true);
        setDragStart({ x: e.touches[0].clientX - imagePosition.x, y: e.touches[0].clientY - imagePosition.y });
      }
    } else if (e.touches.length === 2) {
      // Two touches - start pinch zoom
      const distance = getDistance(e.touches);
      setTouchStart({
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        distance,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1 && isDragging && zoom > 1) {
      // Single touch panning
      setImagePosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    } else if (e.touches.length === 2 && touchStart) {
      // Two touch pinch zoom
      const distance = getDistance(e.touches);
      const scale = distance / touchStart.distance;
      setZoom(prev => Math.max(0.1, Math.min(5, prev * scale)));
      
      // Update touch start for next move
      setTouchStart({
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        distance,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchStart(null);
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
      setImageError(false);
      setShowComparison(false);
      setShowMetadata(false);
    }
  }, [isOpen]);

  // Add event listeners for keyboard and wheel
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      const container = containerRef.current;
      if (container) {
        container.addEventListener('wheel', handleWheel, { passive: false });
      }
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        if (container) {
          container.removeEventListener('wheel', handleWheel);
        }
      };
    }
  }, [isOpen, handleKeyDown, handleWheel]);

  const currentImageUrl = activeImage === 'original' ? originalImageUrl : colorizedImageUrl;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`max-w-7xl w-full h-[90vh] p-0 sm:h-[90vh] ${isFullscreen ? 'max-w-none h-screen' : ''}`}
        showCloseButton={false}
      >
        <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          {/* Enhanced Header */}
          <DialogHeader className="flex-shrink-0 p-4 sm:p-6 pb-4 border-b bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <DialogTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  Image Viewer
                </DialogTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(status)}
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {new Date(createdAt).toLocaleDateString()}
                  </span>
                  {imageDimensions && (
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {imageDimensions.width} × {imageDimensions.height}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {colorizedImageUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowComparison(!showComparison)}
                    className={`${showComparison ? "bg-blue-50 border-blue-200" : ""} text-xs sm:text-sm`}
                  >
                    {showComparison ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="hidden sm:inline ml-1">{showComparison ? "Hide" : "Compare"}</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMetadata(!showMetadata)}
                  className="text-xs sm:text-sm"
                >
                  <Info className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-xs sm:text-sm"
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="text-xs sm:text-sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Enhanced Image Tabs */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b bg-white/60 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex gap-2">
                <Button
                  variant={activeImage === 'original' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveImage('original')}
                  className="flex items-center gap-2 text-xs sm:text-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Original
                </Button>
                {colorizedImageUrl && (
                  <Button
                    variant={activeImage === 'colorized' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveImage('colorized')}
                    className="flex items-center gap-2 text-xs sm:text-sm"
                  >
                    <ArrowRight className="h-4 w-4" />
                    Colorized
                  </Button>
                )}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                Use arrow keys to switch between images • Space for comparison • Mouse wheel to zoom
              </div>
              <div className="text-xs text-muted-foreground sm:hidden">
                Touch to pan • Pinch to zoom • Tap buttons to switch
              </div>
            </div>
          </div>

          {/* Enhanced Image Container */}
          <div 
            ref={containerRef}
            className="flex-1 relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            {currentImageUrl && (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                {showComparison && colorizedImageUrl ? (
                  // Comparison Slider
                  <div className="relative w-full h-full max-w-4xl max-h-full">
                    <div className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl">
                      {/* Original Image */}
                      <div className="absolute inset-0">
                        <img
                          ref={imageRef}
                          src={originalImageUrl}
                          alt="Original"
                          className="w-full h-full object-contain"
                          onLoad={handleImageLoad}
                          onError={handleImageError}
                        />
                      </div>
                      {/* Colorized Image with clip-path */}
                      <div 
                        className="absolute inset-0 transition-all duration-300"
                        style={{
                          clipPath: `inset(0 ${100 - 50}% 0 0)`,
                        }}
                      >
                        <img
                          src={colorizedImageUrl}
                          alt="Colorized"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      {/* Slider Line */}
                      <div className="absolute top-0 bottom-0 w-1 bg-white shadow-lg left-1/2 transform -translate-x-1/2 z-10">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                          <Move className="h-4 w-4 text-gray-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Single Image View
                  <div
                    className="relative transition-transform duration-200 ease-in-out"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                    }}
                  >
                    {imageError ? (
                      <div className="flex flex-col items-center justify-center w-96 h-96 bg-red-50 border-2 border-red-200 rounded-lg">
                        <X className="h-12 w-12 text-red-400 mb-4" />
                        <p className="text-red-600 font-medium">Failed to load image</p>
                        <p className="text-red-500 text-sm mt-2">Please try refreshing or check your connection</p>
                      </div>
                    ) : (
                      <>
                        <img
                          ref={imageRef}
                          src={currentImageUrl}
                          alt={activeImage}
                          className={`max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${
                            imageLoaded ? 'opacity-100' : 'opacity-0'
                          }`}
                          onLoad={handleImageLoad}
                          onError={handleImageError}
                          draggable={false}
                        />
                        {!imageLoaded && !imageError && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg">
                            <div className="text-center space-y-4">
                              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                              <p className="text-gray-600 font-medium">Loading image...</p>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Metadata Overlay */}
            {showMetadata && imageDimensions && (
              <div className="absolute top-4 right-4 bg-black/80 text-white p-4 rounded-lg backdrop-blur-sm">
                <h4 className="font-semibold mb-2">Image Details</h4>
                <div className="space-y-1 text-sm">
                  <p>Dimensions: {imageDimensions.width} × {imageDimensions.height}</p>
                  <p>Zoom: {Math.round(zoom * 100)}%</p>
                  <p>Rotation: {rotation}°</p>
                  <p>Type: {activeImage}</p>
                  <p>Status: {status}</p>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Controls */}
          <div className="flex-shrink-0 p-4 sm:p-6 pt-4 border-t bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Zoom Controls */}
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.1}
                    className="h-8 w-8 p-0"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[4rem] text-center px-2">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={zoom >= 5}
                    className="h-8 w-8 p-0"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Action Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRotate}
                    className="flex items-center gap-2 text-xs sm:text-sm"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="hidden sm:inline">Rotate</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetView}
                    className="flex items-center gap-2 text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Reset View</span>
                    <span className="sm:hidden">Reset</span>
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {currentImageUrl && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleDownload}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs sm:text-sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>
            </div>
            
            {/* Keyboard Shortcuts Help */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-muted-foreground">
                <span><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Esc</kbd> Close</span>
                <span><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">←→</kbd> Switch</span>
                <span><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Space</kbd> Compare</span>
                <span><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">R</kbd> Rotate</span>
                <span><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">F</kbd> Fullscreen</span>
                <span><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">+/-</kbd> Zoom</span>
                <span><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">0</kbd> Reset</span>
                <span className="hidden sm:inline"><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Wheel</kbd> Zoom</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
  const [activeImage, setActiveImage] = useState<'original' | 'colorized'>(colorizedImageUrl ? 'colorized' : 'original');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [showComparison, setShowComparison] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; distance: number } | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50); // 0-100 percentage
  const [isSliderDragging, setIsSliderDragging] = useState(false);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const resetView = () => {
    setZoom(1);
    setRotation(0);
    setImagePosition({ x: 0, y: 0 });
    setIsDragging(false);
    setSliderPosition(50);
    setIsSliderDragging(false);
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
    if (zoom > 1 && !showComparison) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1 && !showComparison) {
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
        if (showComparison && colorizedImageUrl) {
          setSliderPosition(prev => Math.max(0, prev - 5));
        } else if (colorizedImageUrl) {
          setActiveImage(activeImage === 'original' ? 'colorized' : 'original');
        }
        break;
      case 'ArrowRight':
        if (showComparison && colorizedImageUrl) {
          setSliderPosition(prev => Math.min(100, prev + 5));
        } else if (colorizedImageUrl) {
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
  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - start panning
      if (zoom > 1 && !showComparison) {
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
    
    if (e.touches.length === 1 && isDragging && zoom > 1 && !showComparison) {
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

  // Slider handlers
  const handleSliderMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent text selection
    setIsSliderDragging(true);
  };

  const handleSliderMouseMove = (e: React.MouseEvent) => {
    if (isSliderDragging && showComparison) {
      e.preventDefault(); // Prevent text selection
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    }
  };

  const handleSliderMouseUp = () => {
    setIsSliderDragging(false);
  };

  const handleSliderTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent text selection
    setIsSliderDragging(true);
  };

  const handleSliderTouchMove = (e: React.TouchEvent) => {
    if (isSliderDragging && showComparison && e.touches.length === 1) {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    }
  };

  const handleSliderTouchEnd = () => {
    setIsSliderDragging(false);
  };

  const handleDownload = () => {
    // Always download the colorized image if available, otherwise download original
    const url = colorizedImageUrl || originalImageUrl;
    const imageType = colorizedImageUrl ? 'colorized' : 'original';
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = `${imageType}-${jobId}.jpg`;
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
      // Default to colorized image if available
      setActiveImage(colorizedImageUrl ? 'colorized' : 'original');
    }
  }, [isOpen, colorizedImageUrl]);

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
          <DialogHeader className="flex-shrink-0 p-3 sm:p-6 sm:pb-4 border-b bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
              {/* Mobile: Simple header with status badge */}
              <div className="flex items-center gap-2 sm:hidden">
                {getStatusBadge(status)}
              </div>
              
              {/* Desktop: Full header */}
              <div className="hidden sm:flex sm:flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
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
              
              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {colorizedImageUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowComparison(!showComparison)}
                    className={`${showComparison ? "bg-blue-50 border-blue-200" : ""} h-8 w-8 sm:w-auto p-0 sm:px-3`}
                  >
                    {showComparison ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="hidden sm:inline sm:ml-1">{showComparison ? "Hide" : "Compare"}</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMetadata(!showMetadata)}
                  className="hidden sm:flex text-xs sm:text-sm"
                >
                  <Info className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="hidden sm:flex text-xs sm:text-sm"
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 sm:w-auto p-0 sm:px-3"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Enhanced Image Tabs */}
          <div className="flex-shrink-0 px-3 sm:px-6 py-2 sm:py-4 border-b bg-white/60 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant={activeImage === 'original' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveImage('original')}
                  className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-initial"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Original</span>
                </Button>
                {colorizedImageUrl && (
                  <Button
                    variant={activeImage === 'colorized' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveImage('colorized')}
                    className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-initial"
                  >
                    <span>Colorized</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                {showComparison ? 'Drag slider or use arrow keys to compare • Space to exit comparison' : 'Use arrow keys to switch between images • Space for comparison • Mouse wheel to zoom'}
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
              <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4">
                {showComparison && colorizedImageUrl ? (
                  // Comparison Slider
                  <div className="relative w-full h-full max-w-4xl max-h-full">
                    <div 
                      className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl cursor-ew-resize select-none"
                      onMouseMove={handleSliderMouseMove}
                      onMouseUp={handleSliderMouseUp}
                      onMouseLeave={handleSliderMouseUp}
                      onTouchMove={handleSliderTouchMove}
                      onTouchEnd={handleSliderTouchEnd}
                      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                    >
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
                        className="absolute inset-0 transition-all duration-200"
                        style={{
                          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                        }}
                      >
                        <img
                          src={colorizedImageUrl}
                          alt="Colorized"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      {/* Slider Line */}
                      <div 
                        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10"
                        style={{ left: `${sliderPosition}%` }}
                      >
                        <div 
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center cursor-ew-resize hover:bg-gray-50 transition-colors select-none"
                          onMouseDown={handleSliderMouseDown}
                          onTouchStart={handleSliderTouchStart}
                          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                        >
                          <Move className="h-4 w-4 text-gray-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Single Image View - Similar to comparison view
                  <div className="relative w-full h-full max-w-4xl max-h-full">
                    <div 
                      className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl"
                      style={{
                        transform: zoom !== 1 || rotation !== 0 ? `scale(${zoom}) rotate(${rotation}deg)` : 'none',
                      }}
                    >
                      {imageError ? (
                        <div className="flex flex-col items-center justify-center w-full h-full bg-red-50 border-2 border-red-200 rounded-lg">
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
                            className={`w-full h-full object-contain transition-opacity duration-300 ${
                              imageLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                            draggable={false}
                            style={{
                              transform: imagePosition.x !== 0 || imagePosition.y !== 0 ? `translate(${imagePosition.x}px, ${imagePosition.y}px)` : 'none',
                            }}
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
          <div className="flex-shrink-0 p-3 sm:p-6 sm:pt-4 border-t bg-white/80 backdrop-blur-sm">
            {/* Mobile: Simple controls with just Download button */}
            <div className="flex sm:hidden items-center justify-center">
              {currentImageUrl && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleDownload}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm w-full max-w-xs"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Colorized Image
                </Button>
              )}
            </div>
            
            {/* Desktop: Full controls */}
            <div className="hidden sm:block">
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
                      <span>Rotate</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetView}
                      className="flex items-center gap-2 text-xs sm:text-sm"
                    >
                      <span>Reset View</span>
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
                  <span><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">←→</kbd> {showComparison ? 'Slider' : 'Switch'}</span>
                  <span><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Space</kbd> {showComparison ? 'Exit Compare' : 'Compare'}</span>
                  <span><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">R</kbd> Rotate</span>
                  <span><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">F</kbd> Fullscreen</span>
                  <span><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">+/-</kbd> Zoom</span>
                  <span><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">0</kbd> Reset</span>
                  <span className="hidden sm:inline"><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Wheel</kbd> Zoom</span>
                  {showComparison && <span><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Drag</kbd> Slider</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

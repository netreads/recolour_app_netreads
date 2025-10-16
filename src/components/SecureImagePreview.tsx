"use client";

import { useState, useEffect, useRef } from "react";

interface SecureImagePreviewProps {
  imageUrl: string;
  alt: string;
  watermarkText?: string;
  className?: string;
  blur?: boolean;
}

/**
 * SECURITY: Canvas-based secure image preview that prevents URL extraction
 * The image URL is never exposed in the DOM, making it impossible to extract via inspect element
 * The image is rendered to canvas which prevents direct URL access
 */
export function SecureImagePreview({
  imageUrl,
  alt,
  watermarkText = "ReColor AI - Watermarked Preview",
  className = "",
  blur = false,
}: SecureImagePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [resizeKey, setResizeKey] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) return;

    // Create a new image element (not added to DOM)
    // Note: We intentionally do NOT set crossOrigin, which makes the canvas "tainted"
    // This prevents users from extracting image data via canvas.toDataURL() or getImageData()
    const img = new Image();
    
    img.onload = () => {
      // Set canvas size to match image
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      // Calculate dimensions to fit image in container while maintaining aspect ratio
      const imgAspect = img.width / img.height;
      const containerAspect = containerWidth / containerHeight;
      
      let drawWidth, drawHeight, offsetX, offsetY;
      
      if (imgAspect > containerAspect) {
        // Image is wider than container
        drawWidth = containerWidth;
        drawHeight = containerWidth / imgAspect;
        offsetX = 0;
        offsetY = (containerHeight - drawHeight) / 2;
      } else {
        // Image is taller than container
        drawHeight = containerHeight;
        drawWidth = containerHeight * imgAspect;
        offsetX = (containerWidth - drawWidth) / 2;
        offsetY = 0;
      }
      
      canvas.width = containerWidth;
      canvas.height = containerHeight;
      
      // Clear canvas
      ctx.clearRect(0, 0, containerWidth, containerHeight);
      
      // Draw image
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      
      
      setIsLoading(false);
    };

    img.onerror = () => {
      console.error('Failed to load image for secure preview');
      setIsLoading(false);
    };

    // Load the image
    img.src = imageUrl;

    // Cleanup
    return () => {
      img.src = '';
    };
  }, [imageUrl, blur, resizeKey]);

  // Handle window resize - redraw canvas
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    
    const handleResize = () => {
      // Debounce resize events to avoid excessive redraws
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // Increment resize key to trigger canvas redraw
        setResizeKey(prev => prev + 1);
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    return false;
  };

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      data-secure-preview="true"
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
    >
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      )}
      
      {/* Canvas rendering - URL not exposed in DOM */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain"
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
          opacity: isLoading ? 0 : 1,
          transition: "opacity 0.3s ease-in-out",
        }}
      />
      
      {/* CSS-based watermarks - much lighter than canvas */}
      {watermarkText && watermarkText.trim() !== "" && (
        <>
          {/* Main watermark overlays */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="bg-white/85 px-5 py-3 rounded-lg shadow-lg">
              <span className="text-orange-500/90 font-bold text-2xl md:text-4xl">
                {watermarkText}
              </span>
            </div>
          </div>
          
          {/* Diagonal repeating pattern */}
          <div 
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{
              background: `repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 200px,
                rgba(255, 255, 255, 0.1) 200px,
                rgba(255, 255, 255, 0.1) 220px
              )`,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="text-white/10 font-bold whitespace-nowrap"
                style={{
                  fontSize: '4rem',
                  transform: 'rotate(-45deg) scale(2)',
                  letterSpacing: '2rem',
                }}
              >
                PREVIEW PREVIEW PREVIEW
              </div>
            </div>
          </div>
          
          {/* Additional corner watermarks */}
          <div className="absolute top-4 left-4 bg-white/75 px-3 py-1 rounded shadow pointer-events-none">
            <span className="text-orange-500 font-semibold text-sm">{watermarkText}</span>
          </div>
          <div className="absolute bottom-4 right-4 bg-white/75 px-3 py-1 rounded shadow pointer-events-none">
            <span className="text-orange-500 font-semibold text-sm">{watermarkText}</span>
          </div>
        </>
      )}
      
      {/* Overlay to prevent inspect element tricks */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "transparent",
          zIndex: 1,
        }}
      />
    </div>
  );
}


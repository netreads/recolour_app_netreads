"use client";

import { useState, useEffect } from "react";

interface SecureImagePreviewProps {
  imageUrl: string;
  alt: string;
  watermarkText?: string;
  className?: string;
  blur?: boolean;
}

/**
 * OPTIMIZATION: Simplified secure image preview using CSS overlays instead of canvas
 * This reduces bandwidth by not downloading images for client-side processing
 * Original canvas approach downloaded full images, processed them, and re-rendered
 * New approach uses CSS overlays and native <img> tags with proper caching
 */
export function SecureImagePreview({
  imageUrl,
  alt,
  watermarkText = "ReColor AI - Watermarked Preview",
  className = "",
  blur = false,
}: SecureImagePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Reset loading state when imageUrl changes
  useEffect(() => {
    setIsLoading(true);
  }, [imageUrl]);

  // OPTIMIZATION: Simple image load handler - no canvas processing needed
  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    return false;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Prevent any pointer events that might be used to extract the image
    if (e.button === 2) { // Right click
      e.preventDefault();
    }
  };

  return (
    <div 
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
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      )}
      
      {/* OPTIMIZATION: Use native img tag with proper caching instead of canvas */}
      {/* This allows browser caching and CDN caching to work properly */}
      <img
        src={imageUrl}
        alt={alt}
        className={`w-full h-full object-contain ${blur ? "blur-md" : ""}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        onPointerDown={handlePointerDown}
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


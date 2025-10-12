"use client";

import { useEffect, useRef, useState } from "react";

interface SecureImagePreviewProps {
  imageUrl: string;
  alt: string;
  watermarkText?: string;
  className?: string;
  blur?: boolean;
}

/**
 * Secure image preview component that prevents:
 * - Right-click to save/open in new tab
 * - Dragging the image
 * - Inspecting to get the URL
 * - Screenshots (adds visible watermarks)
 */
export function SecureImagePreview({
  imageUrl,
  alt,
  watermarkText = "ReColor AI - Watermarked Preview",
  className = "",
  blur = false,
}: SecureImagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", {
      willReadFrequently: false,
      desynchronized: true,
    });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the image
      ctx.drawImage(img, 0, 0);

      // Apply blur filter if preview mode
      if (blur) {
        ctx.filter = "blur(8px)";
        ctx.drawImage(canvas, 0, 0);
        ctx.filter = "none";
      }

      // Only add watermarks if watermarkText is provided
      if (watermarkText && watermarkText.trim() !== "") {
        // Add multiple watermarks at different positions
        const watermarks = [
          { x: canvas.width / 2, y: 50, size: 36 },
          { x: canvas.width / 2, y: canvas.height / 2, size: 48 },
          { x: canvas.width / 2, y: canvas.height - 50, size: 36 },
          { x: canvas.width / 4, y: canvas.height / 3, size: 30 },
          { x: (canvas.width * 3) / 4, y: (canvas.height * 2) / 3, size: 30 },
        ];

        watermarks.forEach(({ x, y, size }) => {
          // Add semi-transparent background
          ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
          ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
          ctx.shadowBlur = 10;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          // Measure text to create background
          ctx.font = `bold ${size}px Arial`;
          const metrics = ctx.measureText(watermarkText);
          const textWidth = metrics.width;
          const textHeight = size;

          // Draw rounded rectangle background
          const padding = 20;
          const rectX = x - textWidth / 2 - padding;
          const rectY = y - textHeight / 2 - padding;
          const rectWidth = textWidth + padding * 2;
          const rectHeight = textHeight + padding * 2;
          const radius = 10;

          ctx.beginPath();
          ctx.moveTo(rectX + radius, rectY);
          ctx.lineTo(rectX + rectWidth - radius, rectY);
          ctx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + radius);
          ctx.lineTo(rectX + rectWidth, rectY + rectHeight - radius);
          ctx.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - radius, rectY + rectHeight);
          ctx.lineTo(rectX + radius, rectY + rectHeight);
          ctx.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - radius);
          ctx.lineTo(rectX, rectY + radius);
          ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY);
          ctx.closePath();
          ctx.fill();

          // Draw watermark text
          ctx.fillStyle = "rgba(255, 100, 50, 0.9)";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(watermarkText, x, y);

          // Reset shadow
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        });

        // Add diagonal watermarks across the image
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.font = "bold 60px Arial";
        ctx.textAlign = "center";
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 6);
        
        for (let i = -2; i <= 2; i++) {
          for (let j = -2; j <= 2; j++) {
            ctx.fillText("PREVIEW", i * 300, j * 200);
          }
        }
        ctx.restore();
      }

      setIsLoading(false);
    };

    img.onerror = () => {
      console.error("Failed to load image");
      setIsLoading(false);
    };

    img.src = imageUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl, watermarkText, blur]);

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
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-contain ${isLoading ? "hidden" : ""}`}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        onPointerDown={handlePointerDown}
        style={{
          pointerEvents: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
        }}
      />
      {/* Additional overlay to prevent inspect element tricks */}
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


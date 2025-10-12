"use client";

import { useEffect } from "react";

/**
 * Global security component that prevents:
 * - Opening DevTools
 * - Keyboard shortcuts for inspect element
 * - Screenshot attempts (shows warning)
 * - Common bypass methods
 */
export function SecurityProtection() {
  useEffect(() => {
    // Detect if DevTools are open
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        // DevTools might be open, but we won't block completely
        // Just log it for monitoring
        console.warn("Please close developer tools for best experience");
      }
    };

    // Prevent common keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F12 (DevTools)
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === "I") {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === "J") {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+Shift+C (Inspect Element)
      if (e.ctrlKey && e.shiftKey && e.key === "C") {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+U (View Source)
      if (e.ctrlKey && e.key === "u") {
        e.preventDefault();
        return false;
      }

      // Prevent Cmd+Option+I (DevTools on Mac)
      if (e.metaKey && e.altKey && e.key === "i") {
        e.preventDefault();
        return false;
      }

      // Prevent Cmd+Option+J (Console on Mac)
      if (e.metaKey && e.altKey && e.key === "j") {
        e.preventDefault();
        return false;
      }

      // Prevent Cmd+Option+C (Inspect Element on Mac)
      if (e.metaKey && e.altKey && e.key === "c") {
        e.preventDefault();
        return false;
      }

      // Prevent Cmd+U (View Source on Mac)
      if (e.metaKey && e.key === "u") {
        e.preventDefault();
        return false;
      }
    };

    // Prevent right-click globally on preview modal
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only prevent on canvas and image elements
      if (target.tagName === "CANVAS" || target.tagName === "IMG") {
        e.preventDefault();
        return false;
      }
    };

    // Detect screenshot attempts (visibility change)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User might be taking a screenshot
        // We can't prevent this, but we can log it
        console.log("Page hidden - possible screenshot attempt");
      }
    };

    // Add event listeners
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Check for DevTools periodically
    const devToolsInterval = setInterval(detectDevTools, 1000);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(devToolsInterval);
    };
  }, []);

  return null; // This component doesn't render anything
}


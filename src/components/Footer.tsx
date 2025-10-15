"use client";

import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function Footer() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Mobile Accordion Layout (< 768px) */}
        <div className="md:hidden space-y-4">
          {/* Brand Section - Always visible on mobile */}
          <div className="space-y-3 pb-4">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center transition-transform group-hover:scale-105">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold">ReColor AI</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Transform your black & white memories into vibrant, colorized images using cutting-edge AI.
            </p>
          </div>

          {/* Quick Links - Compact on mobile */}
          <div className="grid grid-cols-1 gap-3 py-4">
            <Link 
              href="/#upload" 
              className="flex items-center justify-center px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors active:scale-95"
            >
              Upload & Colorize
            </Link>
          </div>

          {/* Collapsible Sections */}
          <div className="space-y-2">
            {/* Support Section */}
            <div className="border rounded-lg overflow-hidden bg-card">
              <button
                onClick={() => toggleSection("support")}
                className="w-full flex items-center justify-between px-4 py-3 text-left font-medium text-sm hover:bg-accent transition-colors"
                aria-expanded={openSection === "support"}
              >
                <span>Support & Help</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSection === "support" ? "rotate-180" : ""}`} />
              </button>
              {openSection === "support" && (
                <nav className="px-4 py-3 space-y-2 bg-accent/50">
                  <Link href="/contact" className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Contact Us
                  </Link>
                  <Link href="/faq" className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    FAQs
                  </Link>
                </nav>
              )}
            </div>

            {/* Legal Section */}
            <div className="border rounded-lg overflow-hidden bg-card">
              <button
                onClick={() => toggleSection("legal")}
                className="w-full flex items-center justify-between px-4 py-3 text-left font-medium text-sm hover:bg-accent transition-colors"
                aria-expanded={openSection === "legal"}
              >
                <span>Legal & Policies</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSection === "legal" ? "rotate-180" : ""}`} />
              </button>
              {openSection === "legal" && (
                <nav className="px-4 py-3 space-y-2 bg-accent/50">
                  <Link href="/privacy" className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                  <Link href="/tos" className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                  <Link href="/cookies" className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Cookie Policy
                  </Link>
                  <Link href="/refund" className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Refund & Cancellation
                  </Link>
                </nav>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Layout (>= 768px) */}
        <div className="hidden md:block">
          <div className="grid grid-cols-12 gap-8 lg:gap-12">
            {/* Brand - Takes more space on desktop */}
            <div className="col-span-12 lg:col-span-4 space-y-4">
              <Link href="/" className="flex items-center space-x-2 group">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center transition-transform group-hover:scale-105">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold">ReColor AI</span>
              </Link>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Transform your black & white memories into vibrant, colorized images using cutting-edge AI technology.
              </p>
              <div className="flex gap-3 pt-2">
                <Link 
                  href="/#upload" 
                  className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:bg-primary/90 transition-all hover:shadow-md"
                >
                  Get Started
                </Link>
              </div>
            </div>

            {/* Links Grid */}
            <div className="col-span-12 lg:col-span-8 grid grid-cols-3 gap-8">
              {/* Product */}
              <div className="space-y-4">
                <h3 className="font-semibold text-base">Product</h3>
                <nav className="flex flex-col space-y-3">
                  <Link href="/#upload" className="text-sm text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
                    Upload & Colorize
                  </Link>
                </nav>
              </div>

              {/* Support */}
              <div className="space-y-4">
                <h3 className="font-semibold text-base">Support</h3>
                <nav className="flex flex-col space-y-3">
                  <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
                    Contact Us
                  </Link>
                  <Link href="/faq" className="text-sm text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
                    FAQs
                  </Link>
                </nav>
              </div>

              {/* Legal */}
              <div className="space-y-4">
                <h3 className="font-semibold text-base">Legal</h3>
                <nav className="flex flex-col space-y-3">
                  <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
                    Privacy
                  </Link>
                  <Link href="/tos" className="text-sm text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
                    Terms
                  </Link>
                  <Link href="/cookies" className="text-sm text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
                    Cookies
                  </Link>
                  <Link href="/refund" className="text-sm text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all">
                    Refunds
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-6 sm:my-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} ReColor AI. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
            <span className="hidden sm:inline">Made in India</span>
            <span className="sm:hidden">🇮🇳 Made in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}



import type { Metadata } from "next";
import dynamic from "next/dynamic";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { FacebookPixel } from "@/components/FacebookPixel";
import { MicrosoftClarity } from "@/components/MicrosoftClarity";

// OPTIMIZATION: Lazy load Footer to reduce initial bundle size by ~10KB
// Still renders on server (ssr: true) but loaded as separate chunk
const Footer = dynamic(() => import("@/components/Footer").then(mod => ({ default: mod.Footer })), {
  ssr: true,
  loading: () => null,
});


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://netreads.in'),
  title: "ReColor AI - Bring Old Photos to Life",
  description: "Recolorize your old black & white images using AI",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "ReColor AI - Bring Old Photos to Life",
    description: "Recolorize your old black & white images using AI",
    url: "https://netreads.in",
    siteName: "ReColor AI",
    images: [
      {
        url: "/next.svg",
        width: 1200,
        height: 630,
        alt: "ReColor AI",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReColor AI - Bring Old Photos to Life",
    description: "Recolorize your old black & white images using AI",
    images: ["/next.svg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pixelId = process.env.FACEBOOK_PIXEL_ID;

  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {/* Tracking Scripts - optimized loading to reduce CPU usage */}
        {pixelId && <FacebookPixel pixelId={pixelId} />}
        <MicrosoftClarity />
        {/* Microsoft Clarity will only load if NEXT_PUBLIC_MICROSOFT_CLARITY_ID is set */}
        
        <div className="relative flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}

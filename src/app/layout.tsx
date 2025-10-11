import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { FacebookPixel } from "@/components/FacebookPixel";
import { FacebookPixelDebug } from "@/components/FacebookPixelDebug";

export const metadata: Metadata = {
  title: "ReColor AI - Bring Old Photos to Life",
  description: "Recolorize your old black & white images using AI",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "ReColor AI - Bring Old Photos to Life",
    description: "Recolorize your old black & white images using AI",
    url: "https://recolor.example.com",
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
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {pixelId && <FacebookPixel pixelId={pixelId} />}
        <div className="relative flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <Toaster />
        <SpeedInsights />
        <Analytics />
        <FacebookPixelDebug />
      </body>
    </html>
  );
}

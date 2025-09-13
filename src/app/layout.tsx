import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";

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
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
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

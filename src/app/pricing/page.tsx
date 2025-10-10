'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Zap, Crown } from "lucide-react";
import { PricingCard } from "@/components/PricingCard";
import { useEffect, useState } from "react";
import { getUser } from "@/lib/auth-client";

export default function PricingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
  }, []);
  const creditPackages = [
    {
      name: "Single Image",
      credits: 1,
      price: "₹99",
      description: "Try It Once",
      features: [
        "1 image",
        "Full-resolution download",
        "Email support",
      ],
      buttonText: "Buy Now",
      buttonVariant: "outline" as const,
      href: "/signup",
      icon: <Star className="h-5 w-5" />,
    },
    {
      name: "Family Pack",
      credits: 4,
      price: "₹399",
      description: "4 images → ₹99/image",
      features: [
        "4 images",
        "₹99/image",
        "Priority processing",
        "Full-resolution downloads",
      ],
      buttonText: "Buy Now",
      buttonVariant: "outline" as const,
      href: "/signup",
      icon: <Zap className="h-5 w-5" />,
    },
    {
      name: "Festive Pack",
      credits: 8,
      price: "₹699",
      description: "8 images → ₹87/image",
      features: [
        "8 images",
        "₹87/image",
        "⭐ Best Value",
        "Faster priority processing",
        "Priority email support",
        "Unlimited re-downloads",
      ],
      buttonText: "Buy Now",
      buttonVariant: "default" as const,
      href: "/signup",
      popular: true,
      icon: <Crown className="h-5 w-5" />,
    },
    {
      name: "Studio Pack",
      credits: 25,
      price: "₹1,999",
      description: "Business & Studios",
      features: [
        "25 images",
        "₹80/image",
        "Fastest processing queue",
        "Dedicated support",
        "Enhanced previews",
      ],
      buttonText: "Buy Now",
      buttonVariant: "outline" as const,
      href: "/signup",
      icon: <Crown className="h-5 w-5" />,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 sm:py-16 space-y-12 sm:space-y-16">
      {/* Header */}
      <div className="text-center space-y-3 sm:space-y-4 max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
          🚀 Optimized Pricing
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground px-4">
          Pay only for what you use. Purchase image credits and colorize your photos with AI. 
          Get 1 free image credit when you sign up!
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
        {creditPackages.map((package_) => (
          <PricingCard
            key={package_.name}
            name={package_.name}
            credits={package_.credits}
            price={package_.price}
            description={package_.description}
            features={package_.features}
            buttonText={package_.buttonText}
            buttonVariant={package_.buttonVariant}
            href={package_.href}
            popular={package_.popular}
            icon={package_.icon}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Frequently Asked Questions</h2>
        </div>
        
        <div className="grid gap-4 sm:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How do credits work?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Each credit allows you to colorize one image with our AI. Credits never expire, 
                so you can use them whenever you want. Get 1 free image credit when you sign up!
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What happens when I run out of credits?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                When you run out of credits, you'll need to purchase more to continue colorizing images. 
                You can buy credits anytime from our pricing page.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Do credits expire?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                No, credits never expire! You can purchase credits and use them whenever you want. 
                There's no rush to use them up.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Do you offer refunds?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We offer a 30-day money-back guarantee for all credit purchases. 
                If you're not satisfied, contact our support team for a full refund.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}



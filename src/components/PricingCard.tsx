'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, ArrowRight, CreditCard, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { trackInitiateCheckout } from '@/components/FacebookPixel';

interface PricingCardProps {
  name: string;
  credits: number;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonVariant: 'default' | 'outline';
  href: string;
  popular?: boolean;
  icon: React.ReactNode;
  isAuthenticated?: boolean | null;
}

export function PricingCard({
  name,
  credits,
  price,
  description,
  features,
  buttonText,
  buttonVariant,
  href,
  popular,
  icon,
  isAuthenticated,
}: PricingCardProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePurchase = async () => {
    // If user is not authenticated, redirect to signup
    if (isAuthenticated === false) {
      router.push('/signup');
      return;
    }

    // If authentication status is still loading, wait
    if (isAuthenticated === null) {
      return;
    }

    setLoading(true);
    
    try {
      // Track initiate checkout event
      const packageType = getPackageType(name);
      const priceValue = getPriceValue(price);
      trackInitiateCheckout(priceValue, 'INR', [packageType]);

      // Create order
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageType: packageType,
        }),
      });

      if (!response.ok) {
        let message = 'Failed to create order';
        try {
          const err = await response.json();
          if (err?.error) message = err.error;
        } catch (_e) {
          // ignore
        }
        throw new Error(message);
      }

      const orderData = await response.json();

      // PhonePe provides a redirect URL directly, so redirect to it
      if (orderData.redirectUrl) {
        window.location.href = orderData.redirectUrl;
      } else {
        throw new Error('No redirect URL received from PhonePe');
      }
      
    } catch (error: any) {
      console.error('Error creating order:', error);
      alert(error?.message || 'Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPackageType = (packageName: string): string => {
    const typeMap: { [key: string]: string } = {
      'Single Image': 'single',
      'Family Pack': 'family',
      'Festive Pack': 'festive',
      'Studio Pack': 'studio',
    };
    return typeMap[packageName] || 'single';
  };

  const getPriceValue = (priceString: string): number => {
    // Extract numeric value from price string like "₹149" or "₹2,499"
    const numericValue = priceString.replace(/[₹,]/g, '');
    return parseFloat(numericValue) || 0;
  };

  return (
    <Card
      className={`relative transition-all duration-200 ${
        popular
          ? "border-primary shadow-lg sm:scale-105"
          : "hover:shadow-md"
      }`}
    >
      {popular && (
        <div className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-primary to-blue-600 text-primary-foreground px-2 sm:px-3 py-1 text-xs sm:text-sm">
            Best Value
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-4 sm:pb-6 px-4 sm:px-6">
        <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary/10 to-blue-600/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
          {icon}
        </div>
        <CardTitle className="text-lg sm:text-xl font-bold">{name}</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {description}
        </CardDescription>
        <div className="space-y-1 pt-3 sm:pt-4">
          <div className="text-2xl sm:text-3xl font-bold">{price}</div>
          <div className="text-xs sm:text-sm text-muted-foreground">
            {credits} {credits === 1 ? 'image' : 'images'}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
        <Button
          size="lg"
          variant={buttonVariant}
          className="w-full text-sm sm:text-base py-2 sm:py-3"
          onClick={handlePurchase}
          disabled={loading || isAuthenticated === null}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              Processing...
            </>
          ) : isAuthenticated === false ? (
            <>
              <CreditCard className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Sign Up to Purchase
              <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              {buttonText}
              <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            </>
          )}
        </Button>
        
        <Separator />
        
        <div className="space-y-2 sm:space-y-3">
          <p className="font-medium text-xs sm:text-sm">What's included:</p>
          <ul className="space-y-1.5 sm:space-y-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-start">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

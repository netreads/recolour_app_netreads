'use client';

import { useState } from 'react';
import { load } from '@cashfreepayments/cashfree-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, ArrowRight, CreditCard, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
      // Create order
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageType: getPackageType(name),
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

      // Try Cashfree JS SDK checkout first
      try {
        const cashfree = await load({ mode: process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'production' ? 'production' : 'sandbox' });
        const result = await cashfree.checkout({
          paymentSessionId: orderData.paymentSessionId,
        } as any);
        if (result && (result as any).error) {
          throw new Error((result as any).error?.message || 'Checkout failed');
        }
        return;
      } catch (_sdkErr) {
        // Fallback to hosted redirect
        const env = process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT;
        const host = env === 'production' ? 'https://payments.cashfree.com' : 'https://sandbox.cashfree.com';
        const cashfreeUrl = `${host}/pg/view/sessions/${orderData.paymentSessionId}`;
        window.location.href = cashfreeUrl;
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
      'Starter Pack': 'starter',
      'Value Pack': 'value',
      'Pro Pack': 'pro',
      'Business Pack': 'business',
    };
    return typeMap[packageName] || 'starter';
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
            {credits} HD Credits
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

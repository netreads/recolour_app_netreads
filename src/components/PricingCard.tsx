'use client';

import { useState } from 'react';
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
}: PricingCardProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePurchase = async () => {
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
        throw new Error('Failed to create order');
      }

      const orderData = await response.json();
      
      // Redirect to Cashfree payment page
      const cashfreeUrl = `https://sandbox.cashfree.com/pg/web/${orderData.paymentSessionId}`;
      window.location.href = cashfreeUrl;
      
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to initiate payment. Please try again.');
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
          ? "border-primary shadow-lg scale-105"
          : "hover:shadow-md"
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-primary to-blue-600 text-primary-foreground px-3 py-1">
            Best Value
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-6">
        <div className="mx-auto w-12 h-12 bg-gradient-to-r from-primary/10 to-blue-600/10 rounded-lg flex items-center justify-center mb-4">
          {icon}
        </div>
        <CardTitle className="text-xl font-bold">{name}</CardTitle>
        <CardDescription className="text-sm">
          {description}
        </CardDescription>
        <div className="space-y-1 pt-4">
          <div className="text-3xl font-bold">{price}</div>
          <div className="text-sm text-muted-foreground">
            {credits} HD Credits
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Button
          size="lg"
          variant={buttonVariant}
          className="w-full"
          onClick={handlePurchase}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              {buttonText}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
        
        <Separator />
        
        <div className="space-y-3">
          <p className="font-medium text-sm">What's included:</p>
          <ul className="space-y-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-start">
                <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">
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

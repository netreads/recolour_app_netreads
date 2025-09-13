import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Star, Zap, Crown, ArrowRight } from "lucide-react";

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "₹0",
      period: "forever",
      description: "Perfect for trying out our service",
      features: [
        "5 images per month",
        "Basic AI colorization",
        "Standard resolution",
        "Email support",
      ],
      buttonText: "Get Started",
      buttonVariant: "outline" as const,
      href: "/signup",
      icon: <Star className="h-5 w-5" />,
    },
    {
      name: "Pro",
      price: "₹299",
      period: "per month",
      description: "Best for individuals and small teams",
      features: [
        "100 images per month",
        "Advanced AI colorization",
        "High resolution output",
        "Priority processing",
        "Priority email support",
        "Batch processing",
      ],
      buttonText: "Upgrade to Pro",
      buttonVariant: "default" as const,
      href: "/signup",
      popular: true,
      icon: <Zap className="h-5 w-5" />,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "For large teams and organizations",
      features: [
        "Unlimited images",
        "Custom AI models",
        "API access",
        "White-label solution",
        "Dedicated account manager",
        "SLA guarantee",
        "Custom integrations",
      ],
      buttonText: "Contact Sales",
      buttonVariant: "outline" as const,
      href: "/contact",
      icon: <Crown className="h-5 w-5" />,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-16 space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-muted-foreground">
          Choose the perfect plan for your photo colorization needs. 
          Start free and upgrade as you grow.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative transition-all duration-200 ${
              plan.popular
                ? "border-primary shadow-lg scale-105"
                : "hover:shadow-md"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-primary to-blue-600 text-primary-foreground px-3 py-1">
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-8">
              <div className="mx-auto w-12 h-12 bg-gradient-to-r from-primary/10 to-blue-600/10 rounded-lg flex items-center justify-center mb-4">
                {plan.icon}
              </div>
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
              <CardDescription className="text-base">
                {plan.description}
              </CardDescription>
              <div className="space-y-1 pt-4">
                <div className="text-4xl font-bold">{plan.price}</div>
                <div className="text-sm text-muted-foreground">
                  {plan.period}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <Button
                size="lg"
                variant={plan.buttonVariant}
                className="w-full"
                asChild
              >
                <Link href={plan.href}>
                  {plan.buttonText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              
              <Separator />
              
              <div className="space-y-3">
                <p className="font-medium text-sm">What's included:</p>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
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
        ))}
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
        </div>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Can I change my plan anytime?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. 
                Changes will be reflected in your next billing cycle.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What happens if I exceed my monthly limit?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                If you exceed your monthly image limit, you'll need to upgrade your plan 
                or wait until the next billing cycle. We'll notify you when you're close to your limit.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Do you offer refunds?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We offer a 30-day money-back guarantee for all paid plans. 
                If you're not satisfied, contact our support team for a full refund.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}



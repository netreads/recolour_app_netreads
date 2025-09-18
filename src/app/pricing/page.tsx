import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Star, Zap, Crown, ArrowRight } from "lucide-react";

export default function PricingPage() {
  const creditPackages = [
    {
      name: "Starter Pack",
      credits: 1,
      price: "₹49",
      description: "Perfect for trying out our service",
      features: [
        "1 HD credit",
        "High-quality AI colorization",
        "Download in original resolution",
        "Email support",
      ],
      buttonText: "Buy Now",
      buttonVariant: "outline" as const,
      href: "/signup",
      icon: <Star className="h-5 w-5" />,
    },
    {
      name: "Value Pack",
      credits: 5,
      price: "₹199",
      description: "Best value for regular users",
      features: [
        "5 HD credits",
        "High-quality AI colorization",
        "Download in original resolution",
        "Priority processing",
        "Email support",
      ],
      buttonText: "Buy Now",
      buttonVariant: "default" as const,
      href: "/signup",
      popular: true,
      icon: <Zap className="h-5 w-5" />,
    },
    {
      name: "Pro Pack",
      credits: 12,
      price: "₹399",
      description: "For power users and professionals",
      features: [
        "12 HD credits",
        "High-quality AI colorization",
        "Download in original resolution",
        "Priority processing",
        "Priority email support",
        "Batch processing",
      ],
      buttonText: "Buy Now",
      buttonVariant: "outline" as const,
      href: "/signup",
      icon: <Crown className="h-5 w-5" />,
    },
    {
      name: "Business Pack",
      credits: 35,
      price: "₹999",
      description: "For teams and businesses",
      features: [
        "35 HD credits",
        "High-quality AI colorization",
        "Download in original resolution",
        "Priority processing",
        "Priority email support",
        "Batch processing",
        "API access",
      ],
      buttonText: "Buy Now",
      buttonVariant: "outline" as const,
      href: "/signup",
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
          Pay only for what you use. Purchase credits and colorize your photos with AI. 
          Get 1 free HD credit when you sign up!
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {creditPackages.map((package_) => (
          <Card
            key={package_.name}
            className={`relative transition-all duration-200 ${
              package_.popular
                ? "border-primary shadow-lg scale-105"
                : "hover:shadow-md"
            }`}
          >
            {package_.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-primary to-blue-600 text-primary-foreground px-3 py-1">
                  Best Value
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-12 h-12 bg-gradient-to-r from-primary/10 to-blue-600/10 rounded-lg flex items-center justify-center mb-4">
                {package_.icon}
              </div>
              <CardTitle className="text-xl font-bold">{package_.name}</CardTitle>
              <CardDescription className="text-sm">
                {package_.description}
              </CardDescription>
              <div className="space-y-1 pt-4">
                <div className="text-3xl font-bold">{package_.price}</div>
                <div className="text-sm text-muted-foreground">
                  {package_.credits} HD Credits
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Button
                size="lg"
                variant={package_.buttonVariant}
                className="w-full"
                asChild
              >
                <Link href={package_.href}>
                  {package_.buttonText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              
              <Separator />
              
              <div className="space-y-3">
                <p className="font-medium text-sm">What's included:</p>
                <ul className="space-y-2">
                  {package_.features.map((feature) => (
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
              <CardTitle className="text-lg">How do credits work?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Each credit allows you to colorize one image with our AI. Credits never expire, 
                so you can use them whenever you want. Get 1 free HD credit when you sign up!
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



import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Zap, Download, Sparkles, Star, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="space-y-6">
            <Badge variant="secondary" className="mx-auto">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered Photo Colorization
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Bring Your Old Photos to Life
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform your black & white memories into vibrant, colorized images using cutting-edge AI technology. 
              No technical skills required.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-base px-8" asChild>
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
            
            <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center">
                <Zap className="w-4 h-4 text-green-500 mr-1" />
                <span>10 free images</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Transform your memories in three simple steps with our AI-powered colorization technology
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="text-center border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl">Upload Your Photo</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Simply drag and drop or select your black and white photo. We support all common image formats.
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card className="text-center border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl">AI Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Our advanced AI analyzes your image and intelligently applies realistic colors based on context.
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card className="text-center border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl">Download Result</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Get your beautifully colorized photo in high resolution, ready for sharing or printing.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-primary/10 to-blue-600/10 border-0">
          <CardContent className="p-12 text-center">
            <h3 className="text-3xl font-bold mb-4">Ready to Colorize Your Memories?</h3>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of users who have already transformed their black & white photos into vibrant memories.
            </p>
            <Button size="lg" className="text-base px-8" asChild>
              <Link href="/signup">
                Start Colorizing Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

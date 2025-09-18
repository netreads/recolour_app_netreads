"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Zap, Download, Sparkles, Star, ArrowRight, ImageIcon, Users, Clock } from "lucide-react";
import { getSession } from "@/lib/auth-client";

interface UserType {
  id: string;
  email: string;
}

export default function HomePage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const session = await getSession();
      const userData = (session && (session as any).user) || (session as any)?.data?.user || null;
      if (userData) {
        setUser({ id: userData.id, email: userData.email });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="space-y-6">
            <Badge variant="secondary" className="mx-auto animate-bounce">
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
            {!isLoading && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Button size="lg" className="text-base px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" asChild>
                    <Link href="/recolor">
                      Start Colorizing
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button size="lg" className="text-base px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" asChild>
                      <Link href="/signup">
                        Get Started Free
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="text-base px-8" asChild>
                      <Link href="/login">Sign In</Link>
                    </Button>
                  </>
                )}
              </div>
            )}
            
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

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-primary">50K+</div>
            <div className="text-muted-foreground">Photos Colorized</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-primary">10K+</div>
            <div className="text-muted-foreground">Happy Users</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-primary">99%</div>
            <div className="text-muted-foreground">Accuracy Rate</div>
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
          <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl">Upload Your Photo</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Simply drag and drop or select your black and white photo. We support all common image formats including JPG, PNG, and TIFF.
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl">AI Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Our advanced AI analyzes your image and intelligently applies realistic colors based on context, lighting, and historical accuracy.
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Download className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl">Download Result</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Get your beautifully colorized photo in high resolution, ready for sharing, printing, or preserving your family memories.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold">Why Choose ReColor AI?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience the difference with our cutting-edge technology and user-friendly platform
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto">
              <ImageIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold">High Quality</h3>
            <p className="text-sm text-muted-foreground">Professional-grade colorization with attention to detail</p>
          </div>
          
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold">Fast Processing</h3>
            <p className="text-sm text-muted-foreground">Get results in minutes, not hours</p>
          </div>
          
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mx-auto">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold">Easy to Use</h3>
            <p className="text-sm text-muted-foreground">No technical skills required, just upload and go</p>
          </div>
          
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center mx-auto">
              <Star className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold">Secure & Private</h3>
            <p className="text-sm text-muted-foreground">Your photos are processed securely and never stored</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-primary/10 to-blue-600/10 border-0 shadow-xl">
          <CardContent className="p-12 text-center">
            <h3 className="text-3xl font-bold mb-4">Ready to Colorize Your Memories?</h3>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              {user 
                ? `Welcome back, ${user.email.split('@')[0]}! Ready to transform more photos?`
                : "Join thousands of users who have already transformed their black & white photos into vibrant memories."
              }
            </p>
            {!isLoading && (
              <Button size="lg" className="text-base px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" asChild>
                <Link href={user ? "/recolor" : "/signup"}>
                  {user ? "Continue Colorizing" : "Start Colorizing Now"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Sparkles, Star, ArrowRight, ImageIcon, Shield, Award, CheckCircle, Quote } from "lucide-react";
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
    <>
      {/* SEO Structured Data for Video */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoObject",
            "name": "ReColor AI Demo Video",
            "description": "Watch how our AI transforms black and white photos into vibrant memories",
            "thumbnailUrl": "https://drive.google.com/thumbnail?id=1iya9BXxFIkCD3CHc6azrL5A1Pom7_6qu",
            "uploadDate": "2024-01-01",
            "duration": "PT30S",
            "contentUrl": "https://drive.google.com/file/d/1iya9BXxFIkCD3CHc6azrL5A1Pom7_6qu/view",
            "embedUrl": "https://drive.google.com/file/d/1iya9BXxFIkCD3CHc6azrL5A1Pom7_6qu/preview",
            "publisher": {
              "@type": "Organization",
              "name": "ReColor AI",
              "logo": {
                "@type": "ImageObject",
                "url": "/next.svg"
              }
            }
          })
        }}
      />
      <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-16 sm:pt-20 pb-12 sm:pb-16">
        <div className="text-center space-y-6 sm:space-y-8 max-w-5xl mx-auto">
          <div className="space-y-4 sm:space-y-6">
            <Badge variant="secondary" className="mx-auto bg-saffron-50 text-saffron-700 border-saffron-200 animate-pulse text-xs sm:text-sm">
              <Sparkles className="w-3 h-3 mr-1 animate-spin" />
              Trusted by 50,000+ Indian families 🇮🇳
            </Badge>
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-tight">
              Bring your family's
              <br />
              <span className="bg-gradient-to-r from-orange-500 to-green-600 bg-clip-text text-transparent">
                heritage to life
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
            Restore and colorize old or faded photos in full HD with professional-grade AI
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>Perfect for weddings, festivals, and your family’s timeless moments.
            </p>
          </div>
          
          <div className="space-y-6">
            {!isLoading && (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                {user ? (
                  <Button size="lg" className="text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4 bg-black text-white hover:bg-gray-800 rounded-xl font-semibold" asChild>
                    <Link href="/dashboard">
                      Start Colorizing Now
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button size="lg" className="text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-green-600 text-white hover:from-orange-600 hover:to-green-700 rounded-xl font-semibold" asChild>
                      <Link href="/signup">
                        Colorize Photos Free
                        <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4 border-gray-300 rounded-xl font-semibold" asChild>
                      <Link href="/login">Sign In</Link>
                    </Button>
                  </>
                )}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-gray-500 px-4">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span>Studio-quality AI colorization</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span>Restore old & damaged photos</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span>1 HD Photo free</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span>100% secure & private</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Before/After Images Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">See the magic in action</h2>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto px-4">
              Watch your family's precious memories transform into vibrant, lifelike images
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 sm:gap-12 max-w-8xl mx-auto">
            {/* Before/After Card 1 - Indian Wedding */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white overflow-hidden animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              <div className="relative">
                <div className="grid grid-cols-2">
                  <div className="relative">
                    <img 
                      src="/indian wedding original.jpg" 
                      alt="Indian wedding photo before colorization"
                      className="aspect-square object-cover w-full h-full"
                    />
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      Before
                    </div>
                  </div>
                  <div className="relative">
                    <img 
                      src="/indian wedding colour.jpg" 
                      alt="Indian wedding photo after colorization"
                      className="aspect-square object-cover w-full h-full"
                    />
                    <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                      After
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <CardContent className="p-8">
                <h3 className="font-semibold text-gray-900 mb-2">Family Wedding</h3>
                <p className="text-sm text-gray-600">Traditional Indian wedding photo with vibrant sarees, jewelry, and festive colors</p>
              </CardContent>
            </Card>

            {/* Before/After Card 2 - Grandfather */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white overflow-hidden animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <div className="relative">
                <div className="grid grid-cols-2">
                  <div className="relative">
                    <img 
                      src="/grandfather original.jpg" 
                      alt="Grandfather portrait before colorization"
                      className="aspect-square object-cover w-full h-full"
                    />
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      Before
                    </div>
                  </div>
                  <div className="relative">
                    <img 
                      src="/grandfather colour.jpg" 
                      alt="Grandfather portrait after colorization"
                      className="aspect-square object-cover w-full h-full"
                    />
                    <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                      After
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <CardContent className="p-8">
                <h3 className="font-semibold text-gray-900 mb-2">Grandfather's Portrait</h3>
                <p className="text-sm text-gray-600">Vintage portrait of an Indian grandfather, restored with lifelike colors</p>
              </CardContent>
            </Card>

            {/* Before/After Card 3 - Festival */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white overflow-hidden animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              <div className="relative">
                <div className="grid grid-cols-2">
                  <div className="relative">
                    <img 
                      src="/festival original.jpg" 
                      alt="Festival celebration before colorization"
                      className="aspect-square object-cover w-full h-full"
                    />
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      Before
                    </div>
                  </div>
                  <div className="relative">
                    <img 
                      src="/festival colour.jpg" 
                      alt="Festival celebration after colorization"
                      className="aspect-square object-cover w-full h-full"
                    />
                    <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                      After
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <CardContent className="p-8">
                <h3 className="font-semibold text-gray-900 mb-2">Festival Celebration</h3>
                <p className="text-sm text-gray-600">Diwali, Holi, or Durga Puja memories with vibrant festival colors and traditions</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">See ReColor AI in action</h2>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto px-4">
              Watch how our AI brings your family's heritage photos to life in real-time
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden shadow-xl sm:shadow-2xl hover:shadow-2xl sm:hover:shadow-3xl transition-all duration-300 animate-float">
              <iframe
                src="https://drive.google.com/file/d/1iya9BXxFIkCD3CHc6azrL5A1Pom7_6qu/preview"
                title="ReColor AI Demo Video - Watch how our AI transforms black and white photos into vibrant memories"
                className="w-full h-full"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                data-video-id="1iya9BXxFIkCD3CHc6azrL5A1Pom7_6qu"
                data-video-title="ReColor AI Demo Video"
                data-video-description="Watch how our AI transforms black and white photos into vibrant memories"
              />
              <div className="absolute top-4 right-4">
                <Badge className="bg-red-500 text-white">Live Demo</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section - Company Logos */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <p className="text-gray-600 text-sm font-medium">Trusted by Indian families and professionals</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap justify-center items-center gap-4 sm:gap-6 lg:gap-8 opacity-60">
            <div className="text-gray-400 font-semibold text-sm sm:text-base lg:text-lg text-center">Wedding Photographers</div>
            <div className="text-gray-400 font-semibold text-sm sm:text-base lg:text-lg text-center">Family Studios</div>
            <div className="text-gray-400 font-semibold text-sm sm:text-base lg:text-lg text-center">Heritage Museums</div>
            <div className="text-gray-400 font-semibold text-sm sm:text-base lg:text-lg text-center">Event Planners</div>
            <div className="text-gray-400 font-semibold text-sm sm:text-base lg:text-lg text-center">Photo Studios</div>
            <div className="text-gray-400 font-semibold text-sm sm:text-base lg:text-lg text-center">Archives</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Perfect for Indian families</h2>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto px-4">
              Your complete toolkit for preserving family heritage – everything you need in one place.
          </p>
        </div>
        
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
            <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-white" />
              </div>
                <CardTitle className="text-xl text-center">Indian Heritage Colors</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription className="text-center text-gray-600">
                  AI trained on Indian skin tones, traditional clothing colors, and cultural elements for authentic results.
              </CardDescription>
            </CardContent>
          </Card>
          
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
            <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
              </div>
                <CardTitle className="text-xl text-center">100% Secure</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription className="text-center text-gray-600">
                  Your family photos are processed securely in India. No data leaves the country, ensuring complete privacy.
              </CardDescription>
            </CardContent>
          </Card>
          
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
            <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-white" />
              </div>
                <CardTitle className="text-xl text-center">Instant Results</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription className="text-center text-gray-600">
                  Get beautiful colorized photos in seconds. Perfect for busy Indian families and wedding photographers.
              </CardDescription>
            </CardContent>
          </Card>
          </div>
        </div>
      </section>


      {/* Testimonials Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Loved by Indian families across the country</h2>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto px-4">
              See what our Indian users are saying about ReColor AI
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                </div>
                <Quote className="w-8 h-8 text-gray-300 mb-4" />
                <p className="text-gray-600 mb-4">
                  "बहुत बढ़िया! My grandmother's wedding photos look so authentic now. The colors are perfect for Indian skin tones."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                    PS
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Priya Sharma</div>
                    <div className="text-sm text-gray-500">Delhi Wedding Photographer</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                </div>
                <Quote className="w-8 h-8 text-gray-300 mb-4" />
                <p className="text-gray-600 mb-4">
                  "I've colorized over 200 family photos using ReColor AI. Perfect for our Diwali and wedding albums!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                    RK
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Rajesh Kumar</div>
                    <div className="text-sm text-gray-500">Mumbai Family Historian</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                </div>
                <Quote className="w-8 h-8 text-gray-300 mb-4" />
                <p className="text-gray-600 mb-4">
                  "The privacy-first approach sold me. I can colorize our family's sacred photos without worrying about data security."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                    AG
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Anita Gupta</div>
                    <div className="text-sm text-gray-500">Bangalore Digital Archivist</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
            </div>
      </section>


      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-4xl mx-auto text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-gray-900">50K+</div>
              <div className="text-gray-600">Photos Colorized</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-gray-900">10K+</div>
              <div className="text-gray-600">Happy Users</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-gray-900">99%</div>
              <div className="text-gray-600">Accuracy Rate</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-gray-900">24/7</div>
              <div className="text-gray-600">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Preserve your family's heritage today
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed px-4">
              ReColor AI gives you a way to bring your family's memories to life – fast, accurate, and secure.
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>Because preserving your family's history matters more than perfect timing.
            </p>
            
            <div className="space-y-6">
            {!isLoading && (
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                  {user ? (
                    <Button size="lg" className="text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4 bg-black text-white hover:bg-gray-800 rounded-xl font-semibold" asChild>
                      <Link href="/dashboard">
                        Continue Colorizing
                        <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button size="lg" className="text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-green-600 text-white hover:from-orange-600 hover:to-green-700 rounded-xl font-semibold" asChild>
                        <Link href="/signup">
                          Colorize Photos Free
                          <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
                      <Button size="lg" variant="outline" className="text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4 border-gray-300 rounded-xl font-semibold" asChild>
                        <Link href="/pricing">View Pricing</Link>
                      </Button>
                    </>
                  )}
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-gray-500 px-4">
                <div className="flex items-center">
                  <Award className="w-4 h-4 text-green-500 mr-2" />
                  <span>30-day money-back guarantee</span>
                </div>
                <div className="flex items-center">
                  <Shield className="w-4 h-4 text-green-500 mr-2" />
                  <span>Privacy-first processing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}

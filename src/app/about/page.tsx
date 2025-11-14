import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Heart, 
  Target, 
  Zap, 
  Shield, 
  Users, 
  TrendingUp, 
  Award,
  Brain,
  Globe,
  Clock,
  ImageIcon,
  Palette,
  Lock,
  Mail,
  MapPin,
  ArrowRight,
  BookOpen
} from "lucide-react";
import Link from "next/link";

// Enable ISR - revalidate every hour to reduce function invocations
export const revalidate = 3600;

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <div className="space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">About ReColor AI</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Preserving your family's heritage with cutting-edge AI technology. 
            We bring black and white memories to life, one photo at a time.
          </p>
        </div>

        {/* Mission Statement */}
        <Card className="bg-gradient-to-r from-orange-50 to-green-50 border-2 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-2xl">
              <Heart className="h-6 w-6 text-orange-600" />
              <span>Our Mission</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg text-gray-700 leading-relaxed">
              At ReColor AI, we believe that every family photo tells a story worth preserving. 
              Our mission is to make professional-quality photo colorization accessible to everyone, 
              especially Indian families who want to bring their heritage and memories to life. 
              We combine state-of-the-art artificial intelligence with a deep understanding of 
              Indian culture, traditions, and aesthetics to deliver authentic colorization results 
              that honor your family's legacy.
            </p>
            <p className="text-muted-foreground">
              Whether it's your grandparents' wedding, a festival celebration from decades ago, 
              or a treasured family portrait, we're here to help you rediscover your history in 
              vibrant, lifelike color.
            </p>
          </CardContent>
        </Card>

        {/* Our Story */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Our Story</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                ReColor AI was born from a simple yet powerful idea: everyone deserves to see 
                their family's history in color. In a country as culturally rich as India, where 
                family photos capture everything from traditional weddings to festival celebrations, 
                we recognized a need for photo colorization services that understand Indian 
                traditions, skin tones, and cultural nuances.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Founded in Bangalore, Karnataka, we set out to create an AI-powered platform that 
                could bring black and white photos to life with remarkable accuracy. Our team 
                spent countless hours training and fine-tuning our AI models to recognize and 
                accurately colorize Indian facial features, traditional clothing (sarees, dhotis, 
                sherwanis), jewelry, and cultural elements specific to the Indian subcontinent.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Since our launch, we've helped over <strong className="text-foreground">50,000+ families</strong> 
                across India colorize their precious memories. From wedding photographers preserving 
                decades-old wedding albums to families discovering their ancestors' portraits in 
                vibrant detail, we're proud to be part of preserving India's rich visual heritage.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Technology & Innovation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>Technology & Innovation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              ReColor AI is powered by Google Gemini AI, one of the most advanced artificial 
              intelligence models available. Our proprietary algorithms are specifically trained 
              to understand:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center space-x-2">
                  <Palette className="h-4 w-4" />
                  <span>Color Accuracy</span>
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Indian skin tones and complexions</li>
                  <li>• Traditional clothing colors and patterns</li>
                  <li>• Historical period-appropriate palettes</li>
                  <li>• Natural lighting and shadow recreation</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium flex items-center space-x-2">
                  <ImageIcon className="h-4 w-4" />
                  <span>Image Quality</span>
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• High-resolution output preservation</li>
                  <li>• Detail enhancement and restoration</li>
                  <li>• Automatic noise reduction</li>
                  <li>• Authentic texture preservation</li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Privacy First:</strong> All image processing happens 
                securely on our servers. Your family photos never leave our secure infrastructure 
                and are automatically deleted after processing to protect your privacy.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* What Makes Us Different */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>What Makes Us Different</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Instant Preview Before Payment</h4>
                    <p className="text-sm text-muted-foreground">
                      See your colorized photo before you pay. No surprises, no regrets. 
                      Only pay ₹79 when you're completely satisfied with the result.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Privacy-First Approach</h4>
                    <p className="text-sm text-muted-foreground">
                      Your images are processed securely in India. No data leaves the country, 
                      ensuring complete privacy and compliance with Indian data protection laws.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Palette className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Indian Heritage Focus</h4>
                    <p className="text-sm text-muted-foreground">
                      Our AI is specifically trained on Indian skin tones, traditional clothing, 
                      and cultural elements for authentic colorization results.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Lightning Fast Processing</h4>
                    <p className="text-sm text-muted-foreground">
                      Get your colorized photo in 30-60 seconds. No waiting hours or days 
                      for results—instant gratification for your family memories.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">No Sign-Up Required</h4>
                    <p className="text-sm text-muted-foreground">
                      Start colorizing immediately without creating an account. Simple, 
                      fast, and hassle-free experience from upload to download.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                    <Award className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">99% Accuracy Rate</h4>
                    <p className="text-sm text-muted-foreground">
                      Industry-leading accuracy in colorization. Our AI produces 
                      results that are both technically excellent and emotionally authentic.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary mb-2">50K+</div>
              <div className="text-sm text-muted-foreground">Photos Colorized</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary mb-2">10K+</div>
              <div className="text-sm text-muted-foreground">Happy Users</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary mb-2">99%</div>
              <div className="text-sm text-muted-foreground">Accuracy Rate</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </CardContent>
          </Card>
        </div>

        {/* Our Values */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="h-5 w-5" />
              <span>Our Values</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mx-auto">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-medium">Family First</h4>
                <p className="text-sm text-muted-foreground">
                  We understand that every photo is a treasured memory. We treat your 
                  family's history with the respect and care it deserves.
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center mx-auto">
                  <Lock className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-medium">Privacy & Security</h4>
                <p className="text-sm text-muted-foreground">
                  Your photos are yours. We never use your images for training without 
                  permission, and all data is processed securely in India.
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center mx-auto">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-medium">Continuous Innovation</h4>
                <p className="text-sm text-muted-foreground">
                  We're constantly improving our AI models and technology to deliver 
                  better, more accurate results with each update.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>How ReColor AI Works</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Upload Your Photo</h4>
                  <p className="text-sm text-muted-foreground">
                    Simply drag and drop or select a black and white photo from your device. 
                    We support JPEG, PNG, and WebP formats up to 10MB.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">AI Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    Our advanced AI analyzes your image, understanding context, lighting, 
                    and subject matter to create an authentic colorization. This takes 
                    just 30-60 seconds.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Preview & Decide</h4>
                  <p className="text-sm text-muted-foreground">
                    See your colorized photo with a preview watermark. Compare it side-by-side 
                    with the original to see the transformation before you pay.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Pay & Download</h4>
                  <p className="text-sm text-muted-foreground">
                    If you love the result, pay just ₹79 via UPI, PhonePe, or GPay and 
                    instantly download your high-resolution, watermark-free colorized photo.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Company Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Location</h4>
                    <p className="text-sm text-muted-foreground">
                      Whitefield<br />
                      Bangalore, Karnataka<br />
                      India - 560001
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Contact Us</h4>
                    <p className="text-sm text-muted-foreground">
                      Email: azcontent101@gmail.com<br />
                      Mobile: +91 7984837468<br />
                      Hours: Mon-Fri 9 AM - 6 PM IST
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Serving</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    While based in Bangalore, we serve families across India and around the world:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Wedding photographers and studios</li>
                    <li>• Family historians and archivists</li>
                    <li>• Heritage museums and archives</li>
                    <li>• Event planners and organizers</li>
                    <li>• Individual families preserving memories</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center space-y-6">
          <Separator />
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Ready to Preserve Your Family's Heritage?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join thousands of Indian families who have already brought their 
              black and white memories to life. Start colorizing your photos today—it's free to try!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700"
                asChild
              >
                <Link href="/#upload">
                  Start Colorizing Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                asChild
              >
                <Link href="/contact">
                  Contact Us
                  <Mail className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

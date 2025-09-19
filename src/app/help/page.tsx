import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HelpCircle, Search, Mail, MessageCircle, BookOpen, Zap, Shield, CreditCard } from "lucide-react";

export default function HelpPage() {
  const faqCategories = [
    {
      title: "Getting Started",
      icon: <Zap className="h-5 w-5" />,
      questions: [
        {
          question: "How do I get started with ReColor AI?",
          answer: "Simply sign up for an account and you'll receive 1 free HD credit to try our service. Upload a black and white photo, and our AI will colorize it for you."
        },
        {
          question: "What file formats are supported?",
          answer: "We support JPEG, PNG, and WebP formats. Images should be in black and white or grayscale for best results."
        },
        {
          question: "What's the maximum file size I can upload?",
          answer: "You can upload images up to 10MB in size. For best results, we recommend images between 1-5MB."
        }
      ]
    },
    {
      title: "Credits & Pricing",
      icon: <CreditCard className="h-5 w-5" />,
      questions: [
        {
          question: "How do credits work?",
          answer: "Each credit allows you to colorize one image. Credits never expire, so you can use them whenever you want. Get 1 free HD credit when you sign up!"
        },
        {
          question: "Do credits expire?",
          answer: "No, credits never expire! You can purchase credits and use them whenever you want. There's no rush to use them up."
        },
        {
          question: "What happens when I run out of credits?",
          answer: "When you run out of credits, you'll need to purchase more to continue colorizing images. You can buy credits anytime from our pricing page."
        },
        {
          question: "Do you offer refunds?",
          answer: "We offer a 30-day money-back guarantee for all credit purchases. If you're not satisfied, contact our support team for a full refund."
        }
      ]
    },
    {
      title: "Technical Support",
      icon: <Shield className="h-5 w-5" />,
      questions: [
        {
          question: "How long does colorization take?",
          answer: "Most images are processed within 30-60 seconds. Larger or more complex images may take up to 2 minutes."
        },
        {
          question: "Why did my colorization fail?",
          answer: "Colorization may fail if the image is too small, corrupted, or not in black and white. Please ensure your image is clear and in grayscale format."
        },
        {
          question: "Can I colorize color photos?",
          answer: "Our AI is specifically designed for black and white images. Color photos may not produce optimal results."
        },
        {
          question: "How do I download my colorized images?",
          answer: "Once processing is complete, you can download your colorized image directly from the results page. Images are available in their original resolution."
        }
      ]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <div className="space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <HelpCircle className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Help Center</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions and get support for ReColor AI. 
            Can't find what you're looking for? Contact our support team.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search for help articles..." 
              className="pl-10"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Email Support</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Get help via email within 24 hours
              </p>
              <Button variant="outline" className="w-full">
                Send Email
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <MessageCircle className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Live Chat</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Chat with our support team in real-time
              </p>
              <Button variant="outline" className="w-full">
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Documentation</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Browse our comprehensive guides
              </p>
              <Button variant="outline" className="w-full">
                View Docs
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-center">Frequently Asked Questions</h2>
          
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="space-y-4">
              <div className="flex items-center space-x-2">
                {category.icon}
                <h3 className="text-xl font-semibold">{category.title}</h3>
              </div>
              
              <div className="grid gap-4">
                {category.questions.map((faq, faqIndex) => (
                  <Card key={faqIndex}>
                    <CardHeader>
                      <CardTitle className="text-lg">{faq.question}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {categoryIndex < faqCategories.length - 1 && (
                <Separator className="my-8" />
              )}
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle>Still Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Can't find the answer you're looking for? Send us a message and we'll get back to you as soon as possible.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="your@email.com" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="What can we help you with?" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <textarea 
                id="message" 
                className="w-full min-h-[120px] px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Describe your issue or question in detail..."
              />
            </div>
            
            <Button className="w-full">
              Send Message
            </Button>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold">Other Ways to Reach Us</h3>
          <div className="flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-8">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">support@recolorai.com</span>
            </div>
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Live chat available 9 AM - 6 PM IST</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

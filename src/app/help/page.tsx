import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HelpCircle, Mail, MessageCircle, Zap, Shield, CreditCard } from "lucide-react";

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
          answer: "When you run out of credits, you'll need to purchase more to continue colorizing images. Contact our support team to purchase credits."
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


        {/* Contact Information */}
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold">Other Ways to Reach Us</h3>
          <div className="flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-8">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">azcontent101@gmail.com</span>
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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HelpCircle, Zap, CreditCard, Shield, Download, Upload, Image, Settings } from "lucide-react";

// Enable ISR - revalidate every hour to reduce function invocations
export const revalidate = 3600;

export default function FaqPage() {
  const faqCategories = [
    {
      title: "Getting Started",
      icon: <Zap className="h-5 w-5" />,
      questions: [
        {
          question: "How do I get started with ReColor AI?",
          answer: "Simply visit our homepage and upload a black and white photo. Our AI will colorize it and show you a preview. Pay ₹79 to download the full HD version - no sign up required!"
        },
        {
          question: "What file formats are supported?",
          answer: "We support JPEG, PNG, and WebP formats. Images should be in black and white or grayscale for best results."
        },
        {
          question: "What's the maximum file size I can upload?",
          answer: "You can upload images up to 10MB in size. For best results, we recommend images between 1-5MB."
        },
        {
          question: "Do I need to create an account to use ReColor AI?",
          answer: "No! You can upload, preview, and pay for your colorized images without creating an account. Simply upload your photo and pay to download the HD version."
        },
        {
          question: "Is there a mobile app available?",
          answer: "Currently, ReColor AI is available as a web application that works on all devices including mobile phones and tablets. We're working on dedicated mobile apps for iOS and Android."
        }
      ]
    },
    {
      title: "Credits & Pricing",
      icon: <CreditCard className="h-5 w-5" />,
      questions: [
        {
          question: "How does pricing work?",
          answer: "Each colorized image costs ₹79. You upload your photo, preview the colorized result for free, and only pay when you're happy with it and want to download the HD version."
        },
        {
          question: "Can I preview before paying?",
          answer: "Yes! Upload your photo and see a preview of the colorized result for free. You only pay ₹79 when you want to download the full HD version."
        },
        {
          question: "Do you offer refunds?",
          answer: "We offer a 30-day money-back guarantee for all purchases. If you're not satisfied with your colorized image, contact our support team for a full refund."
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major credit cards, debit cards, and digital wallets. All payments are processed securely through our payment partners."
        },
        {
          question: "Are there any bulk discounts?",
          answer: "Currently, each image costs ₹79. For bulk orders or enterprise needs, please contact our support team for special pricing."
        }
      ]
    },
    {
      title: "Image Upload & Processing",
      icon: <Upload className="h-5 w-5" />,
      questions: [
        {
          question: "What types of images work best for colorization?",
          answer: "Black and white or grayscale images work best. High-contrast images with clear details typically produce better results than low-contrast or blurry images."
        },
        {
          question: "Can I upload color photos?",
          answer: "Our AI is specifically designed for black and white images. While you can upload color photos, the results may not be optimal as the AI expects grayscale input."
        },
        {
          question: "How long does colorization take?",
          answer: "Most images are processed within 30-60 seconds. Larger or more complex images may take up to 2 minutes."
        },
        {
          question: "Why did my colorization fail?",
          answer: "Colorization may fail if the image is too small, corrupted, or not in black and white. Please ensure your image is clear and in grayscale format."
        },
        {
          question: "Can I cancel a colorization job?",
          answer: "Once a colorization job has started, it cannot be cancelled. However, if it fails, you won't be charged a credit."
        }
      ]
    },
    {
      title: "Results & Downloads",
      icon: <Download className="h-5 w-5" />,
      questions: [
        {
          question: "How do I download my colorized images?",
          answer: "Once processing is complete, you can download your colorized image directly from the results page. Images are available in their original resolution."
        },
        {
          question: "What resolution will my colorized image be?",
          answer: "Your colorized image will maintain the same resolution as your original image. We don't upscale or downscale your images."
        },
        {
          question: "How long can I download my image?",
          answer: "After payment, you can download your colorized image immediately. We recommend downloading it right away and saving it to your device."
        },
        {
          question: "Can I request a different colorization result?",
          answer: "Our AI produces consistent results, but if you're not satisfied, you can try uploading the same image again to see another preview before paying."
        },
        {
          question: "Can I share my colorized images?",
          answer: "Yes! You can share your colorized images on social media or with friends. We encourage you to showcase your results!"
        }
      ]
    },
    {
      title: "Technical Support",
      icon: <Shield className="h-5 w-5" />,
      questions: [
        {
          question: "What browsers are supported?",
          answer: "ReColor AI works on all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your browser."
        },
        {
          question: "Do you have an API for developers?",
          answer: "Yes! We offer a REST API for developers who want to integrate ReColor AI into their applications. Contact our support team for API access."
        },
        {
          question: "Is my data secure?",
          answer: "Yes, we take data security seriously. All images are encrypted in transit and at rest. We don't use your images for training our AI without explicit permission."
        },
        {
          question: "What if I encounter technical issues?",
          answer: "If you encounter any technical issues, please contact our support team. We typically respond within 24 hours and will help resolve your problem."
        },
        {
          question: "Can I use ReColor AI commercially?",
          answer: "Yes, you can use ReColor AI for commercial purposes. However, please review our Terms of Service for specific usage guidelines."
        }
      ]
    },
    {
      title: "Usage & History",
      icon: <Settings className="h-5 w-5" />,
      questions: [
        {
          question: "Can I colorize multiple images at once?",
          answer: "Currently, you can upload and process one image at a time. For bulk processing needs, please contact our support team."
        },
        {
          question: "Do I need to save my images somewhere?",
          answer: "Yes, we recommend downloading your colorized images immediately after purchase and saving them to your device or cloud storage."
        },
        {
          question: "Can I redownload my images later?",
          answer: "We recommend downloading your images right away. For redownload requests, please contact our support team with your order details."
        },
        {
          question: "What happens to my uploaded images?",
          answer: "Your images are stored temporarily for processing and then automatically deleted from our servers after a short period for your privacy."
        },
        {
          question: "Can I use ReColor AI offline?",
          answer: "No, ReColor AI requires an internet connection to process images using our cloud-based AI technology."
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
            <h1 className="text-4xl font-bold tracking-tight">Frequently Asked Questions</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find answers to the most common questions about ReColor AI. 
            Can't find what you're looking for? Contact our support team.
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
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
          <h3 className="text-xl font-semibold">Still Need Help?</h3>
          <p className="text-muted-foreground">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-8">
            <div className="flex items-center space-x-2">
              <Image className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">help@netreads.in</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Response within 24 hours</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
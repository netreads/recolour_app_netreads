import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mail, MapPin, Clock, MessageCircle } from "lucide-react";

// Enable ISR - revalidate every hour to reduce function invocations
export const revalidate = 3600;

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <div className="space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Contact Us</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have a question, suggestion, or need support? We'd love to hear from you. 
            Get in touch with our team and we'll respond as soon as possible.
          </p>
          <p className="text-sm text-muted-foreground">
            For payment-related queries, refund requests, or technical support, please contact us using the information below.
          </p>
        </div>

        {/* Contact Information */}
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Contact Details */}
            <Card>
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Email Support</h4>
                    <p className="text-sm text-muted-foreground">help@netreads.in</p>
                    <p className="text-sm text-muted-foreground">For general inquiries and support</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Business Inquiries</h4>
                    <p className="text-sm text-muted-foreground">help@netreads.in</p>
                    <p className="text-sm text-muted-foreground">For partnerships and business opportunities</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <MessageCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Chat Support</h4>
                    <p className="text-sm text-muted-foreground">Available 9 AM - 6 PM IST</p>
                    <p className="text-sm text-muted-foreground">For immediate assistance</p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Mobile:</span> +91 7984837468
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Office Information */}
            <Card>
              <CardHeader>
                <CardTitle>Our Office</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Registered Business Address</h4>
                    <p className="text-sm text-muted-foreground">
                      ReColor AI<br />
                      Whitefield<br />
                      Bangalore, Karnataka<br />
                      India - 560001
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      
  
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Business Hours</h4>
                    <p className="text-sm text-muted-foreground">
                      Monday - Friday: 9:00 AM - 6:00 PM IST<br />
                      Saturday: 10:00 AM - 4:00 PM IST<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

        </div>

        {/* Additional Information */}
        <div className="text-center space-y-4">
          <Separator />
          <h3 className="text-xl font-semibold">Before You Contact Us</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="space-y-2">
              <h4 className="font-medium">Check Our FAQ</h4>
              <p className="text-sm text-muted-foreground">
                Many common questions are answered in our comprehensive FAQ section.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Include Details</h4>
              <p className="text-sm text-muted-foreground">
                Please provide as much detail as possible to help us assist you better.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Be Patient</h4>
              <p className="text-sm text-muted-foreground">
                We respond to all inquiries within our stated response times.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

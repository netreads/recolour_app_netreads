import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Truck, Package, Clock, Globe, Mail, CheckCircle, AlertCircle } from "lucide-react";

// Enable ISR - revalidate every hour to reduce function invocations
export const revalidate = 3600;

export default function ShippingPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Truck className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Shipping & Delivery Policy</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            ReColor AI is a digital service platform. This policy explains how we deliver our 
            digital image colorization services to you.
          </p>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Digital Service Delivery */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Digital Service Delivery</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              ReColor AI provides digital image colorization services. Since our services are 
              delivered digitally, there is no physical shipping involved. Your colorized images 
              are delivered instantly through our online platform.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Instant Digital Delivery</p>
                  <p className="text-sm text-blue-700 mt-1">
                    All colorized images are delivered immediately upon completion of processing. 
                    No shipping charges, no waiting time, no physical delivery required.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Process */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Delivery Process & Timeline</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Our digital delivery process is designed to be fast, efficient, and user-friendly. 
              Here's how it works:
            </p>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Step-by-Step Delivery Process</h4>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">1</div>
                    <div>
                      <h5 className="font-medium text-sm">Upload Your Image</h5>
                      <p className="text-sm text-muted-foreground mt-1">
                        Upload your black and white image through our secure platform. 
                        The upload is instant and your image is immediately queued for processing.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</div>
                    <div>
                      <h5 className="font-medium text-sm">AI Processing</h5>
                      <p className="text-sm text-muted-foreground mt-1">
                        Our AI technology processes your image. Typical processing time ranges 
                        from 30 seconds to 3 minutes depending on image size and complexity.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</div>
                    <div>
                      <h5 className="font-medium text-sm">Instant Delivery</h5>
                      <p className="text-sm text-muted-foreground mt-1">
                        Once processing is complete, your colorized image is immediately available 
                        for download from your dashboard. You'll receive a notification when it's ready.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">4</div>
                    <div>
                      <h5 className="font-medium text-sm">Download & Access</h5>
                      <p className="text-sm text-muted-foreground mt-1">
                        Download your colorized image in high resolution. Your images remain 
                        accessible in your account for 30 days from the date of processing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Delivery Timeframes</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium">Standard Processing</span>
                    <span className="text-sm text-muted-foreground">30 seconds - 3 minutes</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium">High-Resolution Images</span>
                    <span className="text-sm text-muted-foreground">1-5 minutes</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium">Batch Processing</span>
                    <span className="text-sm text-muted-foreground">5-15 minutes</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium">Image Availability</span>
                    <span className="text-sm text-muted-foreground">30 days from processing</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Access & Download */}
        <Card>
          <CardHeader>
            <CardTitle>Access & Download</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              All colorized images are delivered digitally through our secure platform. 
              You can access and download your images at any time from your account dashboard.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">Download Options</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• High-resolution colorized images</li>
                  <li>• Multiple format support (JPEG, PNG)</li>
                  <li>• Direct download from dashboard</li>
                  <li>• Secure download links</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Access Period</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Images available for 30 days</li>
                  <li>• Unlimited downloads during access period</li>
                  <li>• Download history in your account</li>
                  <li>• Email notifications for completed jobs</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Availability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Service Availability</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Our digital services are available 24/7, allowing you to upload and process images 
              at any time from anywhere in the world.
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Global Availability</h4>
                <p className="text-sm text-muted-foreground">
                  Our services are accessible worldwide. There are no geographical restrictions 
                  on where you can use our platform or receive your colorized images.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Service Hours</h4>
                <p className="text-sm text-muted-foreground">
                  While our platform is available 24/7, customer support is available during 
                  business hours (Monday - Friday, 9:00 AM - 6:00 PM IST). Processing continues 
                  to work around the clock.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">System Maintenance</h4>
                <p className="text-sm text-muted-foreground">
                  We may occasionally perform scheduled maintenance to improve our services. 
                  We'll notify users in advance of any planned downtime that may affect service delivery.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Issues & Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              If you experience any issues accessing or downloading your colorized images, 
              we're here to help. Most issues can be resolved quickly.
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Common Issues</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Image not appearing in dashboard - Check your account and refresh the page</li>
                  <li>• Download link not working - Try a different browser or clear cache</li>
                  <li>• Processing taking longer than expected - Check system status or contact support</li>
                  <li>• Image quality concerns - Contact support for assistance</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Important Notice</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      If you're unable to access your colorized images after processing, please 
                      contact our support team immediately. We'll ensure you receive your images 
                      or provide a full refund if we cannot deliver the service.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* No Physical Shipping */}
        <Card>
          <CardHeader>
            <CardTitle>No Physical Shipping Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Since ReColor AI provides digital services only, there is no physical shipping involved. 
              This means:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-green-700">Benefits</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• No shipping charges or delivery fees</li>
                  <li>• Instant delivery upon processing completion</li>
                  <li>• No risk of damage or loss during transit</li>
                  <li>• Accessible from anywhere in the world</li>
                  <li>• Environmentally friendly - no packaging waste</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">What This Means</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• All services are delivered digitally</li>
                  <li>• No courier services or postal delivery</li>
                  <li>• No tracking numbers or shipping addresses needed</li>
                  <li>• No customs or import duties</li>
                  <li>• No physical product returns</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment & Delivery */}
        <Card>
          <CardHeader>
            <CardTitle>Payment & Delivery Relationship</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Payment processing is handled securely through payment processors. 
              Once payment is confirmed, your order is immediately processed and delivered digitally.
            </p>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium">Payment Confirmation</span>
                <span className="text-sm text-muted-foreground">Instant</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium">Order Processing</span>
                <span className="text-sm text-muted-foreground">Automatic upon payment</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium">Digital Delivery</span>
                <span className="text-sm text-muted-foreground">30 seconds - 5 minutes</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium">Delivery Confirmation</span>
                <span className="text-sm text-muted-foreground">Email notification sent</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Policy Updates */}
        <Card>
          <CardHeader>
            <CardTitle>Policy Updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We may update this Shipping & Delivery Policy from time to time to reflect changes 
              in our services, delivery methods, or legal requirements.
            </p>
            
            <div className="space-y-2">
              <h4 className="font-medium">How We Notify You</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Updates to the "Last updated" date at the top of this policy</li>
                <li>• Email notifications for significant changes</li>
                <li>• Website announcements for major policy revisions</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <div className="text-center space-y-4">
          <Separator />
          <h3 className="text-xl font-semibold">Questions About Delivery?</h3>
          <p className="text-muted-foreground">
            If you have any questions about our shipping and delivery policy or need assistance 
            accessing your colorized images, please don't hesitate to contact us.
          </p>
          <div className="flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-4">
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              help@netreads.in
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Our support team is available Monday - Friday, 9:00 AM - 6:00 PM IST to assist you.
          </p>
        </div>
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { FileText, Shield, AlertTriangle, CreditCard, Users, Globe, Mail, Scale } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            These Terms of Service govern your use of ReColor AI and our image colorization services. 
            Please read them carefully before using our platform.
          </p>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Acceptance of Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Scale className="h-5 w-5" />
              <span>Acceptance of Terms</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              By accessing and using ReColor AI, you accept and agree to be bound by the terms 
              and provisions of this agreement. If you do not agree to these terms, please do not use our service.
            </p>
            
            <div className="space-y-2">
              <h4 className="font-medium">Agreement to Terms</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• You must be at least 13 years old to use our services</li>
                <li>• You must have the legal capacity to enter into this agreement</li>
                <li>• You agree to comply with all applicable laws and regulations</li>
                <li>• You understand that these terms may be updated from time to time</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Service Description */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Service Description</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              ReColor AI provides artificial intelligence-powered image colorization services. 
              Our platform allows users to upload black and white images and receive colorized versions 
              using advanced AI technology.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">Core Services</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• AI-powered image colorization</li>
                  <li>• High-quality image processing</li>
                  <li>• Secure image storage and processing</li>
                  <li>• User account management</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Additional Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Credit-based pricing system</li>
                  <li>• API access for developers</li>
                  <li>• Batch processing capabilities</li>
                  <li>• Customer support services</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>User Accounts</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              To use our services, you must create an account and provide accurate, complete information. 
              You are responsible for maintaining the security of your account.
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Account Requirements</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Provide accurate and complete registration information</li>
                  <li>• Maintain the confidentiality of your account credentials</li>
                  <li>• Notify us immediately of any unauthorized access</li>
                  <li>• Accept responsibility for all activities under your account</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Account Termination</h4>
                <p className="text-sm text-muted-foreground">
                  We reserve the right to suspend or terminate accounts that violate these terms 
                  or engage in fraudulent or illegal activities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Use License */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Use License</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We grant you a limited, non-exclusive, non-transferable license to use our services 
              in accordance with these terms.
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Permitted Uses</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Personal, non-commercial use of colorized images</li>
                  <li>• Educational and research purposes</li>
                  <li>• Integration with your applications via our API</li>
                  <li>• Sharing colorized images with proper attribution</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Restrictions</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• No reverse engineering or decompilation of our technology</li>
                  <li>• No resale or redistribution of our services</li>
                  <li>• No use for illegal or harmful purposes</li>
                  <li>• No violation of intellectual property rights</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>User Content</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You retain ownership of any images you upload to our service. By uploading content, 
              you grant us permission to process and enhance your images using our AI technology.
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Your Rights</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• You retain ownership of your original images</li>
                  <li>• You own the rights to colorized versions of your images</li>
                  <li>• You can download and use colorized images as you see fit</li>
                  <li>• You can delete your images from our platform at any time</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Your Responsibilities</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Ensure you have the right to upload and process images</li>
                  <li>• Do not upload copyrighted material without permission</li>
                  <li>• Do not upload inappropriate, illegal, or harmful content</li>
                  <li>• Respect the privacy and rights of others</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Our Rights</h4>
                <p className="text-sm text-muted-foreground">
                  We may process, store, and analyze your images to provide our services and improve 
                  our AI technology. We do not claim ownership of your content.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Payment Terms</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Our services operate on a credit-based system. You purchase credits to use our 
              colorization services. All payments are processed securely through third-party providers.
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Credit System</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Credits are required to colorize images</li>
                  <li>• Credits never expire and can be used anytime</li>
                  <li>• Credits are non-refundable except as required by law</li>
                  <li>• Pricing and credit requirements may change with notice</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Payment Processing</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Payments are processed by secure third-party providers</li>
                  <li>• We do not store your payment information</li>
                  <li>• All transactions are encrypted and secure</li>
                  <li>• Refunds are available within 30 days of purchase</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prohibited Uses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Prohibited Uses</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You may not use our services for any unlawful purpose or in any way that could 
              damage, disable, overburden, or impair our platform.
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Prohibited Activities</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Uploading copyrighted material without permission</li>
                  <li>• Uploading inappropriate, illegal, or harmful content</li>
                  <li>• Attempting to reverse engineer our AI technology</li>
                  <li>• Using our services for commercial purposes without permission</li>
                  <li>• Violating any applicable laws or regulations</li>
                  <li>• Interfering with the proper functioning of our services</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Consequences</h4>
                <p className="text-sm text-muted-foreground">
                  Violation of these terms may result in immediate termination of your account 
                  and legal action where appropriate.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Availability */}
        <Card>
          <CardHeader>
            <CardTitle>Service Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We strive to maintain high availability of our service, but we do not guarantee 
              uninterrupted access. We reserve the right to modify or discontinue the service 
              with or without notice.
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Service Level</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• We aim for 99.9% uptime but cannot guarantee it</li>
                  <li>• Scheduled maintenance will be announced in advance</li>
                  <li>• Emergency maintenance may occur without notice</li>
                  <li>• Processing times may vary based on system load</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Service Modifications</h4>
                <p className="text-sm text-muted-foreground">
                  We may modify, suspend, or discontinue any part of our services at any time. 
                  We will provide reasonable notice for significant changes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Intellectual Property */}
        <Card>
          <CardHeader>
            <CardTitle>Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              All content, features, and functionality of our platform are owned by ReColor AI 
              and are protected by copyright, trademark, and other intellectual property laws.
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Our Intellectual Property</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• AI algorithms and colorization technology</li>
                  <li>• Website design, layout, and user interface</li>
                  <li>• Software, code, and technical implementations</li>
                  <li>• Trademarks, logos, and branding materials</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Respect for IP Rights</h4>
                <p className="text-sm text-muted-foreground">
                  You agree not to infringe upon our intellectual property rights or the rights 
                  of third parties. Any unauthorized use is strictly prohibited.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Limitation of Liability */}
        <Card>
          <CardHeader>
            <CardTitle>Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              To the maximum extent permitted by law, ReColor AI shall not be liable for any 
              indirect, incidental, special, consequential, or punitive damages.
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Disclaimer of Warranties</h4>
                <p className="text-sm text-muted-foreground">
                  Our services are provided "as is" without warranties of any kind, either express 
                  or implied, including but not limited to warranties of merchantability or fitness for a particular purpose.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Limitation of Damages</h4>
                <p className="text-sm text-muted-foreground">
                  Our total liability to you for any damages arising from or related to these terms 
                  or our services shall not exceed the amount you paid us in the 12 months preceding the claim.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Indemnification */}
        <Card>
          <CardHeader>
            <CardTitle>Indemnification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You agree to indemnify and hold harmless ReColor AI from any claims, damages, 
              or expenses arising from your use of our services or violation of these terms.
            </p>
          </CardContent>
        </Card>

        {/* Governing Law */}
        <Card>
          <CardHeader>
            <CardTitle>Governing Law</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              These terms shall be governed by and construed in accordance with the laws of India, 
              without regard to conflict of law principles.
            </p>
            
            <div className="space-y-2">
              <h4 className="font-medium">Dispute Resolution</h4>
              <p className="text-sm text-muted-foreground">
                Any disputes arising from these terms or our services shall be resolved through 
                binding arbitration in accordance with the Arbitration and Conciliation Act, 2015.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Changes to Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We may update these Terms of Service from time to time to reflect changes in our 
              practices or for other operational, legal, or regulatory reasons.
            </p>
            
            <div className="space-y-2">
              <h4 className="font-medium">How We Notify You</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• We'll update the "Last updated" date at the top of these terms</li>
                <li>• For significant changes, we'll notify you via email or website notice</li>
                <li>• Continued use of our services after changes constitutes acceptance</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <div className="text-center space-y-4">
          <Separator />
          <h3 className="text-xl font-semibold">Questions About These Terms?</h3>
          <p className="text-muted-foreground">
            If you have any questions about these Terms of Service, please don't hesitate to contact us.
          </p>
          <div className="flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-4">
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              legal@recolorai.com
            </Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Contact Legal Team
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
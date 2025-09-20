import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Shield, Eye, Database, Users, Globe, Lock, Mail } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your privacy is important to us. This Privacy Policy explains how ReColor AI collects, 
            uses, and protects your personal information when you use our services.
          </p>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Information We Collect */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Information We Collect</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              We collect information you provide directly to us, such as when you create an account, 
              upload images, or contact us for support. We also collect certain information automatically 
              when you use our services.
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Information You Provide</h4>
                <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                  <li>Account information (email address, name, password)</li>
                  <li>Images you upload for colorization</li>
                  <li>Payment information (processed securely by third-party providers)</li>
                  <li>Communication preferences and support requests</li>
                  <li>Profile information and settings</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Information We Collect Automatically</h4>
                <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                  <li>Usage data and analytics (pages visited, features used)</li>
                  <li>Device information (browser type, operating system)</li>
                  <li>IP address and general location information</li>
                  <li>Cookies and similar tracking technologies</li>
                  <li>Performance and error logs</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How We Use Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>How We Use Your Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We use the information we collect to provide, maintain, and improve our services, 
              as well as to communicate with you about your account and our services.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">Service Provision</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Process and colorize your uploaded images</li>
                  <li>• Maintain your account and preferences</li>
                  <li>• Process payments and manage credits</li>
                  <li>• Provide customer support</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Service Improvement</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Analyze usage patterns and performance</li>
                  <li>• Improve our AI algorithms</li>
                  <li>• Develop new features and services</li>
                  <li>• Ensure platform security and stability</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Information Sharing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Information Sharing and Disclosure</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We do not sell, trade, or otherwise transfer your personal information to third parties 
              without your consent, except as described in this policy.
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Service Providers</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  We may share your information with trusted third-party service providers who assist us in:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                  <li>Payment processing and billing</li>
                  <li>Cloud storage and hosting services</li>
                  <li>Analytics and performance monitoring</li>
                  <li>Customer support and communication</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Legal Requirements</h4>
                <p className="text-sm text-muted-foreground">
                  We may disclose your information if required by law or to protect our rights, 
                  property, or safety, or that of our users or the public.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>Data Security</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We implement appropriate technical and organizational security measures to protect 
              your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">Technical Safeguards</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• SSL/TLS encryption for data transmission</li>
                  <li>• Encrypted storage of sensitive data</li>
                  <li>• Regular security audits and updates</li>
                  <li>• Access controls and authentication</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Organizational Safeguards</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Employee training on data protection</li>
                  <li>• Limited access to personal information</li>
                  <li>• Incident response procedures</li>
                  <li>• Regular policy reviews and updates</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card>
          <CardHeader>
            <CardTitle>Data Retention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We retain your personal information for as long as necessary to provide our services 
              and fulfill the purposes outlined in this policy.
            </p>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Account Information</span>
                <span className="text-sm text-muted-foreground">Until account deletion</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Uploaded Images</span>
                <span className="text-sm text-muted-foreground">30 days after processing</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Usage Analytics</span>
                <span className="text-sm text-muted-foreground">2 years</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Support Communications</span>
                <span className="text-sm text-muted-foreground">3 years</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card>
          <CardHeader>
            <CardTitle>Your Privacy Rights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Depending on your location, you may have certain rights regarding your personal information. 
              We respect these rights and provide you with the ability to exercise them.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">Access and Control</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Access your personal information</li>
                  <li>• Update or correct your information</li>
                  <li>• Delete your account and data</li>
                  <li>• Export your data</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Communication Preferences</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Opt out of marketing communications</li>
                  <li>• Manage notification preferences</li>
                  <li>• Control cookie settings</li>
                  <li>• Request data portability</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* International Transfers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>International Data Transfers</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your information may be transferred to and processed in countries other than your own. 
              We ensure appropriate safeguards are in place to protect your information during such transfers.
            </p>
            
            <div className="space-y-2">
              <h4 className="font-medium">Safeguards Include:</h4>
              <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                <li>Standard contractual clauses approved by relevant authorities</li>
                <li>Adequacy decisions for countries with equivalent protection</li>
                <li>Certification schemes and codes of conduct</li>
                <li>Technical and organizational measures to ensure security</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Children's Privacy */}
        <Card>
          <CardHeader>
            <CardTitle>Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Our services are not intended for children under 13 years of age. We do not knowingly 
              collect personal information from children under 13. If you are a parent or guardian and 
              believe your child has provided us with personal information, please contact us.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Policy */}
        <Card>
          <CardHeader>
            <CardTitle>Changes to This Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time to reflect changes in our practices 
              or for other operational, legal, or regulatory reasons.
            </p>
            
            <div className="space-y-2">
              <h4 className="font-medium">How We Notify You</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• We'll update the "Last updated" date at the top of this policy</li>
                <li>• For significant changes, we'll notify you via email or website notice</li>
                <li>• Continued use of our services after changes constitutes acceptance</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <div className="text-center space-y-4">
          <Separator />
          <h3 className="text-xl font-semibold">Questions About Privacy?</h3>
          <p className="text-muted-foreground">
            If you have any questions about this Privacy Policy or our data practices, 
            please don't hesitate to contact us.
          </p>
          <div className="flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-4">
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              privacy@recolorai.com
            </Button>
            <Button variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Data Protection Officer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
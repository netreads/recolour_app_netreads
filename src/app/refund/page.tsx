import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { RefreshCw, CreditCard, Clock, Shield, AlertCircle, CheckCircle, XCircle, Mail, FileText } from "lucide-react";

// Enable ISR - revalidate every hour to reduce function invocations
export const revalidate = 3600;

export default function RefundPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <RefreshCw className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Refund & Cancellation Policy</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We want you to be completely satisfied with ReColor AI. Our refund and cancellation policy 
            is designed to be fair and transparent for all our users.
          </p>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Refund Policy Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Refund Policy Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              At ReColor AI, we believe in providing exceptional service and are committed to your satisfaction. 
              Our refund policy is designed to protect both our customers and our business while ensuring fair treatment for everyone.
              All payments are processed securely through payment processors, and refunds are processed in accordance 
              with Razorpay's policies and applicable Indian laws.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>What's Covered</span>
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Technical failures preventing image processing</li>
                  <li>• Credit purchases that were not delivered</li>
                  <li>• Duplicate or accidental charges</li>
                  <li>• Service outages lasting more than 24 hours</li>
                  <li>• Billing errors and unauthorized charges</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>What's Not Covered</span>
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Dissatisfaction with colorization results</li>
                  <li>• Change of mind after successful processing</li>
                  <li>• Requests made after 10 days of purchase</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credit Refund Policy */}
       
        {/* Refund Process */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>How to Request a Refund</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              To request a refund, please follow our simple process. Most refund requests are processed 
              within 3-5 business days.
            </p>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Step-by-Step Process</h4>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">1</div>
                    <div>
                      <h5 className="font-medium text-sm">Contact Support</h5>
                      <p className="text-sm text-muted-foreground mt-1">
                        Email us at help@netreads.in with your refund request. Include your account email and order details.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</div>
                    <div>
                      <h5 className="font-medium text-sm">Provide Information</h5>
                      <p className="text-sm text-muted-foreground mt-1">
                        Include your order ID, purchase date, and reason for the refund request. Detailed information helps us process faster.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</div>
                    <div>
                      <h5 className="font-medium text-sm">Review Process</h5>
                      <p className="text-sm text-muted-foreground mt-1">
                        Our team will review your request within 24 hours and verify the eligibility based on our policy.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">4</div>
                    <div>
                      <h5 className="font-medium text-sm">Refund Processing</h5>
                      <p className="text-sm text-muted-foreground mt-1">
                        If approved, refunds are processed through payment processors within 3-5 business days 
                        to your original payment method (credit card, debit card, UPI, net banking, or wallet).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Required Information</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Your registered email address</li>
                  <li>• Order ID or transaction reference</li>
                  <li>• Date of purchase</li>
                  <li>• Detailed reason for refund request</li>
                  <li>• Screenshots (if technical issue)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Processing Timeframes */}
        <Card>
          <CardHeader>
            <CardTitle>Processing Timeframes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We strive to process all refund requests as quickly as possible. Here are our typical timeframes:
            </p>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium">Support Response</span>
                <span className="text-sm text-muted-foreground">Within 24 hours</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium">Review & Approval</span>
                <span className="text-sm text-muted-foreground">1-2 business days</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium">Credit/Debit Card Refunds</span>
                <span className="text-sm text-muted-foreground">3-5 business days</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium">UPI Refunds</span>
                <span className="text-sm text-muted-foreground">3-5 business days</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium">Net Banking Refunds</span>
                <span className="text-sm text-muted-foreground">5-7 business days</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium">Wallet Refunds</span>
                <span className="text-sm text-muted-foreground">3-5 business days</span>
              </div>
             
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Processing Note</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Refund processing times may vary during holidays or peak periods. All refunds are processed 
                    through payment processors, and the actual credit to your account depends on your bank 
                    or payment provider. We'll keep you updated throughout the process via email.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Cancellation */}
        <Card>
          <CardHeader>
            <CardTitle>Account Cancellation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You can request to cancel your ReColor AI account at any time by emailing us at help@netreads.in. Here's what happens when you cancel 
              and how to do it properly.
            </p>
            
            <div className="space-y-6">
             
              
              <div>
                <h4 className="font-medium mb-3">What Happens When You Cancel</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-green-700">Immediate Effects</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Account access is immediately disabled</li>
                      <li>• No new charges will be made</li>
                      <li>• Ongoing processes are completed</li>
                      <li>• Download access remains for 30 days</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-red-700">Data Deletion</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• All uploaded images are deleted</li>
                      <li>• Account information is removed</li>
                      <li>• Usage history is cleared</li>
                      <li>• Remaining credits are forfeited</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Before You Cancel</h4>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-yellow-800">Important Considerations</p>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Download all processed images you want to keep</li>
                      <li>• Use any remaining credits (they cannot be refunded)</li>
                      <li>• Export any important data or settings</li>
                      <li>• Consider temporary deactivation instead of deletion</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Special Circumstances */}
        <Card>
          <CardHeader>
            <CardTitle>Special Circumstances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We understand that special situations may arise. Here's how we handle various exceptional circumstances.
            </p>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Technical Issues</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  If our service fails to process your images due to technical problems on our end:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Credits will be automatically refunded to your account</li>
                  <li>• You'll receive email notification of the issue</li>
                  <li>• Additional compensation may be provided for significant outages</li>
                  <li>• Priority processing for re-submitted images</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Billing Errors</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  For duplicate charges, incorrect amounts, or unauthorized transactions:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Immediate investigation upon notification</li>
                  <li>• Full refund for confirmed billing errors</li>
                  <li>• Account credit for any inconvenience caused</li>
                  <li>• Implementation of preventive measures</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Fraudulent Activity</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  If your account was compromised or used fraudulently:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Immediate account security review</li>
                  <li>• Refund of unauthorized charges</li>
                  <li>• Enhanced security measures implementation</li>
                  <li>• Cooperation with payment provider investigations</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Compliance */}
        <Card>
          <CardHeader>
            <CardTitle>Legal Compliance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Our refund policy complies with applicable consumer protection laws and regulations in India, 
              including the Consumer Protection Act, 2019. All refunds are processed in accordance with 
              payment processors policies and RBI guidelines for payment 
              processing and refunds.
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Consumer Rights</h4>
                <p className="text-sm text-muted-foreground">
                  This policy doesn't limit any statutory rights you may have under applicable consumer 
                  protection laws. In some jurisdictions, you may have additional rights that supersede 
                  certain aspects of this policy.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Dispute Resolution</h4>
                <p className="text-sm text-muted-foreground">
                  If you're not satisfied with our refund decision, you may escalate the matter through 
                  the dispute resolution process outlined in our Terms of Service.
                </p>
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
              We may update this Refund & Cancellation Policy from time to time to reflect changes 
              in our services, legal requirements, or business practices.
            </p>
            
            <div className="space-y-2">
              <h4 className="font-medium">How We Notify You</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Updates to the "Last updated" date at the top of this policy</li>
                <li>• Email notifications for significant changes</li>
                <li>• Website announcements for major policy revisions</li>
                <li>• 30-day advance notice for changes affecting existing purchases</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <div className="text-center space-y-4">
          <Separator />
          <h3 className="text-xl font-semibold">Need Help with Refunds?</h3>
          <p className="text-muted-foreground">
            Our support team is here to help with any questions about refunds or cancellations. 
            We're committed to resolving your concerns quickly and fairly.
          </p>
          <div className="flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-4">
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              help@netreads.in
            </Button>
           
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            For urgent refund requests, please include "URGENT REFUND" in your email subject line.
          </p>
        </div>
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Code, Copy, Key, Zap, Shield, BookOpen, ExternalLink } from "lucide-react";

export default function ApiDocsPage() {
  const codeExamples = {
    authentication: `curl -X POST https://api.recolorai.com/auth/token \\
  -H "Content-Type: application/json" \\
  -d '{
    "api_key": "your_api_key_here",
    "client_id": "your_client_id"
  }'`,
    
    colorize: `curl -X POST https://api.recolorai.com/v1/colorize \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "image_url": "https://example.com/image.jpg",
    "quality": "hd",
    "callback_url": "https://your-app.com/webhook"
  }'`,
    
    status: `curl -X GET https://api.recolorai.com/v1/jobs/job_id_here \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`,
    
    webhook: `{
  "job_id": "job_123456789",
  "status": "completed",
  "result_url": "https://api.recolorai.com/results/colorized_image.jpg",
  "original_url": "https://example.com/original.jpg",
  "processing_time": 45.2,
  "credits_used": 1
}`
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <div className="space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Code className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">API Documentation</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Integrate ReColor AI into your applications with our powerful REST API. 
            Colorize images programmatically with just a few lines of code.
          </p>
        </div>

        {/* Quick Start */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Quick Start</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Get started with our API in minutes. Follow these simple steps to integrate image colorization into your application.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <span className="font-medium">Get API Key</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Sign up and get your API key from the dashboard
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <span className="font-medium">Make Request</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Send your image URL to our colorization endpoint
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <span className="font-medium">Get Result</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Receive the colorized image via webhook or polling
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Authentication</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              All API requests require authentication using your API key. Include your API key in the Authorization header.
            </p>
            
            <div className="space-y-2">
              <h4 className="font-medium">Header Format</h4>
              <div className="bg-muted p-3 rounded-md">
                <code className="text-sm">Authorization: Bearer YOUR_API_KEY</code>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Example Request</h4>
              <div className="bg-muted p-3 rounded-md overflow-x-auto">
                <pre className="text-sm">{codeExamples.authentication}</pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">API Endpoints</h2>
          
          {/* Colorize Endpoint */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>POST /v1/colorize</span>
                <Badge variant="secondary">Core Endpoint</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Submit an image for colorization. Returns a job ID that you can use to check the status.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Request Body</h4>
                  <div className="bg-muted p-3 rounded-md">
                    <pre className="text-sm">{JSON.stringify({
                      image_url: "string (required)",
                      quality: "string (optional, default: 'hd')",
                      callback_url: "string (optional)"
                    }, null, 2)}</pre>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Example Request</h4>
                  <div className="bg-muted p-3 rounded-md overflow-x-auto">
                    <pre className="text-sm">{codeExamples.colorize}</pre>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Response</h4>
                  <div className="bg-muted p-3 rounded-md">
                    <pre className="text-sm">{JSON.stringify({
                      job_id: "job_123456789",
                      status: "processing",
                      estimated_time: 60
                    }, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Endpoint */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>GET /v1/jobs/{`{job_id}`}</span>
                <Badge variant="outline">Status Check</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Check the status of a colorization job and get the result when completed.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Example Request</h4>
                  <div className="bg-muted p-3 rounded-md overflow-x-auto">
                    <pre className="text-sm">{codeExamples.status}</pre>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Response (Processing)</h4>
                  <div className="bg-muted p-3 rounded-md">
                    <pre className="text-sm">{JSON.stringify({
                      job_id: "job_123456789",
                      status: "processing",
                      progress: 75,
                      estimated_completion: "2024-01-15T10:30:00Z"
                    }, null, 2)}</pre>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Response (Completed)</h4>
                  <div className="bg-muted p-3 rounded-md">
                    <pre className="text-sm">{JSON.stringify({
                      job_id: "job_123456789",
                      status: "completed",
                      result_url: "https://api.recolorai.com/results/colorized_image.jpg",
                      processing_time: 45.2,
                      credits_used: 1
                    }, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Webhooks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Webhooks</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Receive real-time notifications when your colorization jobs are completed. 
              Configure a callback URL in your requests to enable webhooks.
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Webhook Payload</h4>
                <div className="bg-muted p-3 rounded-md overflow-x-auto">
                  <pre className="text-sm">{codeExamples.webhook}</pre>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Security</h4>
                <p className="text-sm text-muted-foreground">
                  Webhook requests include a signature header for verification. Always verify the signature to ensure the request is from ReColor AI.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SDKs and Libraries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>SDKs and Libraries</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">JavaScript/Node.js</h4>
                <p className="text-sm text-muted-foreground mb-2">Official SDK for JavaScript and Node.js applications</p>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on GitHub
                </Button>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Python</h4>
                <p className="text-sm text-muted-foreground mb-2">Python SDK for easy integration</p>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on GitHub
                </Button>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">PHP</h4>
                <p className="text-sm text-muted-foreground mb-2">PHP library for web applications</p>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on GitHub
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rate Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              API requests are rate limited to ensure fair usage and system stability.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium">Free Tier</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 100 requests per hour</li>
                  <li>• 1 concurrent job</li>
                  <li>• Basic support</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Pro Tier</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 1000 requests per hour</li>
                  <li>• 10 concurrent jobs</li>
                  <li>• Priority support</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Handling */}
        <Card>
          <CardHeader>
            <CardTitle>Error Handling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Our API uses standard HTTP status codes and returns detailed error messages to help you debug issues.
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Common Error Codes</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-mono">400</span>
                    <span className="text-sm">Bad Request - Invalid parameters</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-mono">401</span>
                    <span className="text-sm">Unauthorized - Invalid API key</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-mono">429</span>
                    <span className="text-sm">Too Many Requests - Rate limit exceeded</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-mono">500</span>
                    <span className="text-sm">Internal Server Error</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <div className="text-center space-y-4">
          <Separator />
          <h3 className="text-xl font-semibold">Need Help?</h3>
          <p className="text-muted-foreground">
            Have questions about our API? Our support team is here to help.
          </p>
          <div className="flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-4">
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            <Button variant="outline">
              <BookOpen className="h-4 w-4 mr-2" />
              View Examples
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

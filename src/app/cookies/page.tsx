import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Cookie, Settings, Shield, Eye, Database, Target } from "lucide-react";

export default function CookiePolicyPage() {
  const cookieCategories = [
    {
      title: "Essential Cookies",
      icon: <Shield className="h-5 w-5" />,
      color: "bg-green-100 text-green-800",
      description: "These cookies are necessary for the website to function properly and cannot be disabled.",
      cookies: [
        {
          name: "session_id",
          purpose: "Maintains your login session and user preferences",
          duration: "Session",
          type: "HTTP Cookie"
        },
        {
          name: "csrf_token",
          purpose: "Protects against cross-site request forgery attacks",
          duration: "Session",
          type: "HTTP Cookie"
        },
        {
          name: "auth_token",
          purpose: "Stores authentication information securely",
          duration: "30 days",
          type: "HTTP Cookie"
        }
      ]
    },
    {
      title: "Analytics Cookies",
      icon: <Eye className="h-5 w-5" />,
      color: "bg-blue-100 text-blue-800",
      description: "These cookies help us understand how visitors interact with our website by collecting anonymous information.",
      cookies: [
        {
          name: "_ga",
          purpose: "Distinguishes unique users and tracks user behavior",
          duration: "2 years",
          type: "HTTP Cookie"
        },
        {
          name: "_gid",
          purpose: "Distinguishes unique users for 24 hours",
          duration: "24 hours",
          type: "HTTP Cookie"
        },
        {
          name: "_gat",
          purpose: "Throttles request rate to limit data collection",
          duration: "1 minute",
          type: "HTTP Cookie"
        }
      ]
    },
    {
      title: "Functional Cookies",
      icon: <Settings className="h-5 w-5" />,
      color: "bg-purple-100 text-purple-800",
      description: "These cookies enable enhanced functionality and personalization features.",
      cookies: [
        {
          name: "theme_preference",
          purpose: "Remembers your dark/light mode preference",
          duration: "1 year",
          type: "Local Storage"
        },
        {
          name: "language_preference",
          purpose: "Stores your preferred language setting",
          duration: "1 year",
          type: "Local Storage"
        },
        {
          name: "recent_uploads",
          purpose: "Remembers your recently uploaded images for quick access",
          duration: "7 days",
          type: "Local Storage"
        }
      ]
    },
    {
      title: "Marketing Cookies",
      icon: <Target className="h-5 w-5" />,
      color: "bg-orange-100 text-orange-800",
      description: "These cookies are used to deliver relevant advertisements and track marketing campaign effectiveness.",
      cookies: [
        {
          name: "_fbp",
          purpose: "Facebook pixel for tracking conversions and retargeting",
          duration: "3 months",
          type: "HTTP Cookie"
        },
        {
          name: "utm_source",
          purpose: "Tracks the source of website traffic for analytics",
          duration: "30 days",
          type: "URL Parameter"
        },
        {
          name: "marketing_preferences",
          purpose: "Stores your marketing communication preferences",
          duration: "1 year",
          type: "Local Storage"
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
            <Cookie className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Cookie Policy</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Learn about how ReColor AI uses cookies and similar technologies to enhance your experience 
            and provide our services effectively.
          </p>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* What are Cookies */}
        <Card>
          <CardHeader>
            <CardTitle>What Are Cookies?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Cookies are small text files that are stored on your device when you visit our website. 
              They help us provide you with a better experience by remembering your preferences and 
              enabling various website functionalities.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium">Types of Data We Store</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• User authentication information</li>
                  <li>• Website preferences and settings</li>
                  <li>• Analytics and usage data</li>
                  <li>• Marketing and advertising data</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">How We Use Cookies</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• To keep you logged in</li>
                  <li>• To remember your preferences</li>
                  <li>• To analyze website performance</li>
                  <li>• To provide personalized content</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cookie Categories */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-center">Cookie Categories</h2>
          
          {cookieCategories.map((category, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {category.icon}
                  <span>{category.title}</span>
                  <Badge className={category.color}>
                    {category.title.split(' ')[0]}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{category.description}</p>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Cookies Used:</h4>
                  <div className="space-y-2">
                    {category.cookies.map((cookie, cookieIndex) => (
                      <div key={cookieIndex} className="bg-muted p-3 rounded-md">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{cookie.name}</div>
                            <div className="text-sm text-muted-foreground">{cookie.purpose}</div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <div>Duration: {cookie.duration}</div>
                            <div>Type: {cookie.type}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Third-Party Cookies */}
        <Card>
          <CardHeader>
            <CardTitle>Third-Party Cookies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We may use third-party services that set their own cookies. These services help us 
              provide better functionality and analyze our website performance.
            </p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-medium">Google Analytics</h4>
                  <p className="text-sm text-muted-foreground">
                    We use Google Analytics to understand how visitors use our website. 
                    This helps us improve our services and user experience.
                  </p>
                  <Button variant="link" size="sm" className="p-0 h-auto">
                    Learn more about Google Analytics cookies
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Payment Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    Our payment processors may set cookies to ensure secure transactions 
                    and prevent fraud.
                  </p>
                  <Button variant="link" size="sm" className="p-0 h-auto">
                    View payment processor privacy policy
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Managing Cookies */}
        <Card>
          <CardHeader>
            <CardTitle>Managing Your Cookie Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You have control over which cookies you accept. You can manage your preferences 
              through your browser settings or our cookie consent tool.
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Browser Settings</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Most web browsers allow you to control cookies through their settings. 
                  You can usually find these settings in the "Privacy" or "Security" section of your browser.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Chrome</div>
                    <div className="text-sm text-muted-foreground">Settings → Privacy and security → Cookies</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Firefox</div>
                    <div className="text-sm text-muted-foreground">Options → Privacy & Security → Cookies</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Safari</div>
                    <div className="text-sm text-muted-foreground">Preferences → Privacy → Cookies</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Edge</div>
                    <div className="text-sm text-muted-foreground">Settings → Cookies and site permissions</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Cookie Consent Tool</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  You can also manage your cookie preferences using our cookie consent tool. 
                  Click the button below to open the cookie settings.
                </p>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Cookie Preferences
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Impact of Disabling Cookies */}
        <Card>
          <CardHeader>
            <CardTitle>Impact of Disabling Cookies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              While you can disable cookies, doing so may affect the functionality of our website 
              and your user experience.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium">Essential Cookies</h4>
                  <p className="text-sm text-muted-foreground">
                    Disabling essential cookies will prevent you from logging in and using our services.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium">Functional Cookies</h4>
                  <p className="text-sm text-muted-foreground">
                    You may lose your preferences and settings, requiring you to reconfigure them each visit.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium">Analytics Cookies</h4>
                  <p className="text-sm text-muted-foreground">
                    We won't be able to improve our services based on usage data.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Data Retention</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We retain cookie data for different periods depending on the type of cookie and its purpose. 
              Here's how long we keep different types of data:
            </p>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Session Data</span>
                <span className="text-sm text-muted-foreground">Until browser session ends</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Authentication Data</span>
                <span className="text-sm text-muted-foreground">30 days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Preference Data</span>
                <span className="text-sm text-muted-foreground">1 year</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Analytics Data</span>
                <span className="text-sm text-muted-foreground">2 years</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Updates to Policy */}
        <Card>
          <CardHeader>
            <CardTitle>Updates to This Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We may update this Cookie Policy from time to time to reflect changes in our practices 
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
          <h3 className="text-xl font-semibold">Questions About Cookies?</h3>
          <p className="text-muted-foreground">
            If you have any questions about our use of cookies or this Cookie Policy, 
            please don't hesitate to contact us.
          </p>
          <div className="flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-4">
            <Button variant="outline">
              <Cookie className="h-4 w-4 mr-2" />
              Contact Us
            </Button>
            <Button variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Privacy Policy
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

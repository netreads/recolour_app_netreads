import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Acceptance of Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              By accessing and using ReColor AI, you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to these terms, please do not use our service.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Use License</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Permission is granted to temporarily use ReColor AI for personal, non-commercial transitory viewing only.
            </p>
            <p>This license shall automatically terminate if you violate any of these restrictions.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              You retain ownership of any images you upload to our service. By uploading content, 
              you grant us permission to process and enhance your images using our AI technology.
            </p>
            <p>
              You are responsible for ensuring you have the right to upload and process any images 
              you submit to our service.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              We strive to maintain high availability of our service, but we do not guarantee 
              uninterrupted access. We reserve the right to modify or discontinue the service 
              with or without notice.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              For questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:legal@recolorai.com" className="text-primary hover:underline">
                legal@recolorai.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
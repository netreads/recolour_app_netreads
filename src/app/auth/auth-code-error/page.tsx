import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 text-center pb-8">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
            <CardDescription className="text-muted-foreground">
              There was an error with your authentication. Please try signing in again.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pb-8">
            <div className="text-center space-y-4">
              <Button asChild className="w-full">
                <Link href="/login">
                  Try Again
                </Link>
              </Button>
              
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { signInWithGoogle } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Chrome, ArrowLeft, UserPlus } from "lucide-react";

export default function SignupPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError("");

    try {
      await signInWithGoogle();
    } catch {
      setError("Google sign-in failed");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to home
            </Link>
          </Button>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 text-center pb-8">
            <div className="mx-auto w-12 h-12 bg-gradient-to-r from-primary to-blue-600 rounded-lg flex items-center justify-center mb-4">
              <UserPlus className="w-6 h-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
            <CardDescription className="text-muted-foreground">
              Get started with AI photo colorization
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pb-8">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}

            <Button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              size="lg"
              className="w-full"
            >
              <Chrome className="mr-2 h-4 w-4" />
              {isGoogleLoading ? "Creating account..." : "Continue with Google"}
            </Button>

            <div className="text-center text-xs text-muted-foreground space-y-2">
              <p>By signing up, you agree to our</p>
              <div className="flex justify-center space-x-4">
                <Link href="/tos" className="hover:underline">Terms of Service</Link>
                <span>•</span>
                <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
              </div>
            </div>

            <Separator />

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

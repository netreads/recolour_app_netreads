"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { signOut as clientSignOut, getSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, CreditCard, RefreshCw, Menu, X } from "lucide-react";

interface UserType {
  id: string;
  email: string;
  credits: number;
}

export function Navbar() {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isFetchingRef = useRef(false);
  const lastFetchRef = useRef(0);

  // Debug user state changes
  useEffect(() => {
    console.log("Navbar - User state changed:", user);
  }, [user]);

  useEffect(() => {
    checkAuthStatus();

    // Listen for explicit credit update events from anywhere in the app
    const handleCreditsUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail as { credits?: number } | undefined;
      if (typeof detail?.credits === "number") {
        setUser((prev) => prev ? { ...prev, credits: detail.credits as number } : prev);
      } else {
        void fetchAndSetUserThrottled();
      }
    };
    window.addEventListener("credits:update", handleCreditsUpdate as EventListener);

    // Refresh when window/tab becomes active
    const handleFocus = () => {
      void fetchAndSetUserThrottled();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchAndSetUserThrottled();
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("credits:update", handleCreditsUpdate as EventListener);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      // First check session to see if user is authenticated
      const session = await getSession();
      console.log("Navbar - Session:", session);
      
      if (session?.user) {
        console.log("Navbar - User from session:", session.user);
        // User is authenticated, fetch fresh data from API
        const response = await fetch("/api/user", { cache: "no-store" });
        console.log("Navbar - API response status:", response.status);
        
        if (response.ok) {
          const userData = await response.json();
          console.log("Navbar - User data from API:", userData);
          if (userData?.id) {
            setUser({ id: userData.id, email: userData.email, credits: userData.credits || 0 });
            return;
          }
        }
        // If API call failed but user is authenticated, use session data
        console.log("Navbar - Using session data as fallback");
        setUser({ 
          id: session.user.id, 
          email: session.user.email || '', 
          credits: 0 // Will be updated by API calls
        });
      } else {
        // No session, user is not authenticated
        console.log("Navbar - No session found");
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch fresh user data from API and update state if changed
  const fetchAndSetUser = async () => {
    try {
      // First check if user is still authenticated
      const session = await getSession();
      if (!session?.user) {
        setUser(null);
        return;
      }

      const response = await fetch("/api/user", { cache: "no-store" });
      if (response.status === 401) {
        setUser(null);
        return;
      }
      if (!response.ok) return;
      const latest = await response.json();
      if (!latest) return;
      setUser((prev) => {
        if (!prev) return { id: latest.id, email: latest.email, credits: latest.credits || 0 };
        if (
          prev.id !== latest.id ||
          prev.email !== latest.email ||
          prev.credits !== (latest.credits || 0)
        ) {
          return { id: latest.id, email: latest.email, credits: latest.credits || 0 };
        }
        return prev;
      });
    } catch (error) {
      // Silently ignore to keep UI snappy
    }
  };

  // Throttle fetches to avoid bursts from multiple events
  const fetchAndSetUserThrottled = async () => {
    const now = Date.now();
    if (isFetchingRef.current) return;
    if (now - lastFetchRef.current < 1000) return; // 1s throttle
    isFetchingRef.current = true;
    try {
      await fetchAndSetUser();
      lastFetchRef.current = Date.now();
    } finally {
      isFetchingRef.current = false;
    }
  };

  const refreshUserCredits = async () => {
    try {
      // Check if user is still authenticated first
      const session = await getSession();
      if (!session?.user) {
        setUser(null);
        return;
      }

      // Prefer a simple GET that bypasses cache
      const response = await fetch("/api/user", { cache: "no-store" });
      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
        }
        return;
      }
      const userData = await response.json();
      setUser({ id: userData.id, email: userData.email, credits: userData.credits || 0 });
      console.log("Credits refreshed:", userData.credits);
    } catch (error) {
      console.error("Error refreshing credits:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await clientSignOut();
      setUser(null);
      window.location.href = "/";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold">ReColor AI</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/pricing" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Pricing
          </Link>
          {user && (
            <Link href="/dashboard" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Dashboard
            </Link>
          )}
        </nav>

        {/* Desktop User Actions */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              {/* Credits Display */}
              <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-purple-700">
                  {user.credits} Credits
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshUserCredits}
                  className="h-6 w-6 p-0 hover:bg-purple-200"
                >
                  <RefreshCw className="h-3 w-3 text-purple-600" />
                </Button>
              </div>
              
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/pricing" className="cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </>
          ) : (
            !isLoading && (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </div>
            )
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="h-8 w-8 p-0"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* Mobile Navigation Links */}
            <nav className="space-y-3">
              <Link 
                href="/pricing" 
                className="block text-sm font-medium text-foreground/60 hover:text-foreground transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              {user && (
                <Link 
                  href="/dashboard" 
                  className="block text-sm font-medium text-foreground/60 hover:text-foreground transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
            </nav>

            {/* Mobile User Section */}
            {user ? (
              <div className="space-y-4 pt-4 border-t">
                {/* Mobile Credits Display */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm font-medium text-purple-700">
                      {user.credits} Credits
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshUserCredits}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw className="h-4 w-4 text-purple-600" />
                  </Button>
                </div>

                {/* Mobile User Info */}
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.email}</p>
                  </div>
                </div>

                {/* Mobile User Actions */}
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/pricing" onClick={() => setIsMobileMenuOpen(false)}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Billing
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </div>
              </div>
            ) : (
              !isLoading && (
                <div className="space-y-3 pt-4 border-t">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                      Get Started
                    </Link>
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
}



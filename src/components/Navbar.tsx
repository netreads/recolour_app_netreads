"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getSession as getClientSession, signOut as clientSignOut, refreshSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings, CreditCard, RefreshCw } from "lucide-react";

interface UserType {
  id: string;
  email: string;
  credits: number;
}

export function Navbar() {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();

    // Listen for explicit credit update events from anywhere in the app
    const handleCreditsUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail as { credits?: number } | undefined;
      if (typeof detail?.credits === "number") {
        setUser((prev) => prev ? { ...prev, credits: detail.credits as number } : prev);
      } else {
        void fetchAndSetUser();
      }
    };
    window.addEventListener("credits:update", handleCreditsUpdate as EventListener);

    // Poll for latest credits periodically
    const intervalId = window.setInterval(() => {
      void fetchAndSetUser();
    }, 5000);

    // Refresh when window/tab becomes active
    const handleFocus = () => {
      void fetchAndSetUser();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchAndSetUser();
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("credits:update", handleCreditsUpdate as EventListener);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Prefer fresh user data from API as source of truth
      const response = await fetch("/api/user", { cache: "no-store" });
      if (response.ok) {
        const userData = await response.json();
        if (userData?.id) {
          setUser({ id: userData.id, email: userData.email, credits: userData.credits || 0 });
          return;
        }
      }
      // Fallback to session
      const session = await refreshSession();
      const userFromSession = (session && (session as any).user) || (session as any)?.data?.user || null;
      if (userFromSession) {
        setUser({ id: userFromSession.id, email: userFromSession.email, credits: userFromSession.credits || 0 });
      } else {
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
      if (!user) return;
      const response = await fetch("/api/user", { cache: "no-store" });
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

  const refreshUserCredits = async () => {
    try {
      // Prefer a simple GET that bypasses cache
      const response = await fetch("/api/user", { cache: "no-store" });
      if (!response.ok) return;
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

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {/* Credits Display */}
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full">
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
                      {user.email.charAt(0).toUpperCase()}
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
      </div>
    </header>
  );
}



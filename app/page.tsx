"use client";

import { useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LandingPage from "@/components/LandingPage";
import OnboardingLanding from "@/components/OnboardingLanding";
import { useUser } from "@/contexts/UserContext";
import { useState } from "react";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoggedIn, isManager, loading } = useUser();
  const [view, setView] = useState<"marketing" | "onboarding">("marketing");
  const isExplicitHome = searchParams.get("home") === "true";
  const hasRedirected = useRef(false);

  // Reset redirect ref when user logs out
  useEffect(() => {
    if (!isLoggedIn) {
      hasRedirected.current = false;
    }
  }, [isLoggedIn]);

  // Check if user has set up preferences
  const hasPreferences = user?.preferences?.address || user?.preferences?.priceMin || user?.preferences?.priceMax;

  // Check if user is logged in on initial mount and redirect appropriately
  // But don't redirect if explicitly navigating to home via "Back to Home"
  // Wait for loading to complete before redirecting to avoid race conditions
  // Use ref to prevent multiple redirects
  useEffect(() => {
    console.log('[HomePage] useEffect check:', { loading, isLoggedIn, isExplicitHome, view, hasRedirected: hasRedirected.current, hasPreferences });
    if (!loading && isLoggedIn && !isExplicitHome && !hasRedirected.current) {
      console.log('[HomePage] Redirecting logged-in user');
      hasRedirected.current = true;

      // For new searchers without preferences, send to preferences page first
      if (!isManager && !hasPreferences) {
        console.log('[HomePage] New searcher without preferences, redirecting to /preferences');
        router.replace("/preferences");
      } else if (isManager) {
        router.replace("/manager/dashboard");
      } else {
        router.replace("/swipe");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isLoggedIn, isExplicitHome, isManager, hasPreferences]); // Only run when login status or explicit home changes

  // Fallback: If loading takes more than 5 seconds, force redirect anyway
  useEffect(() => {
    if (isLoggedIn && !isExplicitHome && !hasRedirected.current) {
      const timeout = setTimeout(() => {
        console.log('[HomePage] Loading timeout reached, forcing redirect');
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          // Safe default redirect - managers go to dashboard, others to swipe
          if (isManager) {
            router.replace("/manager/dashboard");
          } else {
            router.replace("/swipe");
          }
        }
      }, 5000); // 5 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoggedIn, isExplicitHome, isManager, router]);

  // Show loading while user is being authenticated and redirect is pending
  if (isLoggedIn && !isExplicitHome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Redirecting...</div>
      </div>
    );
  }

  // Marketing landing page
  if (view === "marketing") {
    return (
      <LandingPage
        onGetStarted={() => {
          if (isLoggedIn) {
            if (isManager) {
              router.push("/manager/dashboard");
            } else {
              router.push("/swipe");
            }
          } else {
            setView("onboarding");
          }
        }}
      />
    );
  }

  // Onboarding landing (Sign Up/Log in)
  if (view === "onboarding") {
    return (
      <OnboardingLanding
        onSignUp={() => {
          // New users are prompted for preferences or dashboard depending on type
          router.push("/preferences");
        }}
        onLogIn={() => {
          // Let the useEffect handle the redirect after loading completes
          // This prevents race conditions with profile loading
          console.log('[HomePage] Login successful, useEffect will handle redirect');
        }}
        onBack={() => setView("marketing")}
      />
    );
  }

  return null;
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}

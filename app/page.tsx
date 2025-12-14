"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LandingPage from "@/components/LandingPage";
import OnboardingLanding from "@/components/OnboardingLanding";
import { useUser } from "@/contexts/UserContext";
import { useState } from "react";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, isManager, loading } = useUser();
  const [view, setView] = useState<"marketing" | "onboarding">("marketing");
  const isExplicitHome = searchParams.get("home") === "true";

  // Check if user is logged in on initial mount and redirect appropriately
  // But don't redirect if explicitly navigating to home via "Back to Home"
  // Wait for loading to complete before redirecting to avoid race conditions
  useEffect(() => {
    console.log('[HomePage] useEffect check:', { loading, isLoggedIn, isExplicitHome, view });
    if (!loading && isLoggedIn && !isExplicitHome) {
      console.log('[HomePage] Redirecting logged-in user');
      if (isManager) {
        router.push("/manager/dashboard");
      } else {
        router.push("/swipe");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isLoggedIn, isExplicitHome, isManager]); // Only run when login status or explicit home changes

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

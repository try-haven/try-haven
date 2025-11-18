"use client";

import { useState, useEffect } from "react";
import LandingPage from "@/components/LandingPage";
import OnboardingLanding from "@/components/OnboardingLanding";
import AddressInput from "@/components/AddressInput";
import CommutePreference from "@/components/CommutePreference";
import CardStack from "@/components/CardStack";
import LikedListings from "@/components/LikedListings";
import ReviewedListings from "@/components/ReviewedListings";
import DarkModeToggle from "@/components/DarkModeToggle";
import HavenLogo from "@/components/HavenLogo";
import { useUser } from "@/contexts/UserContext";
import { fakeListings, ApartmentListing } from "@/lib/data";

type View = "marketing" | "onboarding" | "address" | "commute" | "swipe" | "liked" | "reviewed";
type CommuteOption = "car" | "public-transit" | "walk" | "bike";

export default function Home() {
  const { isLoggedIn, logOut, user } = useUser();
  const [view, setView] = useState<View>("marketing");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [hasCompletedAll, setHasCompletedAll] = useState(false);
  
  // Onboarding state
  const [userAddress, setUserAddress] = useState<string>("");
  const [commuteOptions, setCommuteOptions] = useState<CommuteOption[]>([]);

  // Load liked listings from localStorage when user changes
  useEffect(() => {
    if (user) {
      const storedLikedIds = localStorage.getItem(`haven_liked_listings_${user.username}`);
      if (storedLikedIds) {
        try {
          const parsedIds = JSON.parse(storedLikedIds);
          setLikedIds(new Set(parsedIds));
        } catch (error) {
          console.error("Error parsing liked listings:", error);
        }
      } else {
        // If no stored liked listings, start with empty set
        setLikedIds(new Set());
      }
    } else {
      // Clear liked listings when user logs out
      setLikedIds(new Set());
    }
  }, [user]);

  // Save liked listings to localStorage whenever they change
  useEffect(() => {
    if (user && likedIds.size > 0) {
      localStorage.setItem(`haven_liked_listings_${user.username}`, JSON.stringify(Array.from(likedIds)));
    } else if (user && likedIds.size === 0) {
      // Remove from localStorage if no liked listings
      localStorage.removeItem(`haven_liked_listings_${user.username}`);
    }
  }, [likedIds, user]);

  // Check if user is logged in on initial mount only
  useEffect(() => {
    if (isLoggedIn && view === "marketing") {
      // User is logged in, skip onboarding if they've completed it before
      const hasAddress = localStorage.getItem("haven_user_address");
      const hasCommute = localStorage.getItem("haven_user_commute");
      
      if (hasAddress && hasCommute) {
        setView("swipe");
      } else if (hasAddress) {
        setView("commute");
      } else {
        setView("address");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const likedListings = fakeListings.filter((listing) => likedIds.has(listing.id));

  // Marketing landing page
  if (view === "marketing") {
    return (
      <LandingPage
        onGetStarted={() => {
          // Check if user is logged in
          if (isLoggedIn) {
            // Check if user has completed onboarding
            const hasAddress = localStorage.getItem("haven_user_address");
            const hasCommute = localStorage.getItem("haven_user_commute");
            if (hasAddress && hasCommute) {
              setView("swipe");
            } else if (hasAddress) {
              setView("commute");
            } else {
              setView("address");
            }
          } else {
            // Not logged in, go to onboarding
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
          // Always ask for preferences when signing up (new user)
          setView("address");
        }}
        onLogIn={() => {
          // Check if user has already completed onboarding
          const hasAddress = localStorage.getItem("haven_user_address");
          const hasCommute = localStorage.getItem("haven_user_commute");
          if (hasAddress && hasCommute) {
            setView("swipe");
          } else if (hasAddress) {
            setView("commute");
          } else {
            setView("address");
          }
        }}
        onBack={() => setView("marketing")}
      />
    );
  }

  // Address input
  if (view === "address") {
    // Load current address from localStorage if available
    const currentAddress = userAddress || (typeof window !== 'undefined' ? localStorage.getItem("haven_user_address") || "" : "");
    const isFromPreferences = typeof window !== 'undefined' ? localStorage.getItem("haven_user_commute") !== null : false;
    return (
      <AddressInput
        onNext={(address) => {
          setUserAddress(address);
          localStorage.setItem("haven_user_address", address); // Persist address
          // Always go to commute after address (both in onboarding and preferences)
          setView("commute");
        }}
        onBack={() => {
          // If coming from preferences, go back to swipe; otherwise onboarding
          if (isFromPreferences) {
            setView("swipe");
          } else {
            setView("onboarding");
          }
        }}
        initialAddress={currentAddress} // Pass current address for display
      />
    );
  }

  // Commute preference
  if (view === "commute") {
    // Load current commute options from localStorage if available
    const currentCommuteOptions = commuteOptions.length > 0 
      ? commuteOptions 
      : (typeof window !== 'undefined' 
          ? (localStorage.getItem("haven_user_commute") ? JSON.parse(localStorage.getItem("haven_user_commute")!) : [])
          : []);
    return (
      <CommutePreference
        onNext={(options) => {
          setCommuteOptions(options);
          localStorage.setItem("haven_user_commute", JSON.stringify(options)); // Persist commute options
          setView("swipe");
        }}
        onBack={() => setView("address")}
        initialOptions={currentCommuteOptions} // Pass current options for display
      />
    );
  }

  const handleRemoveLike = (listingId: string) => {
    setLikedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(listingId);
      return newSet;
    });
  };

  if (view === "liked") {
    return (
      <LikedListings
        likedListings={likedListings}
        onBack={() => setView("swipe")}
        onRemoveLike={handleRemoveLike}
        onBackToHome={() => setView("marketing")}
      />
    );
  }

  if (view === "reviewed") {
    return (
      <ReviewedListings
        onBack={() => setView("swipe")}
        onBackToHome={() => setView("marketing")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between mb-8 relative z-50">
          <div className="flex items-center gap-3">
            <HavenLogo size="sm" showAnimation={false} />
            <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">Haven</h1>
          </div>
          <div className="flex gap-2 items-center">
            <DarkModeToggle />
            {isLoggedIn && (
              <>
                <button
                  onClick={() => {
                    setView("address");
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Preferences
                </button>
                <button
                  onClick={() => setView("reviewed")}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  My Reviews
                </button>
              </>
            )}
            {likedIds.size > 0 && (
              <button
                onClick={() => setView("liked")}
                className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors flex items-center gap-2 font-semibold"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                Liked ({likedIds.size})
              </button>
            )}
            <button
              onClick={() => {
                logOut();
                setLikedIds(new Set()); // Clear liked listings on logout
                setView("marketing");
              }}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Log Out
            </button>
            <button
              onClick={() => setView("marketing")}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
        <CardStack 
          listings={fakeListings} 
          onLikedChange={setLikedIds}
          initialLikedIds={likedIds}
          onViewLiked={() => setView("liked")}
          initialCompleted={hasCompletedAll}
          onCompletedChange={setHasCompletedAll}
        />
      </div>
    </div>
  );
}

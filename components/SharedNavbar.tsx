"use client";

import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { useLikedListingsContext } from "@/contexts/LikedListingsContext";
import DarkModeToggle from "./DarkModeToggle";
import HavenLogo from "./HavenLogo";
import { useRouter, usePathname } from "next/navigation";
import { buttonStyles, textStyles, layoutStyles } from "@/lib/styles";

interface SharedNavbarProps {
  onPreferencesClick?: () => void;
  onMyReviewsClick?: () => void;
  onLikedListingsClick?: () => void;
  onBackToHome?: () => void;
  showBackToHome?: boolean;
  leftButton?: React.ReactNode;
  likedCount?: number;
}

export default function SharedNavbar({
  onPreferencesClick,
  onMyReviewsClick,
  onLikedListingsClick,
  onBackToHome,
  showBackToHome = false,
  leftButton,
  likedCount = 0
}: SharedNavbarProps) {
  const { isLoggedIn, logOut, user } = useUser();
  const { flushPendingSync } = useLikedListingsContext();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handlePreferences = () => {
    setMobileMenuOpen(false);
    if (onPreferencesClick) {
      onPreferencesClick();
    } else {
      router.push("/preferences");
    }
  };

  const handleMyReviews = () => {
    setMobileMenuOpen(false);
    if (onMyReviewsClick) {
      onMyReviewsClick();
    } else {
      router.push("/my-reviews");
    }
  };

  const handleLikedListings = () => {
    setMobileMenuOpen(false);
    if (onLikedListingsClick) {
      onLikedListingsClick();
    } else {
      router.push("/liked-listings");
    }
  };

  const handleSearch = () => {
    setMobileMenuOpen(false);
    router.push("/search");
  };

  const handleSwipe = () => {
    setMobileMenuOpen(false);
    router.push("/swipe");
  };

  const handleProfile = () => {
    setMobileMenuOpen(false);
    router.push("/profile");
  };

  const handleBackToHome = () => {
    setMobileMenuOpen(false);
    // Always go to home page (/), not swipe
    // Only add ?home=true if user is logged in (to prevent auto-redirect)
    if (isLoggedIn) {
      router.push("/?home=true");
    } else {
      router.push("/");
    }
  };

  const handleLogOut = async () => {
    setMobileMenuOpen(false);
    console.log('[SharedNavbar] Starting logout...');
    // Flush any pending liked listings syncs before logging out
    await flushPendingSync();
    console.log('[SharedNavbar] Pending syncs flushed');

    // Wait for logout to complete before navigating
    await logOut();
    console.log('[SharedNavbar] Logout complete, navigating to home...');

    // Use replace to avoid back button issues
    router.replace("/");
  };

  const handleLogoClick = () => {
    // Only add ?home=true if user is logged in (to prevent auto-redirect)
    // If logged out, just go to home without the parameter
    if (isLoggedIn) {
      router.push("/?home=true");
    } else {
      router.push("/");
    }
  };

  return (
    <>
      <div className="w-full flex items-center justify-between gap-2 md:gap-4">
        {leftButton || (
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 md:gap-3 flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <HavenLogo size="sm" showAnimation={false} />
            <h1 className={textStyles.headingBrand}>Haven</h1>
          </button>
        )}

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1 flex-shrink-0 flex-nowrap">
          <DarkModeToggle />
          {isLoggedIn && (
            <>
              {likedCount > 0 && (
                <button onClick={handleLikedListings} className={buttonStyles.liked}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  Liked ({likedCount})
                </button>
              )}
              <button onClick={handleSearch} className={buttonStyles.nav}>Search</button>
              <button onClick={handlePreferences} className={buttonStyles.nav}>Preferences</button>
              <button onClick={handleMyReviews} className={buttonStyles.nav}>My Reviews</button>
              <button onClick={handleSwipe} className={buttonStyles.nav}>Swipe</button>
              <button onClick={handleProfile} className={buttonStyles.nav}>Profile</button>
            </>
          )}
          {showBackToHome && (
            <button onClick={handleBackToHome} className={buttonStyles.nav}>Back to Home</button>
          )}
          {isLoggedIn && (
            <button onClick={handleLogOut} className={buttonStyles.nav}>Log Out</button>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-2">
          <DarkModeToggle />
          {isLoggedIn && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && isLoggedIn && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700 z-[9999]">
          <div className="flex flex-col p-2">
            {likedCount > 0 && (
              <button
                onClick={handleLikedListings}
                className="w-full text-left px-4 py-3 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                Liked Listings ({likedCount})
              </button>
            )}
            <button
              onClick={handleSwipe}
              className="w-full text-left px-4 py-3 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Swipe
            </button>
            <button
              onClick={handleSearch}
              className="w-full text-left px-4 py-3 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Search
            </button>
            <button
              onClick={handlePreferences}
              className="w-full text-left px-4 py-3 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Preferences
            </button>
            <button
              onClick={handleMyReviews}
              className="w-full text-left px-4 py-3 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              My Reviews
            </button>
            <button
              onClick={handleProfile}
              className="w-full text-left px-4 py-3 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Profile
            </button>
            {showBackToHome && (
              <button
                onClick={handleBackToHome}
                className="w-full text-left px-4 py-3 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Back to Home
              </button>
            )}
            <button
              onClick={handleLogOut}
              className="w-full text-left px-4 py-3 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      )}
    </>
  );
}



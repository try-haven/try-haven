"use client";

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

  const handlePreferences = () => {
    if (onPreferencesClick) {
      onPreferencesClick();
    } else {
      router.push("/preferences");
    }
  };

  const handleMyReviews = () => {
    if (onMyReviewsClick) {
      onMyReviewsClick();
    } else {
      router.push("/my-reviews");
    }
  };

  const handleLikedListings = () => {
    if (onLikedListingsClick) {
      onLikedListingsClick();
    } else {
      router.push("/liked-listings");
    }
  };

  const handleSearch = () => {
    router.push("/search");
  };

  const handleSwipe = () => {
    router.push("/swipe");
  };

  const handleBackToHome = () => {
    // Always go to home page (/), not swipe
    // Only add ?home=true if user is logged in (to prevent auto-redirect)
    if (isLoggedIn) {
      router.push("/?home=true");
    } else {
      router.push("/");
    }
  };

  const handleLogOut = async () => {
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
      <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0 flex-nowrap">
        <DarkModeToggle />
        {isLoggedIn && (
          <>
            {likedCount > 0 && (
              <button
                onClick={handleLikedListings}
                className={buttonStyles.liked}
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Liked ({likedCount})</span>
                <span className="sm:hidden">({likedCount})</span>
              </button>
            )}
            <button
              onClick={handleSearch}
              className={buttonStyles.navHideMobile}
            >
              Search
            </button>
            <button
              onClick={handlePreferences}
              className={buttonStyles.navHideMobile}
            >
              Preferences
            </button>
            <button
              onClick={handleMyReviews}
              className={buttonStyles.navHideMobile}
            >
              My Reviews
            </button>
            <button
              onClick={handleSwipe}
              className={buttonStyles.nav}
            >
              Swipe
            </button>
          </>
        )}
        {showBackToHome && (
          <button
            onClick={handleBackToHome}
            className={buttonStyles.navHideSmall}
          >
            Back to Home
          </button>
        )}
        {isLoggedIn && (
          <button
            onClick={handleLogOut}
            className={buttonStyles.nav}
          >
            Log Out
          </button>
        )}
      </div>
    </div>
  );
}



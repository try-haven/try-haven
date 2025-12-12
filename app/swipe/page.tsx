"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import CardStack from "@/components/CardStack";
import SharedNavbar from "@/components/SharedNavbar";
import { useUser } from "@/contexts/UserContext";
import { initializeFakeRentalHistory } from "@/lib/data";
import { useLikedListingsContext } from "@/contexts/LikedListingsContext";
import { useListings } from "@/contexts/ListingsContext";
import {
  rankListings,
  getSwipeHistory,
  shouldUpdateLearnedPreferences,
  calculateLearnedPreferences,
} from "@/lib/recommendations";

export default function SwipePage() {
  const router = useRouter();
  const { user, updateLearnedPreferences } = useUser();
  const { likedIds, likedCount, setLikedIds } = useLikedListingsContext();
  const { listings, isLoading: isLoadingListings } = useListings();
  const [hasCompletedAll, setHasCompletedAll] = useState(false);
  const [sessionLearnedPreferences, setSessionLearnedPreferences] = useState<any>(null);
  const [hasPersonalized, setHasPersonalized] = useState(false);
  const [showPersonalizedMessage, setShowPersonalizedMessage] = useState(false);
  const [totalSwipes, setTotalSwipes] = useState(0);

  // Initialize fake rental history on first load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeFakeRentalHistory();
    }
  }, []);

  // Track swipe count reactively - updates on mount and when liked listings change
  useEffect(() => {
    const swipeHistory = getSwipeHistory();
    setTotalSwipes(swipeHistory.length);
  }, [likedIds]); // likedIds changes on every swipe in CardStack

  // Callback to update swipe count (called by CardStack on every swipe)
  const handleSwipeCountUpdate = () => {
    const swipeHistory = getSwipeHistory();
    setTotalSwipes(swipeHistory.length);
  };

  // Check if this is a new user (for learning banner)
  const isLearning = totalSwipes < 5;
  const swipesRemaining = Math.max(0, 5 - totalSwipes);

  // OPTION B: Re-rank ONCE after first 5 swipes (new users only - the "wow" moment)
  // Then no more re-ranking during session (performance optimization)
  useEffect(() => {
    if (!user || listings.length === 0 || hasPersonalized) return;

    const currentSwipeCount = getSwipeHistory().length;

    // First-time personalization: recalculate and re-rank after 5 swipes
    if (currentSwipeCount === 5 && !hasPersonalized) {
      const newLearnedPreferences = calculateLearnedPreferences(listings, getSwipeHistory());
      setSessionLearnedPreferences(newLearnedPreferences);
      setHasPersonalized(true);

      // Save to database immediately (don't wait for page exit)
      updateLearnedPreferences(newLearnedPreferences);

      // Show success message briefly
      setShowPersonalizedMessage(true);
      setTimeout(() => setShowPersonalizedMessage(false), 4000);
    }
  }, [likedIds, user, listings, hasPersonalized, updateLearnedPreferences]);

  // Save learned preferences when user leaves (captures all session progress)
  useEffect(() => {
    if (!user || listings.length === 0) return;

    // Capture current user and listings in closure for cleanup
    const currentUser = user;
    const currentListings = listings;
    const savePreferences = updateLearnedPreferences;

    // Save on unmount (when user leaves the page or logs out)
    return () => {
      const swipeHistory = getSwipeHistory();
      if (swipeHistory.length >= 5) {
        const newLearnedPreferences = calculateLearnedPreferences(currentListings, swipeHistory);
        savePreferences(newLearnedPreferences);
      }
    };
  }, [user, listings, updateLearnedPreferences]);

  // Also save on browser close/refresh (backup)
  useEffect(() => {
    if (!user || listings.length === 0) return;

    const handleBeforeUnload = () => {
      const swipeHistory = getSwipeHistory();
      if (swipeHistory.length >= 5) {
        const newLearnedPreferences = calculateLearnedPreferences(listings, swipeHistory);
        updateLearnedPreferences(newLearnedPreferences);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user, listings, updateLearnedPreferences]);

  // Filter and rank listings based on user preferences and swipe history
  const rankedListings = useMemo(() => {
    if (listings.length === 0 || !user) return [];

    // Use session learned preferences (fresh) if available, otherwise use database preferences
    const userPreferences = sessionLearnedPreferences
      ? { ...user.preferences, learned: sessionLearnedPreferences }
      : user.preferences || {};
    const swipeHistory = getSwipeHistory();

    // OPTIMIZATION: Hard filter before scoring to reduce computation
    let filteredListings = listings;

    // Filter by location if user has set an address
    if (userPreferences.address) {
      const userAddressLower = userPreferences.address.toLowerCase();

      // Extract state from user's address (usually last part)
      const userParts = userAddressLower.split(',').map(s => s.trim());
      const userState = userParts[userParts.length - 1]?.toLowerCase() || '';

      // State abbreviation mapping (comprehensive US states)
      const stateMap: Record<string, string[]> = {
        'alabama': ['al'],
        'alaska': ['ak'],
        'arizona': ['az'],
        'arkansas': ['ar'],
        'california': ['ca', 'calif'],
        'colorado': ['co'],
        'connecticut': ['ct'],
        'delaware': ['de'],
        'florida': ['fl'],
        'georgia': ['ga'],
        'hawaii': ['hi'],
        'idaho': ['id'],
        'illinois': ['il'],
        'indiana': ['in'],
        'iowa': ['ia'],
        'kansas': ['ks'],
        'kentucky': ['ky'],
        'louisiana': ['la'],
        'maine': ['me'],
        'maryland': ['md'],
        'massachusetts': ['ma', 'mass'],
        'michigan': ['mi'],
        'minnesota': ['mn'],
        'mississippi': ['ms'],
        'missouri': ['mo'],
        'montana': ['mt'],
        'nebraska': ['ne'],
        'nevada': ['nv'],
        'new hampshire': ['nh'],
        'new jersey': ['nj'],
        'new mexico': ['nm'],
        'new york': ['ny'],
        'north carolina': ['nc'],
        'north dakota': ['nd'],
        'ohio': ['oh'],
        'oklahoma': ['ok'],
        'oregon': ['or'],
        'pennsylvania': ['pa'],
        'rhode island': ['ri'],
        'south carolina': ['sc'],
        'south dakota': ['sd'],
        'tennessee': ['tn'],
        'texas': ['tx'],
        'utah': ['ut'],
        'vermont': ['vt'],
        'virginia': ['va'],
        'washington': ['wa'],
        'west virginia': ['wv'],
        'wisconsin': ['wi'],
        'wyoming': ['wy'],
      };

      // Get all variants of the state (full name + abbreviations)
      let stateVariants = [userState];
      for (const [fullName, abbrevs] of Object.entries(stateMap)) {
        if (userState === fullName || abbrevs.includes(userState)) {
          stateVariants = [fullName, ...abbrevs];
          break;
        }
      }

      filteredListings = listings.filter(listing => {
        const addressLower = listing.address.toLowerCase();

        // Extract the state from listing address (last part after comma)
        const listingParts = addressLower.split(',').map(s => s.trim());
        const listingState = listingParts[listingParts.length - 1] || '';

        // Check if listing state matches any user state variant
        if (userState && userState.length >= 2) {
          // Exact match or state code match (not substring match to avoid false positives)
          const matches = stateVariants.some(variant => {
            // Exact match on the state part
            if (listingState === variant) return true;

            // For 2-letter abbreviations, check if state ends with the abbreviation
            // (e.g., "ca 12345" or "ca")
            if (variant.length === 2) {
              return listingState === variant || listingState.startsWith(variant + ' ');
            }

            return false;
          });
          return matches;
        }

        return true; // If no state detected, show all
      });

    }

    // Filter by price range if user has set preferences (with 40% buffer)
    if (userPreferences.priceMin || userPreferences.priceMax) {
      const minPrice = userPreferences.priceMin ? userPreferences.priceMin * 0.6 : 0;
      const maxPrice = userPreferences.priceMax ? userPreferences.priceMax * 1.4 : Infinity;

      filteredListings = filteredListings.filter(listing => {
        return listing.price >= minPrice && listing.price <= maxPrice;
      });
    }

    // Filter by bedrooms if user has set preference (±1 bedroom tolerance)
    if (userPreferences.bedrooms) {
      filteredListings = filteredListings.filter(listing => {
        const diff = Math.abs(listing.bedrooms - userPreferences.bedrooms!);
        return diff <= 1; // Allow exact match or ±1 bedroom
      });
    }

    // Filter by bathrooms if user has set preference (±0.5 bathroom tolerance)
    if (userPreferences.bathrooms) {
      filteredListings = filteredListings.filter(listing => {
        const diff = Math.abs(listing.bathrooms - userPreferences.bathrooms!);
        return diff <= 0.5; // Allow exact match or ±0.5 bathroom
      });
    }

    // Filter by minimum rating if user has set preference
    if (userPreferences.minRating) {
      filteredListings = filteredListings.filter(listing => {
        // Include listings with no rating (new listings) OR ratings >= minRating
        return !listing.averageRating || listing.averageRating >= userPreferences.minRating!;
      });
    }

    // Cap at 500 listings max to keep scoring fast
    if (filteredListings.length > 500) {
      filteredListings = filteredListings.slice(0, 500);
    }

    // Now score only the filtered subset
    const ranked = rankListings(filteredListings, userPreferences, swipeHistory);

    return ranked;
  }, [listings, user, sessionLearnedPreferences]);


  return (
    <div className="h-screen md:min-h-screen overflow-hidden md:overflow-auto bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 md:px-6 h-full md:h-auto py-4 md:py-8">
        <div className="flex items-center justify-between mb-4 md:mb-8 relative z-50">
          <SharedNavbar
            onPreferencesClick={() => router.push("/preferences")}
            onMyReviewsClick={() => router.push("/my-reviews")}
            onLikedListingsClick={() => router.push("/liked-listings")}
            showBackToHome={true}
            likedCount={likedCount}
          />
        </div>

        {/* Learning Banner - Shows for first 5 swipes */}
        {isLearning && (
          <div className="mb-4 mx-auto max-w-2xl animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 rounded-lg p-4 shadow-lg border border-indigo-400/30">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white mb-1">
                    Learning Your Preferences...
                  </h3>
                  <p className="text-xs text-indigo-100">
                    Swipe on {swipesRemaining} more {swipesRemaining === 1 ? 'apartment' : 'apartments'} and we'll personalize your recommendations based on what you like!
                  </p>
                  <div className="mt-2 flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          i < totalSwipes
                            ? 'bg-white shadow-sm'
                            : 'bg-indigo-300/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Personalization Success Message */}
        {showPersonalizedMessage && (
          <div className="mb-4 mx-auto max-w-2xl animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 rounded-lg p-4 shadow-lg border border-green-400/30">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white mb-1">
                    ✨ Personalization Activated!
                  </h3>
                  <p className="text-xs text-green-100">
                    We've learned your preferences and re-ranked your recommendations. Listings are now ordered by what you're most likely to love!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoadingListings ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Loading listings...</div>
          </div>
        ) : rankedListings.length > 0 ? (
          <CardStack
            listings={rankedListings}
            onLikedChange={setLikedIds}
            initialLikedIds={likedIds}
            onViewLiked={() => router.push("/liked-listings")}
            initialCompleted={hasCompletedAll}
            onCompletedChange={setHasCompletedAll}
            showMatchScores={totalSwipes >= 5 || hasPersonalized}
            onSwipeCountUpdate={handleSwipeCountUpdate}
          />
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">No listings available</div>
          </div>
        )}
      </div>
    </div>
  );
}



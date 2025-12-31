"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import CardStack from "@/components/CardStack";
import SharedNavbar from "@/components/SharedNavbar";
import PreferencesReminderPopup from "@/components/PreferencesReminderPopup";
import { useUser } from "@/contexts/UserContext";
import { initializeFakeRentalHistory } from "@/lib/data";
import { useLikedListingsContext } from "@/contexts/LikedListingsContext";
import { useListings } from "@/contexts/ListingsContext";
import {
  rankListings,
  getSwipeHistory,
  shouldUpdateLearnedPreferences,
  calculateLearnedPreferences,
  extractAmenities,
} from "@/lib/recommendations";
import { trainModel, isModelValid, suggestScoringWeights } from "@/lib/ml-model";
import confetti from "canvas-confetti";

export default function SwipePage() {
  const router = useRouter();
  const { user, updateLearnedPreferences, updatePreferences, loading: userLoading } = useUser();
  const { likedIds, likedCount, setLikedIds, loading: likedLoading } = useLikedListingsContext();
  const { listings, isLoading: isLoadingListings } = useListings();
  const [hasCompletedAll, setHasCompletedAll] = useState(false);
  const [sessionLearnedPreferences, setSessionLearnedPreferences] = useState<any>(null);
  const [hasPersonalized, setHasPersonalized] = useState(false);
  const [showPersonalizedMessage, setShowPersonalizedMessage] = useState(false);
  const [totalSwipes, setTotalSwipes] = useState(0);
  const [showPreferencesPopup, setShowPreferencesPopup] = useState(false);
  const [isTrainingML, setIsTrainingML] = useState(false);
  const [mlTrainingMessage, setMlTrainingMessage] = useState<string | null>(null);
  const [mlInsight, setMlInsight] = useState<{
    topPriority: string;
    confidence: number;
    amenityDetails?: string;
    tiedWith?: string[];
  } | null>(null);

  // Wait for ALL contexts to finish loading before rendering to prevent race conditions
  const isLoading = userLoading || isLoadingListings || likedLoading;

  // Check if user has set preferences and show popup if not
  useEffect(() => {
    if (!userLoading && user) {
      const hasPreferences = user.preferences?.address || user.preferences?.priceMin || user.preferences?.priceMax;
      const neverAskAgain = localStorage.getItem("haven_never_ask_preferences") === "true";

      if (!hasPreferences && !neverAskAgain) {
        // Show popup after a short delay for better UX
        const timer = setTimeout(() => {
          setShowPreferencesPopup(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, userLoading]);

  // Read reviewed listings on mount - can be reset by Start Over
  const [initialReviewedIds, setInitialReviewedIds] = useState(() => {
    const swipeHistory = getSwipeHistory();
    return new Set(swipeHistory.map(s => s.listingId));
  });

  // Handler to reset reviewed listings (called by Start Over button)
  const handleStartOver = () => {
    setInitialReviewedIds(new Set()); // Reset to empty - show all listings
  };

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

    // NEW: Trigger ML training at milestones (10, 20, 30, ...)
    // Skip if user has manually locked their weights
    const currentSwipeCount = swipeHistory.length;
    const shouldTrainML =
      currentSwipeCount >= 10 &&
      currentSwipeCount % 10 === 0 && // Every 10 swipes
      !isTrainingML && // Not already training
      !user?.preferences?.weightsLocked && // Not locked by user
      user &&
      listings.length > 0;

    if (shouldTrainML) {
      trainMLModel(swipeHistory);
    }
  };

  // ML training function
  const trainMLModel = async (swipeHistory: Array<{ listingId: string; liked: boolean }>) => {
    setIsTrainingML(true);
    console.log('[Swipe] Starting ML training with', swipeHistory.length, 'examples');

    try {
      const userLocation = user?.preferences?.latitude && user?.preferences?.longitude
        ? { latitude: user.preferences.latitude, longitude: user.preferences.longitude }
        : undefined;

      const result = await trainModel(listings, swipeHistory, userLocation);

      if (result.success && result.weights) {
        console.log('[Swipe] ML training successful. Accuracy:', result.accuracy?.toFixed(3));

        // Calculate learned preferences (amenities, image count, description length)
        const learnedPrefs = calculateLearnedPreferences(listings, swipeHistory);

        // Save learned preferences to database
        const updatedLearned = {
          ...learnedPrefs,
          updatedAt: new Date().toISOString(),
        };

        await updateLearnedPreferences(updatedLearned);

        // Calculate weight suggestions from the trained model
        const suggestion = suggestScoringWeights(result.weights);

        // Save the suggested weights (this won't run if weights are locked due to check above)
        // Only update weights, preserve everything else
        // IMPORTANT: Don't include weightsLocked at all - only user can change that in profile page
        const currentPrefs = user?.preferences || {};
        await updatePreferences({
          address: currentPrefs.address,
          latitude: currentPrefs.latitude,
          longitude: currentPrefs.longitude,
          commute: currentPrefs.commute,
          priceMin: currentPrefs.priceMin,
          priceMax: currentPrefs.priceMax,
          bedrooms: currentPrefs.bedrooms,
          bathrooms: currentPrefs.bathrooms,
          ratingMin: currentPrefs.ratingMin,
          ratingMax: currentPrefs.ratingMax,
          requiredAmenities: currentPrefs.requiredAmenities,
          weights: {
            distance: suggestion.distance,
            amenities: suggestion.amenities,
            propertyFeatures: suggestion.propertyFeatures,
            quality: suggestion.quality,
            rating: suggestion.rating,
          },
          // weightsLocked intentionally omitted - will not update database
        });

        // Only show success message and confetti on first ML training (10 swipes)
        if (swipeHistory.length === 10) {
          setMlTrainingMessage(
            `🎯 ML model trained! Your recommendations are now ${(result.accuracy! * 100).toFixed(0)}% accurate.`
          );
          setTimeout(() => setMlTrainingMessage(null), 5000);

          // Show personalization message
          setShowPersonalizedMessage(true);
          setTimeout(() => setShowPersonalizedMessage(false), 4000);

          // Trigger confetti celebration! 🎉
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#8b5cf6', '#ec4899', '#10b981'],
          });
        }

        // Check if we should show/update the learning insight
        const previousTopPriority = localStorage.getItem('haven_last_top_priority');
        const previousAmenities = localStorage.getItem('haven_last_amenities');

        // Get current amenity details
        let amenityDetails: string | undefined;
        let currentAmenities: string | undefined;
        if (suggestion.topPriority === 'amenities' && learnedPrefs.preferredAmenities) {
          const amenities = Object.entries(learnedPrefs.preferredAmenities)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 3)
            .map(([amenity]) => amenity);
          if (amenities.length > 0) {
            amenityDetails = amenities.join(', ');
            currentAmenities = amenities.sort().join('|'); // Sorted for comparison
          }
        }

        // Check if there's a tie (multiple priorities with same weight)
        const maxWeight = Math.max(suggestion.distance, suggestion.amenities, suggestion.propertyFeatures, suggestion.quality, suggestion.rating);
        const allPriorities: Array<{ name: string; weight: number }> = [
          { name: 'distance', weight: suggestion.distance },
          { name: 'amenities', weight: suggestion.amenities },
          { name: 'propertyFeatures', weight: suggestion.propertyFeatures },
          { name: 'quality', weight: suggestion.quality },
          { name: 'rating', weight: suggestion.rating },
        ];

        const tiedPriorities = allPriorities
          .filter(p => p.weight === maxWeight && p.name !== suggestion.topPriority)
          .map(p => p.name);

        // Show insight if: top priority changed OR amenities changed significantly
        const topPriorityChanged = previousTopPriority !== suggestion.topPriority;
        const amenitiesChanged = currentAmenities && previousAmenities !== currentAmenities;

        if (topPriorityChanged || amenitiesChanged) {
          // Update existing banner or create new one
          setMlInsight({
            topPriority: suggestion.topPriority,
            confidence: suggestion.confidence,
            amenityDetails,
            tiedWith: tiedPriorities.length > 0 ? tiedPriorities : undefined,
          });

          // Save the new values
          localStorage.setItem('haven_last_top_priority', suggestion.topPriority);
          if (currentAmenities) {
            localStorage.setItem('haven_last_amenities', currentAmenities);
          }
        }
      } else {
        console.warn('[Swipe] ML training failed:', result.error);
        setMlTrainingMessage(`⚠️ ${result.error}`);
        setTimeout(() => setMlTrainingMessage(null), 4000);
      }
    } catch (error) {
      console.error('[Swipe] ML training error:', error);
      setMlTrainingMessage('⚠️ ML training failed. Will retry on next milestone.');
      setTimeout(() => setMlTrainingMessage(null), 4000);
    } finally {
      setIsTrainingML(false);
    }
  };

  // Check if user has learned preferences saved to database (memoized for stable reference)
  const hasLearnedPreferences = useMemo(() => {
    return user?.preferences?.learned?.preferredAmenities &&
      Object.keys(user.preferences.learned.preferredAmenities).length > 0;
  }, [user?.preferences?.learned?.preferredAmenities]);

  // Check if this is a new user (for learning banner)
  const isLearning = totalSwipes < 10 && !hasLearnedPreferences;
  const swipesRemaining = Math.max(0, 10 - totalSwipes);

  // Filter and rank listings based on user preferences
  // NOTE: Array stays stable during session (uses initialReviewedIds from mount)
  const rankedListings = useMemo(() => {
    if (listings.length === 0 || !user) return [];

    // Use session learned preferences (fresh) if available, otherwise use database preferences
    const userPreferences = sessionLearnedPreferences
      ? { ...user.preferences, learned: sessionLearnedPreferences }
      : user.preferences || {};

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
        // Use the state field directly from listing
        const listingState = ((listing as any).state?.toLowerCase() || '');

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

    // Filter by bedroom selections if user has set preference
    if (userPreferences.bedrooms && userPreferences.bedrooms.length > 0) {
      filteredListings = filteredListings.filter(listing => {
        return userPreferences.bedrooms!.includes(listing.bedrooms);
      });
    }

    // Filter by bathroom selections if user has set preference
    if (userPreferences.bathrooms && userPreferences.bathrooms.length > 0) {
      filteredListings = filteredListings.filter(listing => {
        return userPreferences.bathrooms!.includes(listing.bathrooms);
      });
    }

    // Filter by rating range if user has set preference
    if (userPreferences.ratingMin !== undefined || userPreferences.ratingMax !== undefined) {
      filteredListings = filteredListings.filter(listing => {
        const min = userPreferences.ratingMin ?? 0;
        const max = userPreferences.ratingMax ?? 5;
        // Include listings with no rating (new listings) OR ratings within range
        return !listing.averageRating || (listing.averageRating >= min && listing.averageRating <= max);
      });
    }

    // Hard filter by required amenities - listings MUST have ALL required amenities
    if (userPreferences.requiredAmenities && userPreferences.requiredAmenities.length > 0) {
      filteredListings = filteredListings.filter(listing => {
        // Check if listing has all required amenities
        const listingAmenities = extractAmenities(listing);
        return userPreferences.requiredAmenities!.every(requiredAmenity =>
          listingAmenities.some(listingAmenity =>
            listingAmenity.toLowerCase().includes(requiredAmenity.toLowerCase()) ||
            requiredAmenity.toLowerCase().includes(listingAmenity.toLowerCase())
          )
        );
      });
    }

    // Cap at 500 listings max to keep scoring fast
    if (filteredListings.length > 500) {
      filteredListings = filteredListings.slice(0, 500);
    }

    // Rank all listings (including already-reviewed ones)
    const allRanked = rankListings(filteredListings, userPreferences, []);

    // Split into reviewed and new listings
    const reviewedListings = allRanked.filter(listing => initialReviewedIds.has(listing.id));
    const newListings = allRanked.filter(listing => !initialReviewedIds.has(listing.id));

    // Return with reviewed first, then new (keeps count consistent - e.g., 1-29 instead of 1-19)
    return [...reviewedListings, ...newListings];
  }, [listings, user, sessionLearnedPreferences, initialReviewedIds]);


  // Show loading screen while contexts initialize to prevent navigation loops
  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen md:min-h-screen overflow-hidden md:overflow-auto bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Preferences Reminder Popup */}
      <PreferencesReminderPopup
        show={showPreferencesPopup}
        onDismiss={() => setShowPreferencesPopup(false)}
      />

      <div className="container mx-auto px-4 md:px-6 h-full md:h-auto py-4 md:py-8">
        <div className="flex items-center justify-between mb-4 md:mb-8 relative">
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

        {/* ML Training Success/Error Message */}
        {mlTrainingMessage && (
          <div className="mb-4 mx-auto max-w-2xl animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 rounded-lg p-4 shadow-lg border border-emerald-400/30">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">
                    {mlTrainingMessage}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ML Insight Banner */}
        {mlInsight && (
          <div className="mb-4 mx-auto max-w-2xl animate-in slide-in-from-top duration-300">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 shadow-md">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">🤖</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1">
                    Learning Insight
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    {mlInsight.topPriority === 'amenities' && mlInsight.amenityDetails ? (
                      <>
                        You now prioritize <span className="font-bold">{mlInsight.topPriority}</span> when choosing apartments, especially: <span className="font-bold">{mlInsight.amenityDetails}</span>
                        {mlInsight.tiedWith && mlInsight.tiedWith.length > 0 && (
                          <> (along with <span className="font-bold">
                            {mlInsight.tiedWith.length === 1
                              ? mlInsight.tiedWith[0]
                              : mlInsight.tiedWith.length === 2
                              ? `${mlInsight.tiedWith[0]} and ${mlInsight.tiedWith[1]}`
                              : `${mlInsight.tiedWith.slice(0, -1).join(', ')}, and ${mlInsight.tiedWith[mlInsight.tiedWith.length - 1]}`
                            }</span>)</>
                        )}.
                      </>
                    ) : (
                      <>
                        You now prioritize <span className="font-bold">{mlInsight.topPriority}</span> when choosing apartments
                        {mlInsight.tiedWith && mlInsight.tiedWith.length > 0 && (
                          <> (along with <span className="font-bold">
                            {mlInsight.tiedWith.length === 1
                              ? mlInsight.tiedWith[0]
                              : mlInsight.tiedWith.length === 2
                              ? `${mlInsight.tiedWith[0]} and ${mlInsight.tiedWith[1]}`
                              : `${mlInsight.tiedWith.slice(0, -1).join(', ')}, and ${mlInsight.tiedWith[mlInsight.tiedWith.length - 1]}`
                            }</span>)</>
                        )}.
                      </>
                    )}
                    {' '}Your match scores reflect this automatically.
                  </p>
                  <button
                    onClick={() => router.push('/profile')}
                    className="mt-2 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 font-medium underline"
                  >
                    Don't agree? Update weights in profile →
                  </button>
                </div>
                <button
                  onClick={() => setMlInsight(null)}
                  className="flex-shrink-0 text-purple-400 hover:text-purple-600 dark:hover:text-purple-200 transition-colors"
                  aria-label="Dismiss"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
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
            showMatchScores={totalSwipes >= 5 || hasPersonalized || hasLearnedPreferences}
            onSwipeCountUpdate={handleSwipeCountUpdate}
            onStartOver={handleStartOver}
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



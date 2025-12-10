"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import CardStack from "@/components/CardStack";
import SharedNavbar from "@/components/SharedNavbar";
import { useUser } from "@/contexts/UserContext";
import { initializeFakeRentalHistory } from "@/lib/data";
import { useLikedListingsContext } from "@/contexts/LikedListingsContext";
import { useListings } from "@/contexts/ListingsContext";

export default function SwipePage() {
  const router = useRouter();
  const { user } = useUser();
  const { likedIds, likedCount, setLikedIds } = useLikedListingsContext();
  const { listings, isLoading: isLoadingListings } = useListings();
  const [hasCompletedAll, setHasCompletedAll] = useState(false);

  // Initialize fake rental history on first load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeFakeRentalHistory();
    }
  }, []);

  // Shuffle the listings once when they're loaded
  const shuffledListings = useMemo(() => {
    if (listings.length === 0) return [];
    const shuffled = [...listings];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [listings]);


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
        {isLoadingListings ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Loading listings...</div>
          </div>
        ) : shuffledListings.length > 0 ? (
          <CardStack
            listings={shuffledListings}
            onLikedChange={setLikedIds}
            initialLikedIds={likedIds}
            onViewLiked={() => router.push("/liked-listings")}
            initialCompleted={hasCompletedAll}
            onCompletedChange={setHasCompletedAll}
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



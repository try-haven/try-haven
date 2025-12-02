"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CardStack from "@/components/CardStack";
import SharedNavbar from "@/components/SharedNavbar";
import { useUser } from "@/contexts/UserContext";
import { fakeListings } from "@/lib/data";

export default function SwipePage() {
  const router = useRouter();
  const { user } = useUser();
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [hasCompletedAll, setHasCompletedAll] = useState(false);

  // Load liked listings from localStorage
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
      }
    }
  }, [user]);

  // Save liked listings to localStorage whenever they change
  useEffect(() => {
    if (user && likedIds.size > 0) {
      localStorage.setItem(`haven_liked_listings_${user.username}`, JSON.stringify(Array.from(likedIds)));
    } else if (user && likedIds.size === 0) {
      localStorage.removeItem(`haven_liked_listings_${user.username}`);
    }
  }, [likedIds, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-4 md:py-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-4 md:mb-8 relative z-50">
          <SharedNavbar 
            onPreferencesClick={() => router.push("/preferences")}
            onMyReviewsClick={() => router.push("/my-reviews")}
            onLikedListingsClick={() => router.push("/liked-listings")}
            showBackToHome={true}
          />
        </div>
        <CardStack 
          listings={fakeListings} 
          onLikedChange={setLikedIds}
          initialLikedIds={likedIds}
          onViewLiked={() => router.push("/liked-listings")}
          initialCompleted={hasCompletedAll}
          onCompletedChange={setHasCompletedAll}
        />
      </div>
    </div>
  );
}



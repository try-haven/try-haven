"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CardStack from "@/components/CardStack";
import SharedNavbar from "@/components/SharedNavbar";
import { useUser } from "@/contexts/UserContext";
import { fakeListings, ApartmentListing } from "@/lib/data";

export default function SwipePage() {
  const router = useRouter();
  const { user } = useUser();
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [hasCompletedAll, setHasCompletedAll] = useState(false);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const [allListings, setAllListings] = useState<ApartmentListing[]>([]);

  // Load all manager listings and combine with fake listings
  useEffect(() => {
    const loadAllListings = () => {
      const managerListings: ApartmentListing[] = [];

      // Get all users
      const usersData = localStorage.getItem("haven_users");
      if (usersData) {
        try {
          const users = JSON.parse(usersData);
          // Load listings from all managers
          users.forEach((u: any) => {
            if (u.userType === "manager") {
              const listings = localStorage.getItem(`haven_manager_listings_${u.username}`);
              if (listings) {
                const parsedListings = JSON.parse(listings);
                managerListings.push(...parsedListings);
              }
            }
          });
        } catch (error) {
          console.error("Error loading manager listings:", error);
        }
      }

      // Combine and shuffle
      const combined = [...fakeListings, ...managerListings];
      // Simple shuffle
      for (let i = combined.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [combined[i], combined[j]] = [combined[j], combined[i]];
      }

      setAllListings(combined);
    };

    loadAllListings();
  }, []);

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
      setHasLoadedFromStorage(true);
    }
  }, [user]);

  // Save liked listings to localStorage whenever they change (after initial load)
  useEffect(() => {
    if (!hasLoadedFromStorage) return; // Don't save until we've loaded from storage

    if (user && likedIds.size > 0) {
      localStorage.setItem(`haven_liked_listings_${user.username}`, JSON.stringify(Array.from(likedIds)));
    } else if (user && likedIds.size === 0) {
      localStorage.removeItem(`haven_liked_listings_${user.username}`);
    }
  }, [likedIds, user, hasLoadedFromStorage]);

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
        {allListings.length > 0 ? (
          <CardStack
            listings={allListings}
            onLikedChange={setLikedIds}
            initialLikedIds={likedIds}
            onViewLiked={() => {
              // Ensure localStorage is saved before navigating
              if (user && likedIds.size > 0) {
                localStorage.setItem(`haven_liked_listings_${user.username}`, JSON.stringify(Array.from(likedIds)));
              }
              // Small delay to ensure localStorage write completes
              setTimeout(() => router.push("/liked-listings"), 50);
            }}
            initialCompleted={hasCompletedAll}
            onCompletedChange={setHasCompletedAll}
          />
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Loading listings...</div>
          </div>
        )}
      </div>
    </div>
  );
}



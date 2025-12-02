"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LikedListings from "@/components/LikedListings";
import { useUser } from "@/contexts/UserContext";
import { fakeListings } from "@/lib/data";

export default function LikedListingsPage() {
  const router = useRouter();
  const { user } = useUser();
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load liked listings from localStorage
  useEffect(() => {
    if (user) {
      console.log('[LikedListingsPage] Loading liked listings for user:', user.username);
      const storedLikedIds = localStorage.getItem(`haven_liked_listings_${user.username}`);
      console.log('[LikedListingsPage] Stored liked IDs:', storedLikedIds);
      if (storedLikedIds) {
        try {
          const parsedIds = JSON.parse(storedLikedIds);
          console.log('[LikedListingsPage] Parsed IDs:', parsedIds);
          setLikedIds(new Set(parsedIds));
        } catch (error) {
          console.error("Error parsing liked listings:", error);
        }
      }
      setIsLoading(false);
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

  const likedListings = fakeListings.filter((listing) => likedIds.has(listing.id));

  const handleRemoveLike = (listingId: string) => {
    setLikedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(listingId);
      return newSet;
    });
  };

  return (
    <LikedListings
      likedListings={likedListings}
      onBack={() => router.push("/swipe")}
      onRemoveLike={handleRemoveLike}
      onBackToHome={() => router.push("/")}
    />
  );
}



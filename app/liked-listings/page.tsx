"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LikedListings from "@/components/LikedListings";
import { useUser } from "@/contexts/UserContext";
import { fakeListings, ApartmentListing } from "@/lib/data";

export default function LikedListingsPage() {
  const router = useRouter();
  const { user, isLoggedIn } = useUser();
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [allListings, setAllListings] = useState<ApartmentListing[]>([]);

  // Load all listings (fake + manager listings)
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

      // Combine fake listings and manager listings
      const combined = [...fakeListings, ...managerListings];
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
      setIsLoading(false);
    }
  }, [user]);

  // Save liked listings to localStorage whenever they change (after initial load)
  useEffect(() => {
    if (isLoading) return; // Don't save until we've loaded from storage

    if (user && likedIds.size > 0) {
      localStorage.setItem(`haven_liked_listings_${user.username}`, JSON.stringify(Array.from(likedIds)));
    } else if (user && likedIds.size === 0) {
      localStorage.removeItem(`haven_liked_listings_${user.username}`);
    }
  }, [likedIds, user, isLoading]);

  const likedListings = allListings.filter((listing) => likedIds.has(listing.id));

  const handleRemoveLike = (listingId: string) => {
    setLikedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(listingId);
      return newSet;
    });

    if (!user) return;

    // Track the removal as a metric event
    const metricsData = localStorage.getItem("haven_listing_metrics");
    const metrics = metricsData ? JSON.parse(metricsData) : {};

    if (!metrics[listingId]) {
      metrics[listingId] = { listingId, views: 0, swipeRights: 0, swipeLefts: 0, shares: 0 };
    }

    // Decrement swipe rights count
    metrics[listingId].swipeRights = Math.max(0, (metrics[listingId].swipeRights || 0) - 1);
    localStorage.setItem("haven_listing_metrics", JSON.stringify(metrics));

    // Store timestamped event for trends (track as an unlike)
    const eventsData = localStorage.getItem("haven_listing_metric_events");
    const events = eventsData ? JSON.parse(eventsData) : [];
    events.push({
      listingId,
      timestamp: Date.now(),
      type: 'unlike',
      userId: user.username
    });
    localStorage.setItem("haven_listing_metric_events", JSON.stringify(events));
  };

  return (
    <LikedListings
      likedListings={likedListings}
      onBack={() => router.push("/swipe")}
      onRemoveLike={handleRemoveLike}
      onBackToHome={() => router.push("/")}
      isLoading={isLoading}
    />
  );
}



"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import LikedListings from "@/components/LikedListings";
import { useUser } from "@/contexts/UserContext";
import { useLikedListingsContext } from "@/contexts/LikedListingsContext";
import { useListings } from "@/contexts/ListingsContext";

export default function LikedListingsPage() {
  const router = useRouter();
  const { user, isLoggedIn } = useUser();
  const { likedIds, likedCount, toggleLike, loading: likedLoading } = useLikedListingsContext();
  const { listings, isLoading: isLoadingListings } = useListings();

  const likedListings = useMemo(() =>
    listings.filter((listing) => likedIds.has(listing.id)),
    [listings, likedIds]
  );

  const handleRemoveLike = async (listingId: string) => {
    await toggleLike(listingId);

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
      isLoading={isLoadingListings || likedLoading}
      likedCount={likedCount}
    />
  );
}



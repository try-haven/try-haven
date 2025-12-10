"use client";

import { useRouter } from "next/navigation";
import ReviewedListings from "@/components/ReviewedListings";
import { useLikedListingsContext } from "@/contexts/LikedListingsContext";

export default function MyReviewsPage() {
  const router = useRouter();
  const { likedCount } = useLikedListingsContext();

  return (
    <ReviewedListings
      onBack={() => router.push("/swipe")}
      onBackToHome={() => router.push("/")}
      likedCount={likedCount}
    />
  );
}



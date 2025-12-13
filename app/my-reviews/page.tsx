"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ReviewedListings from "@/components/ReviewedListings";
import { useLikedListingsContext } from "@/contexts/LikedListingsContext";
import { useUser } from "@/contexts/UserContext";

export default function MyReviewsPage() {
  const router = useRouter();
  const { isLoggedIn } = useUser();
  const { likedCount } = useLikedListingsContext();

  // Redirect to home page if user logs out
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/");
    }
  }, [isLoggedIn, router]);

  return (
    <ReviewedListings
      onBack={() => router.push("/swipe")}
      onBackToHome={() => router.push("/")}
      likedCount={likedCount}
    />
  );
}



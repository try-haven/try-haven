"use client";

import { useState, useEffect } from "react";
import { ApartmentListing } from "@/lib/data";
import SwipeableCard from "./SwipeableCard";

interface CardStackProps {
  listings: ApartmentListing[];
  onLikedChange: (likedIds: Set<string>) => void;
  initialLikedIds?: Set<string>;
  onViewLiked?: () => void;
  initialCompleted?: boolean;
  onCompletedChange?: (completed: boolean) => void;
}

export default function CardStack({ listings, onLikedChange, initialLikedIds = new Set(), onViewLiked, initialCompleted = false, onCompletedChange }: CardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(initialCompleted ? listings.length : 0);
  const [swipedListings, setSwipedListings] = useState<Set<string>>(new Set());
  const [likedListings, setLikedListings] = useState<Set<string>>(initialLikedIds);
  const [triggerSwipe, setTriggerSwipe] = useState<"left" | "right" | null>(null);
  const [triggeredListingId, setTriggeredListingId] = useState<string | null>(null);

  // Sync completion state when navigating back
  useEffect(() => {
    if (initialCompleted && currentIndex < listings.length) {
      setCurrentIndex(listings.length);
    }
  }, [initialCompleted, listings.length, currentIndex]);

  // Sync liked listings with parent component when navigating back
  // Merge parent's liked IDs with our current ones to preserve any new likes
  useEffect(() => {
    const currentIds = Array.from(likedListings).sort().join(',');
    const parentIds = Array.from(initialLikedIds).sort().join(',');
    
    // If parent has liked IDs we don't have, merge them in
    if (parentIds !== currentIds && initialLikedIds.size > 0) {
      const merged = new Set([...likedListings, ...initialLikedIds]);
      if (merged.size !== likedListings.size) {
        setLikedListings(merged);
      }
    }
  }, [initialLikedIds]);

  // Sync liked listings to parent component when they change
  useEffect(() => {
    onLikedChange(likedListings);
  }, [likedListings, onLikedChange]);

  // Sync completion state to parent component when all listings are completed
  useEffect(() => {
    if (currentIndex >= listings.length && onCompletedChange && !initialCompleted) {
      onCompletedChange(true);
    }
  }, [currentIndex, listings.length, onCompletedChange, initialCompleted]);

  const handleSwipe = (direction: "left" | "right") => {
    if (currentIndex < listings.length) {
      const listingId = listings[currentIndex].id;
      setSwipedListings((prev) => new Set(prev).add(listingId));
      
      if (direction === "right") {
        setLikedListings((prev) => {
          const newLiked = new Set(prev);
          newLiked.add(listingId);
          return newLiked;
        });
      } else {
        // Remove from liked if it was previously liked (in case of undo)
        setLikedListings((prev) => {
          const newLiked = new Set(prev);
          newLiked.delete(listingId);
          return newLiked;
        });
      }
      
      setCurrentIndex((prev) => prev + 1);
      
      // Log swipe action (will be replaced with API call later)
      console.log(`Swiped ${direction} on listing ${listingId}`);
    }
  };

  const handleLike = () => {
    if (currentIndex < listings.length) {
      const listingId = listings[currentIndex].id;
      setTriggeredListingId(listingId);
      setTriggerSwipe("right");
    }
  };

  const handlePass = () => {
    if (currentIndex < listings.length) {
      const listingId = listings[currentIndex].id;
      setTriggeredListingId(listingId);
      setTriggerSwipe("left");
    }
  };

  // Reset trigger after animation completes
  useEffect(() => {
    if (triggerSwipe) {
      const timer = setTimeout(() => {
        setTriggerSwipe(null);
        setTriggeredListingId(null);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [triggerSwipe]);

  const remainingListings = listings.filter(
    (listing) => !swipedListings.has(listing.id)
  );

  // Handle arrow key navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle arrow keys when not at the end
      if (currentIndex >= listings.length) return;

      // Prevent default behavior for arrow keys
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
      }

      if (event.key === "ArrowLeft") {
        // Swipe left (pass)
        if (currentIndex < listings.length) {
          const listingId = listings[currentIndex].id;
          setTriggeredListingId(listingId);
          setTriggerSwipe("left");
        }
      } else if (event.key === "ArrowRight") {
        // Swipe right (like)
        if (currentIndex < listings.length) {
          const listingId = listings[currentIndex].id;
          setTriggeredListingId(listingId);
          setTriggerSwipe("right");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentIndex, listings]);

  if (currentIndex >= listings.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[600px] text-center p-8">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          You&apos;ve seen all listings!
        </h2>
        <p className="text-gray-600 mb-6">
          Check back later for more apartments or upload your own listing.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          {likedListings.size > 0 && onViewLiked && (
            <button
              onClick={onViewLiked}
              className="px-6 py-3 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              See Liked ({likedListings.size})
            </button>
          )}
          <button
            onClick={() => {
              setCurrentIndex(0);
              setSwipedListings(new Set());
              if (onCompletedChange) {
                onCompletedChange(false);
              }
              // Don't reset liked listings - keep them!
            }}
            className="px-6 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[700px]">
      {/* Card Stack */}
      <div className="relative w-full max-w-md mx-auto h-full">
        {/* Action Buttons on Sides - Positioned outside card but not too far */}
        <button
          onClick={handlePass}
          className="group absolute left-0 top-1/2 -translate-y-1/2 -translate-x-20 w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-110 transition-all border-2 border-red-200 hover:bg-red-500 hover:border-red-500 z-50"
          aria-label="Pass"
        >
                <svg
                  className="w-7 h-7 text-red-500 group-hover:text-white transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <button
          onClick={handleLike}
          className="group absolute right-0 top-1/2 -translate-y-1/2 translate-x-20 w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-110 transition-all border-2 border-green-200 hover:bg-green-500 hover:border-green-500 z-50"
          aria-label="Like"
        >
          <svg
            className="w-7 h-7 text-green-500 group-hover:text-white transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
        {listings
          .slice(currentIndex, currentIndex + 3)
          .map((listing, i) => {
            const shouldTrigger = triggerSwipe && listing.id === triggeredListingId;
            return (
              <SwipeableCard
                key={listing.id}
                listing={listing}
                onSwipe={handleSwipe}
                index={i}
                total={Math.min(3, listings.length - currentIndex)}
                triggerSwipe={shouldTrigger ? triggerSwipe : null}
              />
            );
          })}
      </div>

      {/* Progress Indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex gap-2">
        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-sm font-medium text-gray-700">
          {currentIndex + 1} / {listings.length}
        </div>
        {likedListings.size > 0 && (
          <div className="bg-green-500/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-sm font-medium text-white flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            {likedListings.size}
          </div>
        )}
      </div>
    </div>
  );
}



"use client";

import { useState, useEffect, useMemo } from "react";
import { ApartmentListing } from "@/lib/data";
import SwipeableCard from "./SwipeableCard";
import AdOverlay from "./AdOverlay";
import AdCard from "./AdCard";

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
  const [swipeCount, setSwipeCount] = useState(0);

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
    // Calculate items array to get total count including ads
    const items: Array<{ type: "listing" | "ad"; data?: ApartmentListing; adIndex?: number }> = [];
    let adCount = 0;
    listings.forEach((listing, idx) => {
      items.push({ type: "listing", data: listing });
      if ((idx + 1) % 5 === 0 && idx < listings.length - 1) {
        items.push({ type: "ad", adIndex: adCount++ });
      }
    });
    const totalItems = items.length;
    
    if (currentIndex >= totalItems && onCompletedChange && !initialCompleted) {
      onCompletedChange(true);
    }
  }, [currentIndex, listings, onCompletedChange, initialCompleted]);

  const handleSwipe = (direction: "left" | "right") => {
    // Calculate items array
    const items: Array<{ type: "listing" | "ad"; data?: ApartmentListing; adIndex?: number }> = [];
    let adCount = 0;

    listings.forEach((listing, idx) => {
      items.push({ type: "listing", data: listing });
      if ((idx + 1) % 5 === 0 && idx < listings.length - 1) {
        items.push({ type: "ad", adIndex: adCount++ });
      }
    });

    const totalItems = items.length;

    if (currentIndex < totalItems) {
      const currentItem = items[currentIndex];

      // If it's an ad, just advance (ads don't support swipe, only skip)
      if (currentItem?.type === "ad") {
        return; // Don't handle swipe for ads
      }

      // Otherwise, handle as normal listing
      const listingId = currentItem?.data?.id;
      if (!listingId) return;
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
      setSwipeCount((prev) => prev + 1);

      // Log swipe action (will be replaced with API call later)
      console.log(`Swiped ${direction} on listing ${listingId}`);
    }
  };

  const handleLike = () => {
    // Check if current item is an ad
    const items: Array<{ type: "listing" | "ad"; data?: ApartmentListing; adIndex?: number }> = [];
    let adCount = 0;

    listings.forEach((listing, idx) => {
      items.push({ type: "listing", data: listing });
      if ((idx + 1) % 5 === 0 && idx < listings.length - 1) {
        items.push({ type: "ad", adIndex: adCount++ });
      }
    });

    const currentItem = items[currentIndex];
    
    // Don't handle like/pass if current item is an ad
    if (currentItem?.type === "ad") {
      return;
    }

    if (currentItem?.data) {
      const listingId = currentItem.data.id;
      setTriggeredListingId(listingId);
      setTriggerSwipe("right");
    }
  };

  const handlePass = () => {
    // Check if current item is an ad
    const items: Array<{ type: "listing" | "ad"; data?: ApartmentListing; adIndex?: number }> = [];
    let adCount = 0;

    listings.forEach((listing, idx) => {
      items.push({ type: "listing", data: listing });
      if ((idx + 1) % 5 === 0 && idx < listings.length - 1) {
        items.push({ type: "ad", adIndex: adCount++ });
      }
    });

    const currentItem = items[currentIndex];
    
    // Don't handle like/pass if current item is an ad
    if (currentItem?.type === "ad") {
      return;
    }

    if (currentItem?.data) {
      const listingId = currentItem.data.id;
      setTriggeredListingId(listingId);
      setTriggerSwipe("left");
    }
  };

  // Reset trigger after a short delay to allow animation to start
  useEffect(() => {
    if (triggerSwipe) {
      const timer = setTimeout(() => {
        setTriggerSwipe(null);
        setTriggeredListingId(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [triggerSwipe]);

  const remainingListings = listings.filter(
    (listing) => !swipedListings.has(listing.id)
  );

  // Handle arrow key navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Calculate items array
      const items: Array<{ type: "listing" | "ad"; data?: ApartmentListing; adIndex?: number }> = [];
      let adCount = 0;

      listings.forEach((listing, idx) => {
        items.push({ type: "listing", data: listing });
        if ((idx + 1) % 5 === 0 && idx < listings.length - 1) {
          items.push({ type: "ad", adIndex: adCount++ });
        }
      });

      const totalItems = items.length;

      // Only handle arrow keys when not at the end
      if (currentIndex >= totalItems) return;

      const currentItem = items[currentIndex];

      // If it's an ad, don't handle arrow keys
      if (currentItem?.type === "ad") {
        return;
      }

      // Prevent default behavior for arrow keys
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
      }

      if (event.key === "ArrowLeft") {
        // Swipe left (pass)
        if (currentItem?.data) {
          const listingId = currentItem.data.id;
          setTriggeredListingId(listingId);
          setTriggerSwipe("left");
        }
      } else if (event.key === "ArrowRight") {
        // Swipe right (like)
        if (currentItem?.data) {
          const listingId = currentItem.data.id;
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

  // Calculate items array to determine total
  const calculateItems = () => {
    const items: Array<{ type: "listing" | "ad"; data?: ApartmentListing; adIndex?: number }> = [];
    let adCount = 0;
    listings.forEach((listing, idx) => {
      items.push({ type: "listing", data: listing });
      if ((idx + 1) % 5 === 0 && idx < listings.length - 1) {
        items.push({ type: "ad", adIndex: adCount++ });
      }
    });
    return items;
  };

  const items = calculateItems();
  const totalItems = items.length;

  // Calculate how many listings have been viewed (not counting ads)
  const getListingIndex = (itemIndex: number) => {
    let listingCount = 0;
    for (let i = 0; i < itemIndex && i < items.length; i++) {
      if (items[i].type === "listing") {
        listingCount++;
      }
    }
    return listingCount;
  };

  if (currentIndex >= totalItems) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[600px] text-center p-8">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          You&apos;ve seen all listings!
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
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
    <div className="relative w-full h-screen flex flex-col">
      {/* Ad Overlay */}
      <AdOverlay position="bottom-right" />

      {/* Card Stack */}
      <div className="relative w-full max-w-5xl mx-auto flex-1 overflow-hidden mb-4 md:mb-0">
        {(() => {
          // Check if current item is an ad
          const currentItem = items[currentIndex];
          
          // If current item is an ad, only show the ad (no cards behind it)
          if (currentItem?.type === "ad") {
            return (
              <AdCard
                key={`ad-${currentItem.adIndex}`}
                onSkip={() => {
                  setCurrentIndex((prev) => {
                    const nextIndex = prev + 1;
                    // If we've reached the end after skipping ad, mark as completed
                    if (nextIndex >= items.length && onCompletedChange) {
                      onCompletedChange(true);
                    }
                    return nextIndex;
                  });
                }}
                index={0}
                total={1}
              />
            );
          }

          // Otherwise, show cards normally (up to 3 cards in stack)
          const visibleItems = items.slice(currentIndex, currentIndex + 3);

          return visibleItems.map((item, i) => {
            if (item.type === "ad") {
              // This shouldn't happen since we check above, but handle it just in case
              return null;
            } else if (item.data) {
              const isTriggeredCard = Boolean(triggerSwipe && item.data.id === triggeredListingId);
              return (
                <SwipeableCard
                  key={item.data.id}
                  listing={item.data}
                  onSwipe={handleSwipe}
                  index={i}
                  total={Math.min(3, items.length - currentIndex)}
                  triggerSwipe={isTriggeredCard ? triggerSwipe : null}
                  isTriggeredCard={isTriggeredCard}
                />
              );
            }
            return null;
          });
        })()}
      </div>

      {/* Action Buttons */}
      <div className="flex md:hidden justify-center gap-8 mt-6 px-4">
        {/* Mobile: Buttons below card */}
        <button
          onClick={handlePass}
          className="group w-16 h-16 rounded-full bg-white dark:bg-gray-800 shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-2 border-red-200 dark:border-red-800 hover:bg-red-500 hover:border-red-500 cursor-pointer hover:[&>svg]:text-white hover:[&>svg]:scale-110"
          aria-label="Pass"
        >
          <svg
            className="w-8 h-8 text-red-500 transition-all pointer-events-none"
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
          className="group w-16 h-16 rounded-full bg-white dark:bg-gray-800 shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-2 border-green-200 dark:border-green-800 hover:bg-green-500 hover:border-green-500 cursor-pointer hover:[&>svg]:text-white hover:[&>svg]:scale-110"
          aria-label="Like"
        >
          <svg
            className="w-8 h-8 text-green-500 transition-all pointer-events-none"
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
      </div>

      {/* Desktop: Buttons on sides */}
      <button
        onClick={handlePass}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgb(239 68 68)'; // red-500
          e.currentTarget.style.borderColor = 'rgb(239 68 68)';
          const svg = e.currentTarget.querySelector('svg');
          if (svg) {
            svg.style.color = 'white';
            svg.style.transform = 'scale(1.1)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '';
          e.currentTarget.style.borderColor = '';
          const svg = e.currentTarget.querySelector('svg');
          if (svg) {
            svg.style.color = 'rgb(239 68 68)'; // red-500
            svg.style.transform = 'scale(1)';
          }
        }}
        className="hidden md:flex group absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white dark:bg-gray-800 shadow-xl items-center justify-center hover:scale-110 transition-all border-2 border-red-200 dark:border-red-800 hover:bg-red-500 hover:border-red-500 z-50 cursor-pointer"
        aria-label="Pass"
      >
        <svg
          className="w-7 h-7 text-red-500 transition-all pointer-events-none"
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
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgb(34 197 94)'; // green-500
          e.currentTarget.style.borderColor = 'rgb(34 197 94)';
          const svg = e.currentTarget.querySelector('svg');
          if (svg) {
            svg.style.color = 'white';
            svg.style.transform = 'scale(1.1)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '';
          e.currentTarget.style.borderColor = '';
          const svg = e.currentTarget.querySelector('svg');
          if (svg) {
            svg.style.color = 'rgb(34 197 94)'; // green-500
            svg.style.transform = 'scale(1)';
          }
        }}
        className="hidden md:flex group absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white dark:bg-gray-800 shadow-xl items-center justify-center hover:scale-110 transition-all border-2 border-green-200 dark:border-green-800 hover:bg-green-500 hover:border-green-500 z-50 cursor-pointer"
        aria-label="Like"
      >
        <svg
          className="w-7 h-7 text-green-500 transition-all pointer-events-none"
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

      {/* Progress Indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex gap-2">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-sm font-medium text-gray-700 dark:text-gray-200">
          {items[currentIndex]?.type === "ad" ? getListingIndex(currentIndex) : getListingIndex(currentIndex) + 1} / {listings.length}
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



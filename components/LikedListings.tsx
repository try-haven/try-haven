"use client";

import { ApartmentListing, Review } from "@/lib/data";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import DarkModeToggle from "./DarkModeToggle";
import HavenLogo from "./HavenLogo";
import { useUser } from "@/contexts/UserContext";
import { generateAnonymousNickname } from "@/lib/nicknames";
import dynamic from "next/dynamic";

// Dynamically import the map component to avoid SSR issues
const MapView = dynamic(() => import("./MapView"), { ssr: false });

interface LikedListingsProps {
  likedListings: ApartmentListing[];
  onBack: () => void;
  onRemoveLike: (listingId: string) => void;
  onBackToHome?: () => void;
}

export default function LikedListings({ likedListings, onBack, onRemoveLike, onBackToHome }: LikedListingsProps) {
  const { logOut, hasReviewedListing, markListingAsReviewed, user } = useUser();
  const [selectedListing, setSelectedListing] = useState<ApartmentListing | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userRating, setUserRating] = useState<number>(0);
  const [userReview, setUserReview] = useState<string>("");
  const [originalReview, setOriginalReview] = useState<string>("");
  const [originalRating, setOriginalRating] = useState<number>(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [userRatingData, setUserRatingData] = useState<{ rating: number; userId: string } | null>(null);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const cardContentRef = useRef<HTMLDivElement>(null);

  // Geocode address when listing is selected
  useEffect(() => {
    if (selectedListing && !coordinates && !isGeocoding) {
      setIsGeocoding(true);
      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(selectedListing.address)}&limit=1`,
        {
          headers: {
            "User-Agent": "Haven App"
          }
        }
      )
        .then((res) => res.json())
        .then((data) => {
          if (data && data.length > 0) {
            setCoordinates({
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
            });
          }
        })
        .catch((error) => {
          console.error("Error geocoding address:", error);
        })
        .finally(() => {
          setIsGeocoding(false);
        });
    }
  }, [selectedListing, coordinates, isGeocoding]);

  // Reset coordinates and load reviews when listing changes
  useEffect(() => {
    if (selectedListing && user) {
      setCoordinates(null);
      setImageIndex(0);
      setImageError(false);
      // Load reviews from localStorage
      const storedReviews = localStorage.getItem(`haven_listing_reviews_${selectedListing.id}`);
      setReviews(storedReviews ? JSON.parse(storedReviews) : []);
      // Load user's rating data
      const storedRating = localStorage.getItem(`haven_rating_${selectedListing.id}_${user.username}`);
      setUserRatingData(storedRating ? JSON.parse(storedRating) : null);
    }
  }, [selectedListing?.id, user]);

  // Check if user has a review (not just a rating)
  const hasUserReview = selectedListing && user ? reviews.some(r => r.userName === user.username) : false;

  // Handle navbar visibility on scroll
  useEffect(() => {
    if (!selectedListing || !cardContentRef.current) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = cardContentRef.current?.scrollTop || 0;
          
          if (currentScrollY > lastScrollY && currentScrollY > 20) {
            // Scrolling down - hide navbar
            setIsNavbarVisible(false);
          } else if (currentScrollY < lastScrollY || currentScrollY <= 20) {
            // Scrolling up or near top - show navbar
            setIsNavbarVisible(true);
          }
          
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    const cardElement = cardContentRef.current;
    cardElement?.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      cardElement?.removeEventListener('scroll', handleScroll);
    };
  }, [selectedListing, lastScrollY]);

  // Reset scroll position and navbar visibility when listing changes
  useEffect(() => {
    if (selectedListing && cardContentRef.current) {
      cardContentRef.current.scrollTop = 0;
      setLastScrollY(0);
      setIsNavbarVisible(true);
    }
  }, [selectedListing]);

  // Handle keyboard navigation when viewing a listing
  useEffect(() => {
    if (!selectedListing || likedListings.length <= 1) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle if user is typing in an input/textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const currentIndex = likedListings.findIndex(listing => listing.id === selectedListing.id);
      const hasPrevious = currentIndex > 0;
      const hasNext = currentIndex < likedListings.length - 1;

      if (event.key === "ArrowLeft" && hasPrevious) {
        event.preventDefault();
        const prevListing = likedListings[currentIndex - 1];
        setSelectedListing(prevListing);
        setImageIndex(0);
        setImageError(false);
        setCoordinates(null);
        setShowReviewForm(false);
        setUserReview("");
        setOriginalReview("");
        setUserRating(0);
        setOriginalRating(0);
        setIsAnonymous(false);
      } else if (event.key === "ArrowRight" && hasNext) {
        event.preventDefault();
        const nextListing = likedListings[currentIndex + 1];
        setSelectedListing(nextListing);
        setImageIndex(0);
        setImageError(false);
        setCoordinates(null);
        setShowReviewForm(false);
        setUserReview("");
        setOriginalReview("");
        setUserRating(0);
        setOriginalRating(0);
        setIsAnonymous(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedListing, likedListings]);

  if (likedListings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <HavenLogo size="sm" showAnimation={false} />
              <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">Haven</h1>
            </div>
            <div className="flex gap-4 items-center">
              <DarkModeToggle />
              {onBackToHome && (
                <button
                  onClick={onBackToHome}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Back to Home
                </button>
              )}
              <button
                onClick={onBack}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Back to Swiping
              </button>
              <button
                onClick={() => {
                  logOut();
                  if (onBackToHome) {
                    onBackToHome();
                  } else {
                    onBack();
                  }
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center min-h-[600px] text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              No liked listings yet
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Start swiping to like apartments you&apos;re interested in!
            </p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-colors"
            >
              Start Swiping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedListing) {
    // Find current index in liked listings
    const currentIndex = likedListings.findIndex(listing => listing.id === selectedListing.id);
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < likedListings.length - 1;

    const handlePrevious = () => {
      if (hasPrevious) {
        const prevListing = likedListings[currentIndex - 1];
        setSelectedListing(prevListing);
        setImageIndex(0);
        setImageError(false);
        setCoordinates(null);
        setShowReviewForm(false);
        setUserReview("");
        setOriginalReview("");
        setUserRating(0);
        setOriginalRating(0);
        setIsAnonymous(false);
      }
    };

    const handleNext = () => {
      if (hasNext) {
        const nextListing = likedListings[currentIndex + 1];
        setSelectedListing(nextListing);
        setImageIndex(0);
        setImageError(false);
        setCoordinates(null);
        setShowReviewForm(false);
        setUserReview("");
        setOriginalReview("");
        setUserRating(0);
        setOriginalRating(0);
        setIsAnonymous(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
        <div className="container mx-auto px-6 max-w-4xl">
          <div 
            className={`fixed top-0 left-0 right-0 z-40 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-transform duration-300 ${
              isNavbarVisible ? 'translate-y-0' : '-translate-y-full'
            }`}
          >
            <div className="container mx-auto px-6 max-w-4xl py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedListing(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to List
                </button>
                <div className="flex items-center gap-3">
                  <HavenLogo size="sm" showAnimation={false} />
                  <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">Haven</h1>
                </div>
                <div className="flex gap-4 items-center">
                  <DarkModeToggle />
                  {onBackToHome && (
                    <button
                      onClick={onBackToHome}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      Back to Home
                    </button>
                  )}
                  <button
                    onClick={() => {
                      logOut();
                      if (onBackToHome) {
                        onBackToHome();
                      } else {
                        setSelectedListing(null);
                      }
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="mb-8 h-16"></div>

          <div className="relative">
            {/* Left Navigation Arrow */}
            {likedListings.length > 1 && hasPrevious && (
              <button
                onClick={handlePrevious}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 z-50 w-14 h-14 bg-white dark:bg-gray-800 rounded-full shadow-xl flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all hover:scale-110 border-2 border-indigo-200 dark:border-indigo-700"
                aria-label="Previous listing"
              >
                <svg className="w-7 h-7 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Right Navigation Arrow */}
            {likedListings.length > 1 && hasNext && (
              <button
                onClick={handleNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 z-50 w-14 h-14 bg-white dark:bg-gray-800 rounded-full shadow-xl flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all hover:scale-110 border-2 border-indigo-200 dark:border-indigo-700"
                aria-label="Next listing"
              >
                <svg className="w-7 h-7 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Position Indicator */}
            {likedListings.length > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-sm font-medium text-gray-700 dark:text-gray-200">
                {currentIndex + 1} / {likedListings.length}
              </div>
            )}

            <div 
              ref={cardContentRef}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-y-auto overscroll-contain scrollbar-hide h-[calc(100vh-8rem)]"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
            {/* Image Carousel */}
            <div className="relative h-96 bg-gray-200 dark:bg-gray-700 flex-shrink-0">
              {!imageError && selectedListing.images[imageIndex] ? (
                <Image
                  src={selectedListing.images[imageIndex]}
                  alt={selectedListing.title}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900">
                  <div className="text-center p-8">
                    <svg
                      className="w-16 h-16 mx-auto mb-4 text-indigo-400 dark:text-indigo-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">
                      {selectedListing.title}
                    </p>
                  </div>
                </div>
              )}
              
              {selectedListing.images.length > 1 && (
                <>
                  <div className="absolute top-4 left-4 right-4 flex gap-2">
                    {selectedListing.images.map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 h-1 rounded-full ${
                          i === imageIndex ? "bg-white" : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                  
                  <button
                    onClick={() => {
                      setImageIndex((prev) => (prev - 1 + selectedListing.images.length) % selectedListing.images.length);
                      setImageError(false);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setImageIndex((prev) => (prev + 1) % selectedListing.images.length);
                      setImageError(false);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Details */}
            <div className="p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{selectedListing.title}</h2>
                  <p className="text-gray-600 dark:text-gray-300">{selectedListing.address}</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                    ${selectedListing.price.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">/month</div>
                </div>
              </div>

              <div className="flex gap-4 text-lg text-gray-600 dark:text-gray-300 mb-6">
                <span>{selectedListing.bedrooms} bed{selectedListing.bedrooms !== 1 ? "s" : ""}</span>
                <span>•</span>
                <span>{selectedListing.bathrooms} bath{selectedListing.bathrooms !== 1 ? "s" : ""}</span>
                <span>•</span>
                <span>{selectedListing.sqft.toLocaleString()} sqft</span>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg leading-relaxed">{selectedListing.description}</p>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedListing.amenities.map((amenity, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-gray-700 mb-6">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  <span className="font-semibold">Available from:</span>{" "}
                  {new Date(selectedListing.availableFrom).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <button
                  onClick={() => {
                    onRemoveLike(selectedListing.id);
                    setSelectedListing(null);
                  }}
                  className="w-full px-6 py-3 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Remove from Liked
                </button>
              </div>

              {/* Rating & Reviews Section */}
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Rating & Reviews {reviews.length > 0 && `(${reviews.length})`}
                  </h3>
                  {user && (
                    <button
                      onClick={() => {
                        setShowReviewForm(!showReviewForm);
                        // Load user's existing rating/review if they've submitted one
                        if (!showReviewForm) {
                          if (userRatingData) {
                            setUserRating(userRatingData.rating);
                            setOriginalRating(userRatingData.rating);
                          } else {
                            setOriginalRating(0);
                          }
                          // Load existing review if user has one
                          const existingReview = reviews.find(r => r.userName === user.username);
                          if (existingReview) {
                            setUserReview(existingReview.comment);
                            setOriginalReview(existingReview.comment);
                            setUserRating(existingReview.rating);
                            setOriginalRating(existingReview.rating);
                          } else {
                            setUserReview("");
                            setOriginalReview("");
                            if (!userRatingData) {
                              setUserRating(0);
                              setOriginalRating(0);
                            }
                          }
                        } else {
                          // Reset when closing
                          setUserReview("");
                          setOriginalReview("");
                          setUserRating(0);
                          setOriginalRating(0);
                        }
                      }}
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                    >
                      {showReviewForm ? "Cancel" : hasUserReview ? "Edit Rating/Review" : "Add Rating/Review"}
                    </button>
                  )}
                </div>

                {/* Average Rating Display */}
                <div className="flex items-center gap-4 mb-4">
                  {reviews.length > 0 ? (
                    <>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                          return (
                            <svg
                              key={star}
                              className={`w-6 h-6 ${
                                star <= Math.round(avgRating)
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300 dark:text-gray-600"
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          );
                        })}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-semibold">{(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}</span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {" "}({reviews.length} {reviews.length === 1 ? "rating" : "ratings"})
                        </span>
                      </div>
                    </>
                  ) : selectedListing.averageRating ? (
                    <>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-6 h-6 ${
                              star <= Math.round(selectedListing.averageRating || 0)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300 dark:text-gray-600"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-semibold">{selectedListing.averageRating.toFixed(1)}</span>
                        {selectedListing.totalRatings && (
                          <span className="text-gray-500 dark:text-gray-400">
                            {" "}({selectedListing.totalRatings} {selectedListing.totalRatings === 1 ? "rating" : "ratings"})
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No ratings yet.</p>
                  )}
                </div>

                {/* Rating & Review Form */}
                {showReviewForm && user && selectedListing && (
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="mb-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Your Rating {userRating > 0 && `(${userRating} stars)`}
                      </label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setUserRating(star)}
                            className="focus:outline-none"
                            aria-label={`Rate ${star} stars`}
                          >
                            <svg
                              className={`w-5 h-5 ${star <= userRating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300 dark:text-gray-600"
                                }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Post as anonymous
                      </label>
                    </div>
                    <textarea
                      value={userReview}
                      onChange={(e) => setUserReview(e.target.value)}
                      placeholder="Write your review (optional)..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      {hasReviewedListing(selectedListing.id) && (
                        <button
                          onClick={() => {
                            if (selectedListing) {
                              // Delete review and rating
                              const listingReviews = localStorage.getItem(`haven_listing_reviews_${selectedListing.id}`);
                              const allReviews: Review[] = listingReviews ? JSON.parse(listingReviews) : [];
                              const filteredReviews = allReviews.filter(r => r.userName !== user.username);
                              setReviews(filteredReviews);
                              localStorage.setItem(`haven_listing_reviews_${selectedListing.id}`, JSON.stringify(filteredReviews));
                              
                              // Remove rating
                              localStorage.removeItem(`haven_rating_${selectedListing.id}_${user.username}`);
                              setUserRatingData(null);
                              
                              // Remove from reviewed listings
                              const reviewedListings = localStorage.getItem(`haven_reviews_${user.username}`);
                              if (reviewedListings) {
                                const reviews: string[] = JSON.parse(reviewedListings);
                                const filtered = reviews.filter(id => id !== selectedListing.id);
                                localStorage.setItem(`haven_reviews_${user.username}`, JSON.stringify(filtered));
                              }
                              
                              // Reset form
                              setUserReview("");
                              setOriginalReview("");
                              setUserRating(0);
                              setOriginalRating(0);
                              setIsAnonymous(false);
                              setShowReviewForm(false);
                            }
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                      <button
                        onClick={() => {
                          // Discard changes - reset to original values
                          setUserRating(originalRating);
                          setUserReview(originalReview);
                          setShowReviewForm(false);
                        }}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        Discard
                      </button>
                      <button
                        onClick={() => {
                          if (userRating > 0 && selectedListing) {
                            // Determine what needs to be updated
                            const ratingChanged = userRating !== originalRating;
                            const reviewChanged = userReview.trim() !== originalReview;
                            const hasReviewed = hasReviewedListing(selectedListing.id);
                            
                            // Update review if it changed or exists
                            if (reviewChanged || (userReview.trim() && !hasReviewed)) {
                              const listingReviews = localStorage.getItem(`haven_listing_reviews_${selectedListing.id}`);
                              const allReviews: Review[] = listingReviews ? JSON.parse(listingReviews) : [];
                              const filteredReviews = allReviews.filter(r => r.userName !== user.username);

                              const newReview: Review = {
                                id: Date.now().toString(),
                                userName: isAnonymous ? generateAnonymousNickname() : user.username,
                                rating: userRating,
                                comment: userReview.trim() || "No comment",
                                date: new Date().toISOString(),
                              };
                              const updatedReviews = [...filteredReviews, newReview];
                              setReviews(updatedReviews);
                              localStorage.setItem(`haven_listing_reviews_${selectedListing.id}`, JSON.stringify(updatedReviews));
                            }

                            // Update rating if it changed or is new
                            if (ratingChanged || !hasReviewed) {
                              const ratingData = {
                                listingId: selectedListing.id,
                                rating: userRating,
                                userId: user.username,
                                date: new Date().toISOString(),
                              };
                              localStorage.setItem(`haven_rating_${selectedListing.id}_${user.username}`, JSON.stringify(ratingData));
                              setUserRatingData({ rating: userRating, userId: user.username });
                              markListingAsReviewed(selectedListing.id);
                            }

                            // Update original values
                            setOriginalRating(userRating);
                            setOriginalReview(userReview.trim());
                            
                            // Reset form
                            setUserReview("");
                            setUserRating(0);
                            setIsAnonymous(false);
                            setShowReviewForm(false);
                            
                            // Reload reviews to update average
                            const storedReviews = localStorage.getItem(`haven_listing_reviews_${selectedListing.id}`);
                            setReviews(storedReviews ? JSON.parse(storedReviews) : []);
                          }
                        }}
                        disabled={userRating === 0}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {hasReviewedListing(selectedListing.id) ? "Update" : "Submit"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Reviews Section */}
                <div className="mt-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                    Reviews {reviews.length > 0 && `(${reviews.length})`}
                  </h4>
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">{review.userName}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= review.rating
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-gray-300 dark:text-gray-600"
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(review.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mt-2">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No reviews yet.</p>
                )}
              </div>
              </div>

              {/* Map Section */}
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Location</h3>
                {isGeocoding ? (
                  <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Loading map...</p>
                    </div>
                  </div>
                ) : coordinates ? (
                  <div className="h-64 rounded-xl overflow-hidden shadow-lg border-2 border-gray-200 dark:border-gray-700">
                    <MapView
                      lat={coordinates.lat}
                      lng={coordinates.lng}
                      address={selectedListing.address}
                    />
                  </div>
                ) : (
                  <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <svg
                        className="w-12 h-12 mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <p className="text-sm">Unable to load map</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <HavenLogo size="sm" showAnimation={false} />
            <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">Haven</h1>
          </div>
          <div className="flex gap-4 items-center">
            <DarkModeToggle />
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Back to Home
              </button>
            )}
            <button
              onClick={onBack}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Back to Swiping
            </button>
            <button
              onClick={() => {
                logOut();
                if (onBackToHome) {
                  onBackToHome();
                } else {
                  onBack();
                }
              }}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Your Liked Listings ({likedListings.length})
          </h2>
          <p className="text-gray-600 dark:text-gray-300">Apartments you&apos;ve swiped right on</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {likedListings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow relative group"
            >
              <div
                onClick={() => {
                  setSelectedListing(listing);
                  setImageIndex(0);
                  setImageError(false);
                }}
                className="cursor-pointer"
              >
                <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                  {listing.images[0] ? (
                    <Image
                      src={listing.images[0]}
                      alt={listing.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900">
                      <svg
                        className="w-8 h-8 text-indigo-400 dark:text-indigo-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{listing.title}</h3>
                    <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                      ${listing.price.toLocaleString()}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-1">{listing.address}</p>
                  <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span>{listing.bedrooms} bed</span>
                    <span>•</span>
                    <span>{listing.bathrooms} bath</span>
                    <span>•</span>
                    <span>{listing.sqft.toLocaleString()} sqft</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {listing.amenities.slice(0, 2).map((amenity, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs"
                      >
                        {amenity}
                      </span>
                    ))}
                    {listing.amenities.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs">
                        +{listing.amenities.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {/* Remove button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveLike(listing.id);
                }}
                className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 rounded-full p-2 shadow-lg transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Remove from liked"
                title="Remove from liked"
              >
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


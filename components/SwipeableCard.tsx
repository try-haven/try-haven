"use client";

import { motion, useMotionValue, useTransform, PanInfo, animate } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { ApartmentListing, Review } from "@/lib/data";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useUser } from "@/contexts/UserContext";
import { generateAnonymousNickname } from "@/lib/nicknames";
import { textStyles, badgeStyles, inputStyles } from "@/lib/styles";

// Dynamically import the map component to avoid SSR issues
const MapView = dynamic(() => import("./MapView"), { ssr: false });

interface SwipeableCardProps {
  listing: ApartmentListing;
  onSwipe: (direction: "left" | "right") => void;
  index: number;
  total: number;
  triggerSwipe?: "left" | "right" | null;
  isTriggeredCard?: boolean;
}

export default function SwipeableCard({
  listing,
  onSwipe,
  index,
  total,
  triggerSwipe,
  isTriggeredCard = false,
}: SwipeableCardProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const [exitX, setExitX] = useState(0);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [pendingSwipe, setPendingSwipe] = useState<"left" | "right" | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const { hasReviewedListing, markListingAsReviewed, user } = useUser();
  const [userRating, setUserRating] = useState<number>(0);
  const [userReview, setUserReview] = useState<string>("");
  const [originalReview, setOriginalReview] = useState<string>("");
  const [originalRating, setOriginalRating] = useState<number>(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(listing.reviews || []);
  const [userRatingData, setUserRatingData] = useState<{ rating: number; userId: string } | null>(null);
  const cardContentRef = useRef<HTMLDivElement>(null);
  const hasReviewed = hasReviewedListing(listing.id);
  const hasUserReview = user ? reviews.some(r => r.userName === user.username) : false;

  // Load reviews and user rating from localStorage after mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load reviews from localStorage
    try {
      const storedReviews = localStorage.getItem(`haven_listing_reviews_${listing.id}`);
      if (storedReviews) {
        const parsedReviews = JSON.parse(storedReviews);
        setReviews(parsedReviews);
      }
    } catch (error) {
      console.error("Error loading reviews from localStorage:", error);
    }

    // Load user's rating if exists
    try {
      const storedUser = localStorage.getItem("haven_user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        const stored = localStorage.getItem(`haven_rating_${listing.id}_${userData.username}`);
        if (stored) {
          setUserRatingData(JSON.parse(stored));
        }
      }
    } catch (error) {
      // Ignore errors
    }
  }, [listing.id]);

  // Calculate average rating from reviews
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : listing.averageRating || 0;

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -50, 0, 50, 200], [0, 0.6, 1, 0.6, 0]);

  // Swipe direction indicators
  const likeOpacity = useTransform(x, [0, 200], [0, 1]);
  const nopeOpacity = useTransform(x, [-200, 0], [1, 0]);

  // Trigger swipe animation when triggerSwipe prop changes
  useEffect(() => {
    if (triggerSwipe && isTriggeredCard && !hasTriggered && exitX === 0) {
      setHasTriggered(true);
      setPendingSwipe(triggerSwipe);
      // Call onSwipe with delay to allow fade animation to complete
      setTimeout(() => {
        onSwipe(triggerSwipe);
      }, 300);
    }
  }, [triggerSwipe, isTriggeredCard, onSwipe, x, exitX, hasTriggered]);

  // Reset hasTriggered when card changes
  useEffect(() => {
    if (index !== 0) {
      setHasTriggered(false);
      setExitX(0);
      x.set(0);
      setImageIndex(0);
      setImageError(false);
      setPendingSwipe(null);
    }
  }, [index, x]);

  // Reset image error when image index changes
  useEffect(() => {
    setImageError(false);
  }, [imageIndex]);

  // Geocode address when card becomes visible (index === 0)
  useEffect(() => {
    if (index === 0 && !coordinates && !isGeocoding) {
      setIsGeocoding(true);
      // Geocode the address using Nominatim
      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(listing.address)}&limit=1`,
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
  }, [index, listing.address, coordinates, isGeocoding]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      setExitX(info.offset.x > 0 ? 200 : -200);
      onSwipe(info.offset.x > 0 ? "right" : "left");
    }
  };

  const nextImage = () => {
    setImageIndex((prev) => (prev + 1) % listing.images.length);
  };

  const prevImage = () => {
    setImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length);
  };

  if (index >= total) return null;

  // Scale and offset for cards behind the top card
  const scale = index === 0 ? 1 : 0.95;
  const yOffset = index === 0 ? 0 : 8;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{
        x,
        rotate,
        opacity,
        zIndex: total - index,
        pointerEvents: index === 0 ? "auto" : "none",
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      dragDirectionLock
      onDragEnd={handleDragEnd}
      animate={{
        x: pendingSwipe ? 0 : exitX,
        opacity: (exitX !== 0 || pendingSwipe) ? 0 : 1,
        scale: scale,
        y: yOffset,
      }}
      transition={
        pendingSwipe
          ? { type: "tween", duration: 0.3, ease: "easeOut" }
          : { type: "spring", stiffness: 300, damping: 30 }
      }
      onAnimationComplete={() => {
        // Clear pending swipe after animation completes
        if (pendingSwipe) {
          setPendingSwipe(null);
        }
      }}
      initial={false}
    >
      <div className="w-full max-w-[85vw] mx-auto h-full">
        <div
          ref={cardContentRef}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl h-full max-h-[90vh] flex flex-col md:flex-row overflow-hidden"
        >
          {/* Image Carousel - Left 2/3 */}
          <div className="relative h-40 md:h-full md:w-2/3 bg-gray-200 dark:bg-gray-700 flex-shrink-0">
            {!imageError && listing.images[imageIndex] ? (
              <Image
                src={listing.images[imageIndex]}
                alt={listing.title}
                fill
                className="object-cover"
                priority={index === 0}
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
                    {listing.title}
                  </p>
                </div>
              </div>
            )}

            {/* Image Indicators */}
            {listing.images.length > 1 && (
              <>
                <div className="absolute top-4 left-4 right-4 flex gap-2">
                  {listing.images.map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-1 rounded-full ${i === imageIndex ? "bg-white" : "bg-white/50"
                        }`}
                    />
                  ))}
                </div>

                {/* Navigation Arrows */}
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
                  aria-label="Previous image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
                  aria-label="Next image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Swipe Direction Overlays */}
            {index === 0 && (
              <>
                <motion.div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ opacity: likeOpacity }}
                >
                  <div className="px-8 py-4 bg-green-500/90 text-white rounded-full text-4xl font-bold border-4 border-white shadow-2xl">
                    LIKE
                  </div>
                </motion.div>
                <motion.div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ opacity: nopeOpacity }}
                >
                  <div className="px-8 py-4 bg-red-500/90 text-white rounded-full text-4xl font-bold border-4 border-white shadow-2xl">
                    NOPE
                  </div>
                </motion.div>
              </>
            )}
          </div>

          {/* Right Side - 1/3 width, split vertically */}
          <div className="md:w-1/3 flex flex-col overflow-y-auto">
            {/* Top Half - Details */}
            <div className="flex-1 p-4 overflow-y-auto border-b border-gray-200 dark:border-gray-700">
            <div className="mb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{listing.title}</h2>
              <p className="text-gray-600 dark:text-gray-300 text-xs">{listing.address}</p>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
                ${listing.price.toLocaleString()}<span className="text-sm text-gray-500 dark:text-gray-400">/mo</span>
              </div>
            </div>

            <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-300 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
              <span>{listing.bedrooms} bed</span>
              <span>•</span>
              <span>{listing.bathrooms} bath</span>
              <span>•</span>
              <span>{listing.sqft.toLocaleString()} sqft</span>
            </div>

            <p className="text-xs text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">{listing.description}</p>

            {/* Amenities */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {listing.amenities.slice(0, 3).map((amenity, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs"
                >
                  {amenity}
                </span>
              ))}
              {listing.amenities.length > 3 && (
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs">
                  +{listing.amenities.length - 3}
                </span>
              )}
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Available {new Date(listing.availableFrom).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>

            {/* Rating & Reviews Section */}
            <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Reviews {reviews.length > 0 && `(${reviews.length})`}
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
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-6 h-6 ${star <= Math.round(averageRating)
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
                  <span className="font-semibold">{averageRating.toFixed(1)}</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {" "}({reviews.length} {reviews.length === 1 ? "rating" : "ratings"})
                  </span>
                </div>
              </div>

              {/* Rating & Review Form */}
              {showReviewForm && user && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="mb-3">
                    <label className={inputStyles.labelBlock}>
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
                    <label className={inputStyles.labelFlex}>
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
                    {hasReviewed && (
                      <button
                        onClick={() => {
                          // Delete review and rating
                          const listingReviews = localStorage.getItem(`haven_listing_reviews_${listing.id}`);
                          const allReviews: Review[] = listingReviews ? JSON.parse(listingReviews) : [];
                          const filteredReviews = allReviews.filter(r => r.userName !== user.username);
                          setReviews(filteredReviews);
                          localStorage.setItem(`haven_listing_reviews_${listing.id}`, JSON.stringify(filteredReviews));

                          // Remove rating
                          localStorage.removeItem(`haven_rating_${listing.id}_${user.username}`);
                          setUserRatingData(null);

                          // Remove from reviewed listings
                          const reviewedListings = localStorage.getItem(`haven_reviews_${user.username}`);
                          if (reviewedListings) {
                            const reviews: string[] = JSON.parse(reviewedListings);
                            const filtered = reviews.filter(id => id !== listing.id);
                            localStorage.setItem(`haven_reviews_${user.username}`, JSON.stringify(filtered));
                          }

                          // Reset form
                          setUserReview("");
                          setOriginalReview("");
                          setUserRating(0);
                          setOriginalRating(0);
                          setIsAnonymous(false);
                          setShowReviewForm(false);
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
                        if (userRating > 0) {
                          // Determine what needs to be updated
                          const ratingChanged = userRating !== originalRating;
                          const reviewChanged = userReview.trim() !== originalReview;

                          // Update review if it changed or exists
                          if (reviewChanged || (userReview.trim() && !hasReviewed)) {
                            const listingReviews = localStorage.getItem(`haven_listing_reviews_${listing.id}`);
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
                            localStorage.setItem(`haven_listing_reviews_${listing.id}`, JSON.stringify(updatedReviews));
                          }

                          // Update rating if it changed or is new
                          if (ratingChanged || !hasReviewed) {
                            const ratingData = {
                              listingId: listing.id,
                              rating: userRating,
                              userId: user.username,
                              date: new Date().toISOString(),
                            };
                            localStorage.setItem(`haven_rating_${listing.id}_${user.username}`, JSON.stringify(ratingData));
                            setUserRatingData({ rating: userRating, userId: user.username });
                            markListingAsReviewed(listing.id);
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
                          const storedReviews = localStorage.getItem(`haven_listing_reviews_${listing.id}`);
                          setReviews(storedReviews ? JSON.parse(storedReviews) : []);
                        }
                      }}
                      disabled={userRating === 0}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {hasReviewed ? "Update" : "Submit"}
                    </button>
                  </div>
                </div>
              )}

              {/* Reviews List */}
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => {
                    // Check if this review is from the current user
                    const isUserReview = user && review.userName === user.username;
                    return (
                      <div key={review.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {review.userName}
                              {isUserReview && <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(You)</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg
                                    key={star}
                                    className={`w-4 h-4 ${star <= review.rating
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
                        <p className={`${textStyles.body} mt-2`}>{review.comment}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No reviews yet. Be the first to review!</p>
              )}
            </div>
            </div>

            {/* Bottom Half - Map */}
            <div className="flex-1 p-4 flex flex-col">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Location</h3>
              {isGeocoding ? (
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Loading...</p>
                  </div>
                </div>
              ) : coordinates ? (
                <div className="flex-1 rounded-xl overflow-hidden shadow-lg border-2 border-gray-200 dark:border-gray-700">
                  <MapView
                    lat={coordinates.lat}
                    lng={coordinates.lng}
                    address={listing.address}
                  />
                </div>
              ) : (
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
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
                    <p className="text-xs">Unable to load map</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}


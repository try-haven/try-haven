"use client";

import { motion, useMotionValue, useTransform, PanInfo, animate } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { ApartmentListing, Review } from "@/lib/data";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useUser } from "@/contexts/UserContext";
import { textStyles, badgeStyles } from "@/lib/styles";

// Dynamically import the map component to avoid SSR issues
const MapView = dynamic(() => import("./MapView"), { ssr: false });

interface SwipeableCardProps {
  listing: ApartmentListing;
  onSwipe: (direction: "left" | "right") => void;
  index: number;
  total: number;
  triggerSwipe?: "left" | "right" | null;
  isTriggeredCard?: boolean;
  isTopPick?: boolean;
  matchScore?: number;
  scoreBreakdown?: {
    distance?: { score: number; percentage: number; label: string };
    amenities?: { score: number; percentage: number; label: string };
    quality?: { score: number; percentage: number; label: string };
    rating?: { score: number; percentage: number; label: string };
  };
}

export default function SwipeableCard({
  listing,
  onSwipe,
  index,
  total,
  triggerSwipe,
  isTriggeredCard = false,
  isTopPick = false,
  matchScore,
  scoreBreakdown,
}: SwipeableCardProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const [exitX, setExitX] = useState(0);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [pendingSwipe, setPendingSwipe] = useState<"left" | "right" | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const { user } = useUser();
  const [reviews, setReviews] = useState<Review[]>(listing.reviews || []);
  const cardContentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [recentPriceChange, setRecentPriceChange] = useState<{
    type: "increase" | "decrease";
    daysAgo: number;
    oldValue: number;
    newValue: number;
  } | null>(null);
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  // Load reviews from localStorage after mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedReviews = localStorage.getItem(`haven_listing_reviews_${listing.id}`);
      if (storedReviews) {
        const parsedReviews = JSON.parse(storedReviews);
        setReviews(parsedReviews);
      }
    } catch (error) {
      console.error("Error loading reviews from localStorage:", error);
    }
  }, [listing.id]);

  // Load recent price changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const changesData = localStorage.getItem("haven_listing_changes");
      if (changesData) {
        const allChanges = JSON.parse(changesData);
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

        // Find the most recent price change for this listing
        const priceChanges = allChanges
          .filter((change: any) =>
            change.listingId === listing.id &&
            change.field === "price" &&
            change.timestamp > sevenDaysAgo
          )
          .sort((a: any, b: any) => b.timestamp - a.timestamp);

        if (priceChanges.length > 0) {
          const latestChange = priceChanges[0];
          const daysAgo = Math.floor((Date.now() - latestChange.timestamp) / (24 * 60 * 60 * 1000));
          setRecentPriceChange({
            type: latestChange.newValue < latestChange.oldValue ? "decrease" : "increase",
            daysAgo: daysAgo,
            oldValue: latestChange.oldValue,
            newValue: latestChange.newValue
          });
        }
      }
    } catch (error) {
      console.error("Error loading price changes:", error);
    }
  }, [listing.id]);

  // Calculate average rating from reviews
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : listing.averageRating || 0;

  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, -50, 0, 50, 200], [0, 0.6, 1, 0.6, 0]);

  // Enhanced swipe direction indicators with earlier appearance
  const likeOpacity = useTransform(x, [0, 50, 150], [0, 0.7, 1]);
  const nopeOpacity = useTransform(x, [-150, -50, 0], [1, 0.7, 0]);

  // Scale effect during drag for better visual feedback
  const scale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95]);

  // Trigger swipe animation when triggerSwipe prop changes
  useEffect(() => {
    if (triggerSwipe && isTriggeredCard && !hasTriggered && exitX === 0) {
      const direction = triggerSwipe === "right" ? 300 : -300;
      setHasTriggered(true);
      setExitX(direction);
      setPendingSwipe(triggerSwipe);
      // Call onSwipe with delay to allow slide animation to complete
      setTimeout(() => {
        onSwipe(triggerSwipe);
      }, 400);
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
    // Increased threshold for clearer swipe decision
    const swipeThreshold = 120;
    if (Math.abs(info.offset.x) > swipeThreshold) {
      setExitX(info.offset.x > 0 ? 300 : -300);
      onSwipe(info.offset.x > 0 ? "right" : "left");
    }
  };

  const nextImage = () => {
    setImageIndex((prev) => (prev + 1) % listing.images.length);
  };

  const prevImage = () => {
    setImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/haven/listing?id=${listing.id}`;

    if (user) {
      // Track share in metrics
      const metricsData = localStorage.getItem("haven_listing_metrics");
      const metrics = metricsData ? JSON.parse(metricsData) : {};

      if (!metrics[listing.id]) {
        metrics[listing.id] = { listingId: listing.id, views: 0, swipeRights: 0, swipeLefts: 0, shares: 0 };
      }

      metrics[listing.id].shares = (metrics[listing.id].shares || 0) + 1;
      localStorage.setItem("haven_listing_metrics", JSON.stringify(metrics));

      // Store timestamped event for trends
      const eventsData = localStorage.getItem("haven_listing_metric_events");
      const events = eventsData ? JSON.parse(eventsData) : [];
      events.push({
        listingId: listing.id,
        timestamp: Date.now(),
        type: 'share',
        userId: user.username
      });
      localStorage.setItem("haven_listing_metric_events", JSON.stringify(events));
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: listing.title,
          text: `Check out this listing: ${listing.title}`,
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  if (index >= total) return null;

  // Scale and offset for cards behind the top card
  const cardScale = index === 0 ? 1 : 0.95;
  const yOffset = index === 0 ? 0 : 8;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{
        x,
        scale: index === 0 ? scale : cardScale,
        opacity,
        zIndex: total - index,
        pointerEvents: index === 0 ? "auto" : "none",
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.3}
      dragDirectionLock
      onDragEnd={handleDragEnd}
      animate={{
        x: exitX,
        opacity: exitX !== 0 ? 0 : 1,
        scale: cardScale,
        y: yOffset,
      }}
      transition={{
        type: "spring",
        stiffness: pendingSwipe ? 180 : 350,
        damping: pendingSwipe ? 20 : 30,
      }}
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
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl h-full max-h-[72vh] md:max-h-[90vh] lg:max-h-[93vh] flex flex-col md:flex-row overflow-hidden"
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

            {/* Match Score Badge */}
            {matchScore !== undefined && (
              <div className="absolute top-4 left-4 z-20 group">
                {/* Pulsing hint ring - bright and visible on all backgrounds */}
                <div className="absolute -inset-1 rounded-full bg-indigo-500/60 dark:bg-indigo-400/70 animate-ping pointer-events-none" style={{ animationDuration: '2.5s' }}></div>
                <div className="absolute -inset-0.5 rounded-full bg-white/40 dark:bg-white/30 animate-ping pointer-events-none" style={{ animationDuration: '2.5s', animationDelay: '0.3s' }}></div>

                {isTopPick ? (
                  // Top Pick badge (80%+)
                  <div className="relative flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full shadow-lg border-2 border-white cursor-pointer hover:shadow-xl transition-shadow">
                    <svg className="w-4 h-4 text-amber-700 fill-amber-700" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-xs font-bold text-amber-900">Top Pick</span>
                    <span className="text-xs font-semibold text-amber-800">
                      {Math.round(matchScore)}%
                    </span>
                    {/* Info icon hint */}
                    <svg className="w-3.5 h-3.5 text-amber-700 opacity-60" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  // Regular match score (below 80%)
                  <div className="relative flex items-center gap-1.5 px-2.5 py-1 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-md border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {Math.round(matchScore)}% match
                    </span>
                    {/* Info icon hint */}
                    <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 opacity-60" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                {/* Score Breakdown Tooltip */}
                {scoreBreakdown && (
                  <div className="invisible group-hover:visible absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-30">
                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Score Breakdown:</div>
                    <div className="space-y-1.5">
                      {scoreBreakdown.distance && (
                        <div className={`flex items-center justify-between text-xs ${scoreBreakdown.distance.score === Math.max(
                          scoreBreakdown.distance?.score || 0,
                          scoreBreakdown.amenities?.score || 0,
                          scoreBreakdown.quality?.score || 0,
                          scoreBreakdown.rating?.score || 0
                        ) ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}>
                          <span>📍 Distance: {scoreBreakdown.distance.label}</span>
                          <span>{Math.round(scoreBreakdown.distance.score)}pts</span>
                        </div>
                      )}
                      {scoreBreakdown.amenities && (
                        <div className={`flex items-center justify-between text-xs ${scoreBreakdown.amenities.score === Math.max(
                          scoreBreakdown.distance?.score || 0,
                          scoreBreakdown.amenities?.score || 0,
                          scoreBreakdown.quality?.score || 0,
                          scoreBreakdown.rating?.score || 0
                        ) ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}>
                          <span>✨ Amenities: {scoreBreakdown.amenities.label}</span>
                          <span>{Math.round(scoreBreakdown.amenities.score)}pts</span>
                        </div>
                      )}
                      {scoreBreakdown.quality && (
                        <div className={`flex items-center justify-between text-xs ${scoreBreakdown.quality.score === Math.max(
                          scoreBreakdown.distance?.score || 0,
                          scoreBreakdown.amenities?.score || 0,
                          scoreBreakdown.quality?.score || 0,
                          scoreBreakdown.rating?.score || 0
                        ) ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}>
                          <span>📸 Quality: {scoreBreakdown.quality.label}</span>
                          <span>{Math.round(scoreBreakdown.quality.score)}pts</span>
                        </div>
                      )}
                      {scoreBreakdown.rating && (
                        <div className={`flex items-center justify-between text-xs ${scoreBreakdown.rating.score === Math.max(
                          scoreBreakdown.distance?.score || 0,
                          scoreBreakdown.amenities?.score || 0,
                          scoreBreakdown.quality?.score || 0,
                          scoreBreakdown.rating?.score || 0
                        ) ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}>
                          <span>⭐ Rating: {scoreBreakdown.rating.label}</span>
                          <span>{Math.round(scoreBreakdown.rating.score)}pts</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors cursor-pointer z-10"
                  aria-label="Previous image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors cursor-pointer z-10"
                  aria-label="Next image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Swipe Direction Overlays - Enhanced for Mobile */}
            {index === 0 && (
              <>
                <motion.div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ opacity: likeOpacity }}
                >
                  <motion.div
                    className="px-10 py-6 bg-green-500/95 text-white rounded-2xl text-5xl md:text-4xl font-black border-4 border-white shadow-2xl"
                    style={{ scale: likeOpacity }}
                  >
                    ❤️ LIKE
                  </motion.div>
                </motion.div>
                <motion.div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ opacity: nopeOpacity }}
                >
                  <motion.div
                    className="px-10 py-6 bg-red-500/95 text-white rounded-2xl text-5xl md:text-4xl font-black border-4 border-white shadow-2xl"
                    style={{ scale: nopeOpacity }}
                  >
                    👎 NOPE
                  </motion.div>
                </motion.div>
              </>
            )}
          </div>

          {/* Right Side - 1/3 width, split vertically */}
          <div className="md:w-1/3 flex flex-col overflow-y-auto">
            {/* Top Half - Details */}
            <div className="flex-1 p-4 overflow-y-auto border-b border-gray-200 dark:border-gray-700">
            <div className="mb-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex-1">{listing.title}</h2>
                <button
                  onClick={handleShare}
                  className="flex-shrink-0 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  aria-label="Share listing"
                  title="Share listing"
                >
                  {copied ? (
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-xs">{listing.address}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  ${listing.price.toLocaleString()}<span className="text-sm text-gray-500 dark:text-gray-400">/mo</span>
                </div>
                {recentPriceChange && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    recentPriceChange.type === "decrease"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                  }`}>
                    {recentPriceChange.type === "decrease" ? "📉 " : "📈 "}
                    {recentPriceChange.type === "decrease" ? "-" : "+"}
                    ${Math.abs(recentPriceChange.newValue - recentPriceChange.oldValue).toLocaleString()}
                    {" • "}
                    {recentPriceChange.daysAgo === 0 ? "Today" : `${recentPriceChange.daysAgo}d ago`}
                  </span>
                )}
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
              {listing.amenities.slice(0, showAllAmenities ? listing.amenities.length : 3).map((amenity, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs"
                >
                  {amenity}
                </span>
              ))}
              {listing.amenities.length > 3 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAllAmenities(!showAllAmenities);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {showAllAmenities ? 'Show less' : `+${listing.amenities.length - 3}`}
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

              {/* Reviews List */}
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => {
                    // Check if this review is from the current user
                    const isUserReview = user && review.userId === user.username;
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


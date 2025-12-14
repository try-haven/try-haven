"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApartmentListing, Review } from "@/lib/data";
import Image from "next/image";
import dynamic from "next/dynamic";
import { textStyles, buttonStyles, badgeStyles } from "@/lib/styles";
import HavenLogo from "@/components/HavenLogo";
import { getAllListings } from "@/lib/listings";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

function ListingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const listingId = searchParams.get("id");
  const [imageIndex, setImageIndex] = useState(0);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [copied, setCopied] = useState(false);
  const [recentChanges, setRecentChanges] = useState<Array<{
    field: string;
    oldValue: any;
    newValue: any;
    timestamp: number;
  }>>([]);
  const [listing, setListing] = useState<ApartmentListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch listing data directly without using contexts
  useEffect(() => {
    async function loadListing() {
      if (!listingId) {
        setIsLoading(false);
        return;
      }

      try {
        const supabaseListings = await getAllListings();
        const found = supabaseListings.find(l => l.id === listingId);

        if (found) {
          const converted: ApartmentListing = {
            id: found.id,
            title: found.title,
            address: found.address,
            latitude: found.latitude ? Number(found.latitude) : undefined,
            longitude: found.longitude ? Number(found.longitude) : undefined,
            price: Number(found.price),
            bedrooms: found.bedrooms,
            bathrooms: found.bathrooms,
            sqft: found.sqft,
            images: found.images || [],
            amenities: found.amenities || [],
            description: found.description,
            availableFrom: found.available_from,
            averageRating: found.average_rating ? Number(found.average_rating) : undefined,
            totalRatings: found.total_ratings || undefined,
          };
          setListing(converted);
        }
      } catch (error) {
        console.error("Error loading listing:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadListing();
  }, [listingId]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading listing...</div>
      </div>
    );
  }

  useEffect(() => {
    if (!listingId || !listing) return;

    // Load reviews
    const storedReviews = localStorage.getItem(`haven_listing_reviews_${listingId}`);
    if (storedReviews) {
      setReviews(JSON.parse(storedReviews));
    }

    // Load recent changes (last 30 days)
    const changesData = localStorage.getItem("haven_listing_changes");
    if (changesData) {
      try {
        const allChanges = JSON.parse(changesData);
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const listingChanges = allChanges
          .filter((change: any) =>
            change.listingId === listingId &&
            change.timestamp > thirtyDaysAgo
          )
          .sort((a: any, b: any) => b.timestamp - a.timestamp);
        setRecentChanges(listingChanges);
      } catch (error) {
        console.error("Error loading changes:", error);
      }
    }

    // Geocode address
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
      });
  }, [listingId, listing]);

  const handleShare = async () => {
    const url = window.location.href;

    // Track share in metrics (anonymously)
    if (listingId) {
      const metricsData = localStorage.getItem("haven_listing_metrics");
      const metrics = metricsData ? JSON.parse(metricsData) : {};

      if (!metrics[listingId]) {
        metrics[listingId] = { listingId, views: 0, swipeRights: 0, swipeLefts: 0, shares: 0 };
      }

      metrics[listingId].shares = (metrics[listingId].shares || 0) + 1;
      localStorage.setItem("haven_listing_metrics", JSON.stringify(metrics));

      // Store timestamped event for trends
      const eventsData = localStorage.getItem("haven_listing_metric_events");
      const events = eventsData ? JSON.parse(eventsData) : [];
      events.push({
        listingId,
        timestamp: Date.now(),
        type: 'share',
      });
      localStorage.setItem("haven_listing_metric_events", JSON.stringify(events));
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: listing?.title,
          text: `Check out this listing: ${listing?.title}`,
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

  const nextImage = () => {
    if (listing) {
      setImageIndex((prev) => (prev + 1) % listing.images.length);
    }
  };

  const prevImage = () => {
    if (listing) {
      setImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length);
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : listing?.averageRating || 0;

  const formatChangeValue = (field: string, value: any): string => {
    if (field === "price") return `$${value.toLocaleString()}/mo`;
    if (field === "bedrooms" || field === "bathrooms") return value.toString();
    return value.toString();
  };

  const getChangeMessage = (change: typeof recentChanges[0]): string => {
    const oldVal = formatChangeValue(change.field, change.oldValue);
    const newVal = formatChangeValue(change.field, change.newValue);
    const fieldName = change.field.charAt(0).toUpperCase() + change.field.slice(1);
    return `${fieldName}: ${oldVal} → ${newVal}`;
  };

  const getTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor(diff / (60 * 1000));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  if (!listingId || !listing) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏠</div>
          <p className={textStyles.headingSmall}>Listing not found</p>
          <button
            onClick={() => router.push("/")}
            className={`${buttonStyles.primary} mt-4`}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push("/")} className="hover:opacity-80">
                <HavenLogo size="sm" />
              </button>
              <h1 className={`${textStyles.heading} text-xl`}>Listing Details</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className={buttonStyles.secondary}
              >
                {copied ? "✓ Copied!" : "Share Listing"}
              </button>
              <button
                onClick={() => router.push("/")}
                className={buttonStyles.primary}
              >
                Browse Listings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image Gallery */}
            <div className="relative h-96 md:h-auto bg-gray-200 dark:bg-gray-700">
              {listing.images[imageIndex] && (
                <Image
                  src={listing.images[imageIndex]}
                  alt={listing.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}

              {/* Image Indicators */}
              {listing.images.length > 1 && (
                <>
                  <div className="absolute top-4 left-4 right-4 flex gap-2">
                    {listing.images.map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 h-1 rounded-full ${i === imageIndex ? "bg-white" : "bg-white/50"}`}
                      />
                    ))}
                  </div>

                  {/* Navigation Arrows */}
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors z-10"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors z-10"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Details */}
            <div className="p-6 md:p-8 overflow-y-auto max-h-[600px]">
              <h1 className={`${textStyles.headingLarge} mb-2`}>{listing.title}</h1>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  ${listing.price.toLocaleString()}/mo
                </span>
              </div>

              {/* Recent Changes */}
              {recentChanges.length > 0 && (
                <div className="mb-6">
                  <div className="space-y-2">
                    {recentChanges.map((change, index) => {
                      const isPriceChange = change.field === "price";
                      const isPriceDecrease = isPriceChange && change.newValue < change.oldValue;
                      const isPriceIncrease = isPriceChange && change.newValue > change.oldValue;
                      const priceChangeDiff = isPriceChange ? change.newValue - change.oldValue : 0;

                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                            isPriceDecrease
                              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                              : isPriceIncrease
                              ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
                              : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                          }`}
                        >
                          <span className="text-lg">
                            {isPriceDecrease ? "📉" : isPriceIncrease ? "📈" : "✏️"}
                          </span>
                          <div className="flex-1">
                            <span className={`font-medium ${
                              isPriceDecrease
                                ? "text-green-800 dark:text-green-200"
                                : isPriceIncrease
                                ? "text-orange-800 dark:text-orange-200"
                                : "text-blue-800 dark:text-blue-200"
                            }`}>
                              {isPriceChange ? (
                                <>
                                  Price: {priceChangeDiff > 0 ? '+' : ''}${priceChangeDiff.toLocaleString()}
                                  <span className="text-xs ml-1">
                                    ({formatChangeValue("price", change.oldValue)} → {formatChangeValue("price", change.newValue)})
                                  </span>
                                </>
                              ) : (
                                getChangeMessage(change)
                              )}
                            </span>
                          </div>
                          <span className={`text-xs ${
                            isPriceDecrease
                              ? "text-green-600 dark:text-green-400"
                              : isPriceIncrease
                              ? "text-orange-600 dark:text-orange-400"
                              : "text-blue-600 dark:text-blue-400"
                          }`}>
                            {getTimeAgo(change.timestamp)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🛏️</span>
                  <span className={textStyles.body}>{listing.bedrooms} bed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🚿</span>
                  <span className={textStyles.body}>{listing.bathrooms} bath</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📏</span>
                  <span className={textStyles.body}>{listing.sqft} sqft</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className={`${textStyles.headingSmall} mb-2`}>Description</h2>
                <p className={textStyles.body}>{listing.description}</p>
              </div>

              {/* Amenities */}
              {listing.amenities.length > 0 && (
                <div className="mb-6">
                  <h2 className={`${textStyles.headingSmall} mb-2`}>Amenities</h2>
                  <div className="flex flex-wrap gap-2">
                    {listing.amenities.map((amenity, index) => (
                      <span key={index} className={badgeStyles.default}>
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Available From */}
              <div className="mb-6">
                <h2 className={`${textStyles.headingSmall} mb-2`}>Available From</h2>
                <p className={textStyles.body}>
                  {new Date(listing.availableFrom).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {/* Reviews */}
              {reviews.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className={textStyles.headingSmall}>Reviews</h2>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className={`${textStyles.body} font-semibold`}>
                        {averageRating.toFixed(1)}
                      </span>
                      <span className={textStyles.bodySmall}>
                        ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {reviews.slice(0, 5).map((review) => (
                      <div key={review.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`${textStyles.bodySmall} font-semibold`}>
                            {review.userName}
                          </span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < review.rating ? "text-yellow-500" : "text-gray-300 dark:text-gray-600"}>
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className={textStyles.bodySmall}>{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Map Section */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h2 className={`${textStyles.headingSmall} mb-3`}>Location</h2>
              <p className={`${textStyles.body} mb-4`}>{listing.address}</p>
              {coordinates && (
                <div className="h-80 rounded-lg overflow-hidden">
                  <MapView lat={coordinates.lat} lng={coordinates.lng} address={listing.address} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ListingDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-gray-500 dark:text-gray-400">Loading...</div>
    </div>}>
      <ListingContent />
    </Suspense>
  );
}

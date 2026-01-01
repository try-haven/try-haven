"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NYCApartmentListing, Review } from "@/lib/data";
import Image from "next/image";
import dynamic from "next/dynamic";
import { textStyles, buttonStyles, badgeStyles } from "@/lib/styles";
import HavenLogo from "@/components/HavenLogo";
import { getAllListingsNYC } from "@/lib/listings";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

// Wrapper component that uses useSearchParams
function ListingPageWrapper() {
  const searchParams = useSearchParams();
  const listingId = searchParams.get("id");

  return <ListingContent listingId={listingId} />;
}

// Content component with all the logic
function ListingContent({ listingId }: { listingId: string | null }) {
  const router = useRouter();
  const [imageIndex, setImageIndex] = useState(0);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [copied, setCopied] = useState(false);
  const [listing, setListing] = useState<NYCApartmentListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode from localStorage and system preference
  useEffect(() => {
    if (typeof window === 'undefined') return () => {};

    const stored = localStorage.getItem('darkMode');
    if (stored !== null) {
      setDarkMode(stored === 'true');
    } else {
      setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }

    return () => {};
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    if (typeof window === 'undefined') return () => {};

    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(darkMode));

    return () => {};
  }, [darkMode]);

  // Fetch listing data directly without using contexts
  useEffect(() => {
    let cancelled = false;

    async function loadListing() {
      if (!listingId) {
        setIsLoading(false);
        return;
      }

      try {
        const supabaseListings = await getAllListingsNYC();
        if (cancelled) return;

        const found = supabaseListings.find(l => l.id === listingId);

        if (found && !cancelled) {
          setListing(found);
        }
      } catch (error) {
        console.error("Error loading listing:", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadListing();

    return () => {
      cancelled = true;
    };
  }, [listingId]);

  useEffect(() => {
    let cancelled = false;

    if (!listingId || !listing || typeof window === 'undefined') {
      return () => {}; // Return empty cleanup function
    }

    // Load reviews
    const storedReviews = localStorage.getItem(`haven_listing_reviews_${listingId}`);
    if (storedReviews) {
      try {
        setReviews(JSON.parse(storedReviews));
      } catch (error) {
        console.error("Error loading reviews:", error);
      }
    }

    // Use database coordinates if available, otherwise geocode
    if (listing.latitude && listing.longitude) {
      // Use cached coordinates from database
      setCoordinates({
        lat: listing.latitude,
        lng: listing.longitude,
      });
    } else {
      // Geocode address as fallback (non-critical, fail silently on errors)
      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(listing.address)}&limit=1`,
        {
          headers: {
            "User-Agent": "Haven App"
          }
        }
      )
        .then((res) => {
          if (!res.ok) {
            // Service error - fail silently
            console.warn(`[Geocoding] API error (${res.status}), map will be unavailable`);
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (!cancelled && data && Array.isArray(data) && data.length > 0) {
            setCoordinates({
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
            });
          } else if (!cancelled) {
            // Address not found - this is normal for invalid/incomplete addresses
            console.warn(`[Geocoding] No results found for address: ${listing.address}`);
          }
        })
        .catch((error) => {
          // Geocoding is non-critical, log but don't break the page
          console.warn("[Geocoding] Error (non-critical):", error.message || error);
        });
    }

    // Cleanup function to cancel pending operations
    return () => {
      cancelled = true;
    };
  }, [listingId, listing]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading listing...</div>
      </div>
    );
  }

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

  const getTimeAgo = (isoDateString: string): string => {
    const now = Date.now();
    const timestamp = new Date(isoDateString).getTime();
    const diff = now - timestamp;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor(diff / (60 * 1000));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  // Get most recent price change (last 30 days)
  const recentPriceChange = listing?.priceHistory && listing.priceHistory.length > 0
    ? (() => {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const recentChanges = listing.priceHistory.filter(
          change => new Date(change.timestamp).getTime() > thirtyDaysAgo
        );
        return recentChanges.length > 0 ? recentChanges[recentChanges.length - 1] : null;
      })()
    : null;

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
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                aria-label="Toggle dark mode"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
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
                  alt={`${listing.bedrooms} bedroom apartment at ${listing.address} - Image ${imageIndex + 1} of ${listing.images.length}`}
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
              {listing.apartmentComplexName && (
                <div className="mb-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                    <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                    </svg>
                    {listing.apartmentComplexName}
                  </span>
                </div>
              )}
              <h1 className={`${textStyles.headingLarge} mb-2`}>{listing.title}</h1>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-3xl font-bold text-indigo-600">
                  ${listing.price.toLocaleString()}/mo
                </span>
              </div>

              {/* Recent Price Change */}
              {recentPriceChange && (
                <div className="mb-6">
                  {(() => {
                    const isPriceDecrease = recentPriceChange.new_price < recentPriceChange.old_price;
                    const isPriceIncrease = recentPriceChange.new_price > recentPriceChange.old_price;
                    const priceChangeDiff = recentPriceChange.new_price - recentPriceChange.old_price;

                    return (
                      <div
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                          isPriceDecrease
                            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                            : "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
                        }`}
                      >
                        <span className="text-lg">
                          {isPriceDecrease ? "📉" : "📈"}
                        </span>
                        <div className="flex-1">
                          <span className={`font-medium ${
                            isPriceDecrease
                              ? "text-green-800 dark:text-green-200"
                              : "text-orange-800 dark:text-orange-200"
                          }`}>
                            Price: {priceChangeDiff > 0 ? '+' : ''}${priceChangeDiff.toLocaleString()}
                            <span className="text-xs ml-1">
                              (${recentPriceChange.old_price.toLocaleString()}/mo → ${recentPriceChange.new_price.toLocaleString()}/mo)
                            </span>
                          </span>
                        </div>
                        <span className={`text-xs ${
                          isPriceDecrease
                            ? "text-green-600 dark:text-green-400"
                            : "text-orange-600 dark:text-orange-400"
                        }`}>
                          {getTimeAgo(recentPriceChange.timestamp)}
                        </span>
                      </div>
                    );
                  })()}
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
                {listing.yearBuilt && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🏗️</span>
                    <span className={textStyles.body}>Built {listing.yearBuilt}</span>
                  </div>
                )}
                {listing.renovationYear && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">✨</span>
                    <span className={textStyles.body}>Renovated {listing.renovationYear}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className={`${textStyles.headingSmall} mb-2`}>Description</h2>
                <p className={textStyles.body}>{listing.description}</p>
              </div>

              {/* Amenities */}
              {(() => {
                const amenitiesList: string[] = [];
                if (listing.amenities.washerDryerInUnit) amenitiesList.push('In-unit Washer/Dryer');
                if (listing.amenities.washerDryerInBuilding) amenitiesList.push('Building Laundry');
                if (listing.amenities.dishwasher) amenitiesList.push('Dishwasher');
                if (listing.amenities.ac) amenitiesList.push('Air Conditioning');
                if (listing.amenities.pets) amenitiesList.push('Pet-Friendly');
                if (listing.amenities.fireplace) amenitiesList.push('Fireplace');
                if (listing.amenities.gym) amenitiesList.push('Gym');
                if (listing.amenities.parking) amenitiesList.push('Parking');
                if (listing.amenities.pool) amenitiesList.push('Pool');
                if (listing.amenities.outdoorArea && listing.amenities.outdoorArea !== 'None') {
                  amenitiesList.push(listing.amenities.outdoorArea);
                }
                if (listing.amenities.view && listing.amenities.view !== 'None') {
                  amenitiesList.push(`${listing.amenities.view} View`);
                }
                return amenitiesList.length > 0 ? (
                  <div className="mb-6">
                    <h2 className={`${textStyles.headingSmall} mb-2`}>Amenities</h2>
                    <div className="flex flex-wrap gap-2">
                      {amenitiesList.map((amenity, index) => (
                        <span key={index} className={badgeStyles.default}>
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Available From */}
              <div className="mb-6">
                <h2 className={`${textStyles.headingSmall} mb-2`}>Available From</h2>
                <p className={textStyles.body}>
                  {new Date(listing.dateAvailable).toLocaleDateString('en-US', {
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
                              <span key={i} className={i < review.rating ? "text-yellow-500" : "text-gray-300"}>
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
              {coordinates ? (
                <div className="h-80 rounded-lg overflow-hidden">
                  <MapView lat={coordinates.lat} lng={coordinates.lng} address={listing.address} />
                </div>
              ) : (
                <div className="h-80 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600">
                  <div className="text-center px-4">
                    <div className="text-4xl mb-2">📍</div>
                    <p className={`${textStyles.bodySmall} text-gray-500 dark:text-gray-400`}>
                      Map unavailable for this address
                    </p>
                  </div>
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
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    }>
      <ListingPageWrapper />
    </Suspense>
  );
}

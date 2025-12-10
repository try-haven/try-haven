"use client";

import { ApartmentListing, Review } from "@/lib/data";
import Image from "next/image";
import { useState, useEffect } from "react";
import SharedNavbar from "./SharedNavbar";
import { useUser } from "@/contexts/UserContext";
import { generateAnonymousNickname } from "@/lib/nicknames";
import dynamic from "next/dynamic";
import { textStyles } from "@/lib/styles";
import { useListings } from "@/contexts/ListingsContext";
import { getListingReviews, addReview, deleteReview, Review as SupabaseReview } from "@/lib/listings";

// Dynamically import the map component to avoid SSR issues
const MapView = dynamic(() => import("./MapView"), { ssr: false });

interface ReviewedListingsProps {
  onBack: () => void;
  onBackToHome?: () => void;
  likedCount?: number;
}

export default function ReviewedListings({ onBack, onBackToHome, likedCount = 0 }: ReviewedListingsProps) {
  const { logOut, user, markListingAsReviewed } = useUser();
  const [reviewedListings, setReviewedListings] = useState<Array<{ listing: ApartmentListing; review: Review }>>([]);
  const { listings: allListings, isLoading: isLoadingListings } = useListings();
  const [selectedListing, setSelectedListing] = useState<ApartmentListing | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [userReview, setUserReview] = useState<string>("");
  const [originalReview, setOriginalReview] = useState<string>("");
  const [originalRating, setOriginalRating] = useState<number>(0);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Helper function to reload reviewed listings
  const reloadReviewedListings = async () => {
    if (!user || allListings.length === 0) return;

    const reviewed: Array<{ listing: ApartmentListing; review: Review }> = [];

    await Promise.all(
      allListings.map(async (listing) => {
        const supabaseReviews = await getListingReviews(listing.id);
        const userReview = supabaseReviews.find(r => r.user_id === user.id);
        if (userReview) {
          reviewed.push({
            listing,
            review: {
              id: userReview.id,
              userName: userReview.user_name,
              userId: userReview.user_id,
              rating: userReview.rating,
              comment: userReview.comment,
              date: userReview.created_at,
            }
          });
        }
      })
    );

    setReviewedListings(reviewed);
  };

  // Load all reviewed listings
  useEffect(() => {
    reloadReviewedListings();
  }, [user, allListings]);

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

  if (reviewedListings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <SharedNavbar
              onBackToHome={onBackToHome}
              showBackToHome={!!onBackToHome}
              likedCount={likedCount}
            />
          </div>
          <div className="flex flex-col items-center justify-center min-h-[600px] text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              No reviews yet
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Start reviewing apartments to see them here!
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

  if (selectedListing && selectedReview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <SharedNavbar
              leftButton={
                <button
                  onClick={() => {
                    setSelectedListing(null);
                    setSelectedReview(null);
                    setCoordinates(null);
                    setShowEditForm(false);
                    setUserReview("");
                    setOriginalReview("");
                    setUserRating(0);
                    setOriginalRating(0);
                    setIsAnonymous(false);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to List
                </button>
              }
              onBackToHome={onBackToHome}
              showBackToHome={!!onBackToHome}
              likedCount={likedCount}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Image */}
            <div className="relative h-96 bg-gray-200 dark:bg-gray-700">
              {selectedListing.images[imageIndex] ? (
                <Image
                  src={selectedListing.images[imageIndex]}
                  alt={selectedListing.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900">
                  <svg
                    className="w-16 h-16 text-indigo-400 dark:text-indigo-300"
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

              {/* Your Review */}
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Your Review</h3>
                  {user && (
                    <button
                      onClick={() => {
                        setShowEditForm(!showEditForm);
                        if (!showEditForm) {
                          // Load existing review data
                          setUserRating(selectedReview.rating);
                          setUserReview(selectedReview.comment);
                          setOriginalReview(selectedReview.comment);
                          setOriginalRating(selectedReview.rating);
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
                      {showEditForm ? "Cancel" : "Edit Review"}
                    </button>
                  )}
                </div>
                
                {!showEditForm ? (
                  <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-800">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-6 h-6 ${
                              star <= selectedReview.rating
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
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(selectedReview.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{selectedReview.comment}</p>
                  </div>
                ) : (
                  <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
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
                      <button
                        onClick={async () => {
                          if (selectedListing && user) {
                            // Delete review from Supabase
                            await deleteReview(user.id, selectedListing.id);

                            // Reload reviewed listings from Supabase
                            await reloadReviewedListings();

                            // Reset and go back to list
                            setSelectedListing(null);
                            setSelectedReview(null);
                            setUserReview("");
                            setOriginalReview("");
                            setUserRating(0);
                            setOriginalRating(0);
                            setIsAnonymous(false);
                            setShowEditForm(false);
                            setCoordinates(null);
                          }
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => {
                          // Discard changes - reset to original values
                          setUserRating(originalRating);
                          setUserReview(originalReview);
                          setShowEditForm(false);
                        }}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        Discard
                      </button>
                      <button
                        onClick={async () => {
                          if (userRating > 0 && selectedListing && user) {
                            // Save review to Supabase (this will automatically upsert)
                            const savedReview = await addReview({
                              listing_id: selectedListing.id,
                              user_id: user.id,
                              user_name: isAnonymous ? generateAnonymousNickname() : user.username,
                              rating: userRating,
                              comment: userReview.trim() || "No comment",
                            });

                            if (savedReview) {
                              // Update the selected review with the new data
                              setSelectedReview({
                                id: savedReview.id,
                                userName: savedReview.user_name,
                                userId: savedReview.user_id,
                                rating: savedReview.rating,
                                comment: savedReview.comment,
                                date: savedReview.updated_at,
                              });

                              // Track review event for trends
                              const eventsData = localStorage.getItem("haven_listing_metric_events");
                              const events = eventsData ? JSON.parse(eventsData) : [];
                              events.push({
                                listingId: selectedListing.id,
                                timestamp: Date.now(),
                                type: 'review',
                                userId: user.id,
                                rating: userRating
                              });
                              localStorage.setItem("haven_listing_metric_events", JSON.stringify(events));
                            }

                            // Update original values
                            setOriginalRating(userRating);
                            setOriginalReview(userReview.trim());

                            // Reload reviewed listings from Supabase
                            await reloadReviewedListings();

                            setUserReview("");
                            setUserRating(0);
                            setIsAnonymous(false);
                            setShowEditForm(false);
                          }
                        }}
                        disabled={userRating === 0}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                )}
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <SharedNavbar
            onBackToHome={onBackToHome}
            showBackToHome={!!onBackToHome}
            likedCount={likedCount}
          />
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Your Reviews ({reviewedListings.length})
          </h2>
          <p className="text-gray-600 dark:text-gray-300">Apartments you&apos;ve reviewed</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviewedListings.map(({ listing, review }) => (
            <div
              key={listing.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedListing(listing);
                setSelectedReview(review);
                setImageIndex(0);
                setCoordinates(null);
              }}
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
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-1">{listing.address}</p>
                <div className="flex items-center gap-2 mb-2">
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
                <p className={textStyles.bodySmallClamp2}>{review.comment}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


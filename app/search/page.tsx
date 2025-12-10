"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ApartmentListing, Review } from "@/lib/data";
import { useUser } from "@/contexts/UserContext";
import { generateAnonymousNickname } from "@/lib/nicknames";
import SharedNavbar from "@/components/SharedNavbar";
import Image from "next/image";
import { textStyles, buttonStyles, inputStyles, containerStyles } from "@/lib/styles";
import { useLikedListingsContext } from "@/contexts/LikedListingsContext";
import { useListings } from "@/contexts/ListingsContext";
import { getListingReviews, addReview, deleteReview, Review as SupabaseReview } from "@/lib/listings";

export default function SearchPage() {
  const router = useRouter();
  const { user, isLoggedIn, markListingAsReviewed } = useUser();
  const { likedCount } = useLikedListingsContext();
  const { listings: allListings, isLoading: isLoadingListings } = useListings();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ApartmentListing[]>([]);
  const [selectedListing, setSelectedListing] = useState<ApartmentListing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [userReview, setUserReview] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [priceChanges, setPriceChanges] = useState<Record<string, {
    type: "increase" | "decrease";
    daysAgo: number;
    oldValue: number;
    newValue: number;
  }>>({});

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/");
    }
  }, [isLoggedIn, router]);

  // Auto-populate search results as user types
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = allListings.filter(listing =>
      listing.address.toLowerCase().includes(query) ||
      listing.title.toLowerCase().includes(query)
    );
    setSearchResults(results);
  }, [searchQuery, allListings]);

  // Load recent price changes for search results
  useEffect(() => {
    if (searchResults.length === 0) {
      setPriceChanges({});
      return;
    }

    try {
      const changesData = localStorage.getItem("haven_listing_changes");
      if (!changesData) return;

      const allChanges = JSON.parse(changesData);
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const changes: Record<string, { type: "increase" | "decrease"; daysAgo: number; oldValue: number; newValue: number }> = {};

      searchResults.forEach((listing) => {
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
          changes[listing.id] = {
            type: latestChange.newValue < latestChange.oldValue ? "decrease" : "increase",
            daysAgo: daysAgo,
            oldValue: latestChange.oldValue,
            newValue: latestChange.newValue
          };
        }
      });

      setPriceChanges(changes);
    } catch (error) {
      console.error("Error loading price changes:", error);
    }
  }, [searchResults]);

  // Load reviews when a listing is selected
  useEffect(() => {
    if (!selectedListing) return;

    const loadReviews = async () => {
      try {
        const supabaseReviews = await getListingReviews(selectedListing.id);
        // Convert Supabase reviews to app Review format
        const convertedReviews: Review[] = supabaseReviews.map(r => ({
          id: r.id,
          userName: r.user_name,
          userId: r.user_id,
          rating: r.rating,
          comment: r.comment,
          date: r.created_at,
        }));
        setReviews(convertedReviews);
      } catch (error) {
        console.error("Error loading reviews:", error);
        setReviews([]);
      }
    };

    loadReviews();
  }, [selectedListing]);

  // Handle review submission
  const handleSubmitReview = async () => {
    if (!user || !selectedListing || userRating === 0) return;

    const review = await addReview({
      listing_id: selectedListing.id,
      user_id: user.id,
      user_name: isAnonymous ? generateAnonymousNickname() : user.username,
      rating: userRating,
      comment: userReview.trim() || "No comment",
    });

    if (review) {
      // Reload reviews
      const supabaseReviews = await getListingReviews(selectedListing.id);
      const convertedReviews: Review[] = supabaseReviews.map(r => ({
        id: r.id,
        userName: r.user_name,
        userId: r.user_id,
        rating: r.rating,
        comment: r.comment,
        date: r.created_at,
      }));
      setReviews(convertedReviews);

      // Track review event for trends
      const eventsData = localStorage.getItem("haven_listing_metric_events");
      const events = eventsData ? JSON.parse(eventsData) : [];
      events.push({
        listingId: selectedListing.id,
        timestamp: Date.now(),
        type: 'review',
        userId: user.username,
        rating: userRating
      });
      localStorage.setItem("haven_listing_metric_events", JSON.stringify(events));

      // Mark as reviewed
      markListingAsReviewed(selectedListing.id);

      // Reset form
      setUserRating(0);
      setUserReview("");
      setIsAnonymous(false);
      setShowReviewForm(false);
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const userHasReview = user ? reviews.some(r => r.userId === user.id) : false;

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Navbar */}
      <div className="bg-white dark:bg-gray-800 shadow-sm px-6 py-4">
        <SharedNavbar likedCount={likedCount} />
      </div>

      <div className="container mx-auto px-6 py-8">
        <h1 className={`${textStyles.headingLarge} mb-6`}>Search Listings & Add Reviews</h1>

        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by address or building name..."
            className={inputStyles.standard}
          />
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && !selectedListing && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {searchResults.map((listing) => (
              <div
                key={listing.id}
                onClick={() => setSelectedListing(listing)}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
              >
                <div className="relative h-48 mb-3 rounded-lg overflow-hidden">
                  <Image
                    src={listing.images[0]}
                    alt={listing.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                  {listing.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {listing.address}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                    ${listing.price}/mo
                  </p>
                  {priceChanges[listing.id] && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      priceChanges[listing.id].type === "decrease"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                    }`}>
                      {priceChanges[listing.id].type === "decrease" ? "📉 " : "📈 "}
                      {priceChanges[listing.id].type === "decrease" ? "-" : "+"}
                      ${Math.abs(priceChanges[listing.id].newValue - priceChanges[listing.id].oldValue).toLocaleString()}
                      {" • "}
                      {priceChanges[listing.id].daysAgo === 0 ? "Today" : `${priceChanges[listing.id].daysAgo}d ago`}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {searchResults.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-300">
              No listings found for "{searchQuery}"
            </p>
          </div>
        )}

        {/* Selected Listing Detail */}
        {selectedListing && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <button
              onClick={() => setSelectedListing(null)}
              className={`${buttonStyles.secondary} mb-4 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-colors`}
            >
              ← Back to Results
            </button>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="relative h-64 rounded-lg overflow-hidden">
                <Image
                  src={selectedListing.images[0]}
                  alt={selectedListing.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedListing.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {selectedListing.address}
                </p>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">
                  ${selectedListing.price}/mo
                </p>
                <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-300">
                  <span>{selectedListing.bedrooms} bed</span>
                  <span>{selectedListing.bathrooms} bath</span>
                  <span>{selectedListing.sqft} sqft</span>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Reviews ({reviews.length})
                </h3>
                {user && !showReviewForm && (
                  <button
                    onClick={() => {
                      setShowReviewForm(true);
                      const existingReview = reviews.find(r => r.userId === user.id);
                      if (existingReview) {
                        setUserRating(existingReview.rating);
                        setUserReview(existingReview.comment);
                      }
                    }}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium cursor-pointer"
                  >
                    {userHasReview ? "Edit Review" : "Add Review"}
                  </button>
                )}
              </div>

              {/* Average Rating */}
              {reviews.length > 0 && (
                <div className="flex items-center gap-4 mb-6">
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
                    <span className="font-semibold">{averageRating.toFixed(1)}</span> out of 5
                  </div>
                </div>
              )}

              {/* Review Form */}
              {showReviewForm && user && (
                <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                    {userHasReview ? "Edit Your Review" : "Add Your Review"}
                  </h4>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Rating {userRating > 0 && `(${userRating} stars)`}
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setUserRating(star)}
                          className="focus:outline-none hover:scale-110 transition-transform"
                        >
                          <svg
                            className={`w-8 h-8 ${star <= userRating
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
                  <div className="mb-4">
                    <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
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
                    className={`${inputStyles.standard} mb-4`}
                    rows={4}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowReviewForm(false);
                        setUserRating(0);
                        setUserReview("");
                        setIsAnonymous(false);
                      }}
                      className={`${buttonStyles.secondary} hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-colors`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitReview}
                      disabled={userRating === 0}
                      className={`${buttonStyles.primary} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {userHasReview ? "Update Review" : "Submit Review"}
                    </button>
                  </div>
                </div>
              )}

              {/* Reviews List */}
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {review.userName}
                            {user && review.userId === user.id && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(You)</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
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
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(review.date).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-300 text-center py-8">
                  No reviews yet. Be the first to review this listing!
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

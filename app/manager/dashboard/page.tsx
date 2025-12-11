"use client";

import { useEffect, useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { ApartmentListing } from "@/lib/data";
import { textStyles, buttonStyles } from "@/lib/styles";
import HavenLogo from "@/components/HavenLogo";
import ListingTrendsChart from "@/components/ListingTrendsChart";
import DarkModeToggle from "@/components/DarkModeToggle";
import { getManagerListings, deleteListing as deleteListingFromDB } from "@/lib/listings";

interface ListingMetrics {
  listingId: string;
  views: number;
  swipeRights: number;
  swipeLefts: number;
  shares?: number;
}

export default function ManagerDashboard() {
  const router = useRouter();
  const { user, isLoggedIn, isManager, logOut } = useUser();
  const [listings, setListings] = useState<ApartmentListing[]>([]);
  const [metrics, setMetrics] = useState<Record<string, ListingMetrics>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedListings, setExpandedListings] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Redirect if not logged in or not a manager
    if (!isLoggedIn) {
      router.push("/");
      return;
    }
    if (!isManager) {
      router.push("/swipe");
      return;
    }

    // Load manager's listings
    loadListings();
    loadMetrics();
  }, [isLoggedIn, isManager, router, user]);

  const loadListings = async () => {
    if (!user) return;

    const supabaseListings = await getManagerListings(user.id);
    const convertedListings: ApartmentListing[] = supabaseListings.map(listing => ({
      id: listing.id,
      title: listing.title,
      address: listing.address,
      price: Number(listing.price),
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      sqft: listing.sqft,
      images: listing.images || [],
      amenities: listing.amenities || [],
      description: listing.description,
      availableFrom: listing.available_from,
    }));
    setListings(convertedListings);
  };

  const loadMetrics = () => {
    if (!user) return;

    const storedMetrics = localStorage.getItem("haven_listing_metrics");
    if (storedMetrics) {
      setMetrics(JSON.parse(storedMetrics));
    }
  };

  const deleteListing = async (listingId: string) => {
    if (!user) return;

    const confirmed = confirm("Are you sure you want to delete this listing?");
    if (!confirmed) return;

    const success = await deleteListingFromDB(listingId);
    if (success) {
      // Reload listings from database
      await loadListings();
    } else {
      alert("Failed to delete listing. Please try again.");
    }
  };

  const handleShareListing = async (listingId: string) => {
    const url = `${window.location.origin}/haven/listing?id=${listingId}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Check out this listing",
          text: "View this apartment listing on Haven",
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopiedId(listingId);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const getMetrics = (listingId: string): ListingMetrics => {
    return metrics[listingId] || { listingId, views: 0, swipeRights: 0, swipeLefts: 0, shares: 0 };
  };

  const getReviewCount = (listingId: string): number => {
    const storedReviews = localStorage.getItem(`haven_listing_reviews_${listingId}`);
    if (!storedReviews) return 0;
    try {
      const reviews = JSON.parse(storedReviews);
      return reviews.length;
    } catch {
      return 0;
    }
  };

  const calculateEngagementRate = (listingMetrics: ListingMetrics): string => {
    const total = listingMetrics.swipeRights + listingMetrics.swipeLefts;
    if (total === 0) return "0%";
    return `${Math.round((listingMetrics.swipeRights / total) * 100)}%`;
  };

  // Calculate totals only for this manager's listings
  const getTotalViews = (): number => {
    return listings.reduce((sum, listing) => {
      const listingMetrics = getMetrics(listing.id);
      return sum + listingMetrics.views;
    }, 0);
  };

  const getTotalLikes = (): number => {
    return listings.reduce((sum, listing) => {
      const listingMetrics = getMetrics(listing.id);
      return sum + listingMetrics.swipeRights;
    }, 0);
  };

  const getTotalPasses = (): number => {
    return listings.reduce((sum, listing) => {
      const listingMetrics = getMetrics(listing.id);
      return sum + listingMetrics.swipeLefts;
    }, 0);
  };

  const toggleExpanded = (listingId: string) => {
    setExpandedListings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(listingId)) {
        newSet.delete(listingId);
      } else {
        newSet.add(listingId);
      }
      return newSet;
    });
  };

  if (!isLoggedIn || !isManager) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HavenLogo size="sm" showAnimation={false} />
              <h1 className={`${textStyles.heading} text-xl`}>Manager Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <DarkModeToggle />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user?.username}
              </span>
              <button
                onClick={logOut}
                className={buttonStyles.secondary}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Listings</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{listings.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Views</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {getTotalViews()}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Likes</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {getTotalLikes()}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Passes</div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {getTotalPasses()}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/manager/add-listing")}
            className={`${buttonStyles.primary} text-lg py-3 px-6`}
          >
            + Add New Listing
          </button>
        </div>

        {/* Listings Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className={`${textStyles.heading} text-lg`}>Your Listings</h2>
          </div>

          {listings.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-6xl mb-4">🏢</div>
              <p className={`${textStyles.headingSmall} mb-2`}>No listings yet</p>
              <p className={textStyles.body}>
                Click "Add New Listing" to create your first property listing
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Likes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Passes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Like Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Shares
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Reviews
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {listings.map((listing) => {
                    const listingMetrics = getMetrics(listing.id);
                    const isExpanded = expandedListings.has(listing.id);
                    return (
                      <Fragment key={listing.id}>
                        <tr
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                          onClick={() => toggleExpanded(listing.id)}
                        >
                          <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {/* Expand/Collapse Chevron */}
                            <svg
                              className={`w-5 h-5 text-gray-400 transition-transform ${
                                isExpanded ? 'rotate-90' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                            {listing.images[0] && (
                              <img
                                src={listing.images[0]}
                                alt={listing.title}
                                className="w-12 h-12 rounded object-cover"
                              />
                            )}
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {listing.title}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {listing.bedrooms} bd, {listing.bathrooms} ba
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            ${listing.price.toLocaleString()}/mo
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {listingMetrics.views}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                            {listingMetrics.swipeRights}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                            {listingMetrics.swipeLefts}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {calculateEngagementRate(listingMetrics)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                            {listingMetrics.shares || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                            {getReviewCount(listing.id)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => router.push(`/listing?id=${listing.id}`)}
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium cursor-pointer"
                            >
                              Preview
                            </button>
                            <button
                              onClick={() => router.push(`/manager/edit-listing?id=${listing.id}`)}
                              className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 text-sm font-medium cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleShareListing(listing.id)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium cursor-pointer"
                            >
                              {copiedId === listing.id ? "✓ Copied" : "Share"}
                            </button>
                            <button
                              onClick={() => deleteListing(listing.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="px-6 py-4 bg-gray-50 dark:bg-gray-900">
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                              Analytics & Trends
                            </div>
                            <ListingTrendsChart listingId={listing.id} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

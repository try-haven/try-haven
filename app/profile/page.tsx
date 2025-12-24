"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import SharedNavbar from "@/components/SharedNavbar";
import { buttonStyles, textStyles } from "@/lib/styles";
import { useLikedListingsContext } from "@/contexts/LikedListingsContext";

export default function ProfilePage() {
  const router = useRouter();
  const { user, updatePreferences, loading, deleteAccount } = useUser();
  const { clearAllLikes } = useLikedListingsContext();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleResetAccount = async () => {
    setIsResetting(true);
    try {
      // Clear all liked listings
      await clearAllLikes();

      // Reset preferences to defaults
      await updatePreferences({
        address: undefined,
        latitude: undefined,
        longitude: undefined,
        commute: undefined,
        priceMin: undefined,
        priceMax: undefined,
        bedrooms: undefined,
        bathrooms: undefined,
        ratingMin: undefined,
        ratingMax: undefined,
        weights: {
          distance: 40,
          amenities: 35,
          quality: 15,
          rating: 10,
        },
        learned: {
          preferredAmenities: {},
          preferredLocations: [],
          avgImageCount: undefined,
          avgDescriptionLength: undefined,
          updatedAt: undefined,
        },
      });

      // Clear all user-specific local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('haven_swipe_history');
        localStorage.removeItem('haven_swipe_position');
        localStorage.removeItem('haven_reviewed_listings');
        localStorage.removeItem('haven_listing_metrics');
        localStorage.removeItem('haven_listing_metric_events');

        // Clear all cached listing reviews
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('haven_listing_reviews_')) {
            localStorage.removeItem(key);
          }
        });
      }

      setResetSuccess(true);
      setShowResetConfirm(false);

      // Redirect to preferences after 2 seconds
      setTimeout(() => {
        router.push('/preferences');
      }, 2000);
    } catch (error) {
      console.error("Error resetting account:", error);
      alert("Failed to reset account. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAccount();

      if (result.success) {
        // Redirect to home page
        router.replace('/');
      } else {
        alert(result.error || "Failed to delete account. Please try again.");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 md:px-6 py-4 md:py-8">
        <div className="flex items-center justify-between mb-4 md:mb-8">
          <SharedNavbar
            onPreferencesClick={() => router.push("/preferences")}
            onMyReviewsClick={() => router.push("/my-reviews")}
            onLikedListingsClick={() => router.push("/liked-listings")}
            showBackToHome={true}
          />
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
            <h1 className={`${textStyles.headingLarge} mb-6`}>Profile</h1>

            {/* User Info Section */}
            <div className="mb-8 space-y-4">
              <div>
                <label className={`${textStyles.bodySmall} text-gray-500 dark:text-gray-400`}>
                  Username
                </label>
                <p className={`${textStyles.body} font-semibold`}>{user.username}</p>
              </div>

              <div>
                <label className={`${textStyles.bodySmall} text-gray-500 dark:text-gray-400`}>
                  Email
                </label>
                <p className={`${textStyles.body}`}>{user.email}</p>
              </div>

              <div>
                <label className={`${textStyles.bodySmall} text-gray-500 dark:text-gray-400`}>
                  Account Type
                </label>
                <p className={`${textStyles.body} capitalize`}>{user.userType}</p>
              </div>
            </div>

            {/* Success Message */}
            {resetSuccess && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
                  <div>
                    <p className={`${textStyles.body} text-green-800 dark:text-green-200 font-semibold`}>
                      Account Reset Successfully!
                    </p>
                    <p className={`${textStyles.bodySmall} text-green-700 dark:text-green-300`}>
                      Redirecting to preferences page...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Reset Account Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h2 className={`${textStyles.heading} mb-2 text-red-600 dark:text-red-400`}>
                Danger Zone
              </h2>
              <p className={`${textStyles.body} text-gray-600 dark:text-gray-400 mb-4`}>
                Reset your account to start fresh. This will clear all your liked listings,
                learned preferences, and customized settings.
              </p>

              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium"
                >
                  Reset Account
                </button>
              ) : (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg p-4">
                  <p className={`${textStyles.body} text-red-800 dark:text-red-200 font-semibold mb-3`}>
                    Are you sure you want to reset your account?
                  </p>
                  <p className={`${textStyles.bodySmall} text-red-700 dark:text-red-300 mb-4`}>
                    This will permanently delete:
                  </p>
                  <ul className={`${textStyles.bodySmall} text-red-700 dark:text-red-300 mb-4 list-disc list-inside space-y-1`}>
                    <li>All liked listings</li>
                    <li>Learned preferences from your swipe history</li>
                    <li>Custom preference settings</li>
                    <li>Swipe history</li>
                  </ul>
                  <div className="flex gap-3">
                    <button
                      onClick={handleResetAccount}
                      disabled={isResetting}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isResetting ? "Resetting..." : "Yes, Reset My Account"}
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      disabled={isResetting}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Delete Account Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
              <h2 className={`${textStyles.heading} mb-2 text-red-700 dark:text-red-500`}>
                Delete Account Permanently
              </h2>
              <p className={`${textStyles.body} text-gray-600 dark:text-gray-400 mb-4`}>
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete Account
                </button>
              ) : (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg p-4">
                  <p className={`${textStyles.body} text-red-900 dark:text-red-100 font-bold mb-3`}>
                    ⚠️ WARNING: This action is permanent and cannot be undone!
                  </p>
                  <p className={`${textStyles.bodySmall} text-red-800 dark:text-red-200 mb-4`}>
                    Deleting your account will permanently remove:
                  </p>
                  <ul className={`${textStyles.bodySmall} text-red-800 dark:text-red-200 mb-4 list-disc list-inside space-y-1`}>
                    <li>Your account and profile</li>
                    <li>All liked listings</li>
                    <li>All reviews you've written</li>
                    <li>All learned preferences and settings</li>
                    <li>All swipe history</li>
                  </ul>
                  <p className={`${textStyles.body} text-red-900 dark:text-red-100 font-semibold mb-4`}>
                    Are you absolutely sure you want to delete your account?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? "Deleting..." : "Yes, Delete My Account Permanently"}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
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

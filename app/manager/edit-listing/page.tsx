"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { ApartmentListing } from "@/lib/data";
import { textStyles, inputStyles, buttonStyles } from "@/lib/styles";
import HavenLogo from "@/components/HavenLogo";

interface ListingChange {
  listingId: string;
  timestamp: number;
  field: string;
  oldValue: any;
  newValue: any;
}

function EditListingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoggedIn, isManager } = useUser();
  const listingId = searchParams.get("id");
  const [originalListing, setOriginalListing] = useState<ApartmentListing | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    address: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    sqft: "",
    description: "",
    availableFrom: "",
    amenities: "",
    images: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    // Load listing
    if (listingId && user) {
      const storedListings = localStorage.getItem(`haven_manager_listings_${user.username}`);
      if (storedListings) {
        const listings: ApartmentListing[] = JSON.parse(storedListings);
        const listing = listings.find(l => l.id === listingId);
        if (listing) {
          setOriginalListing(listing);
          setFormData({
            title: listing.title,
            address: listing.address,
            price: listing.price.toString(),
            bedrooms: listing.bedrooms.toString(),
            bathrooms: listing.bathrooms.toString(),
            sqft: listing.sqft.toString(),
            description: listing.description || "",
            availableFrom: listing.availableFrom || "",
            amenities: listing.amenities.join(", "),
            images: listing.images.join("\n"),
          });
        } else {
          setError("Listing not found");
        }
      }
    }
  }, [isLoggedIn, isManager, router, user, listingId]);

  const trackChange = (field: string, oldValue: any, newValue: any) => {
    if (oldValue === newValue) return;

    const change: ListingChange = {
      listingId: listingId!,
      timestamp: Date.now(),
      field,
      oldValue,
      newValue,
    };

    const changesData = localStorage.getItem("haven_listing_changes");
    const changes: ListingChange[] = changesData ? JSON.parse(changesData) : [];
    changes.push(change);
    localStorage.setItem("haven_listing_changes", JSON.stringify(changes));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!user || !listingId || !originalListing) {
        setError("Invalid listing");
        setIsSubmitting(false);
        return;
      }

      // Validate required fields
      if (!formData.title || !formData.address || !formData.price || !formData.bedrooms || !formData.bathrooms) {
        setError("Please fill in all required fields");
        setIsSubmitting(false);
        return;
      }

      // Parse image URLs
      const imageUrls = formData.images
        .split("\n")
        .map(url => url.trim())
        .filter(url => url.length > 0);

      if (imageUrls.length === 0) {
        setError("Please add at least one image URL");
        setIsSubmitting(false);
        return;
      }

      // Parse amenities
      const amenitiesList = formData.amenities
        .split(",")
        .map(a => a.trim())
        .filter(a => a.length > 0);

      // Create updated listing object
      const updatedListing: ApartmentListing = {
        ...originalListing,
        title: formData.title,
        address: formData.address,
        price: parseFloat(formData.price),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseFloat(formData.bathrooms),
        sqft: parseInt(formData.sqft) || 0,
        images: imageUrls,
        amenities: amenitiesList,
        description: formData.description,
        availableFrom: formData.availableFrom || originalListing.availableFrom,
      };

      // Track changes for important fields
      if (originalListing.price !== updatedListing.price) {
        trackChange("price", originalListing.price, updatedListing.price);
      }
      if (originalListing.title !== updatedListing.title) {
        trackChange("title", originalListing.title, updatedListing.title);
      }
      if (originalListing.bedrooms !== updatedListing.bedrooms) {
        trackChange("bedrooms", originalListing.bedrooms, updatedListing.bedrooms);
      }
      if (originalListing.bathrooms !== updatedListing.bathrooms) {
        trackChange("bathrooms", originalListing.bathrooms, updatedListing.bathrooms);
      }

      // Update in localStorage
      const existingListings = localStorage.getItem(`haven_manager_listings_${user.username}`);
      const listings: ApartmentListing[] = existingListings ? JSON.parse(existingListings) : [];
      const index = listings.findIndex(l => l.id === listingId);
      if (index !== -1) {
        listings[index] = updatedListing;
        localStorage.setItem(`haven_manager_listings_${user.username}`, JSON.stringify(listings));
      }

      // Redirect to dashboard
      router.push("/manager/dashboard");
    } catch (err) {
      setError("Failed to update listing. Please check your inputs.");
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn || !isManager) {
    return null;
  }

  if (!originalListing) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏠</div>
          <p className={textStyles.headingSmall}>{error || "Loading..."}</p>
          <button
            onClick={() => router.push("/manager/dashboard")}
            className={`${buttonStyles.primary} mt-4`}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HavenLogo size="sm" showAnimation={false} />
              <h1 className={`${textStyles.heading} text-xl`}>Edit Listing</h1>
            </div>
            <button
              onClick={() => router.push("/manager/dashboard")}
              className={buttonStyles.secondary}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className={inputStyles.label}>
                Listing Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Modern Studio in Westwood"
                className={inputStyles.standard}
                required
              />
            </div>

            {/* Address */}
            <div>
              <label className={inputStyles.label}>
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g., 1234 Main St, Los Angeles, CA 90024"
                className={inputStyles.standard}
                required
              />
            </div>

            {/* Price, Bedrooms, Bathrooms */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={inputStyles.label}>
                  Price ($/month) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="2500"
                  className={inputStyles.standard}
                  required
                  min="0"
                  step="50"
                />
              </div>
              <div>
                <label className={inputStyles.label}>
                  Bedrooms <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  placeholder="1"
                  className={inputStyles.standard}
                  required
                  min="0"
                  step="1"
                />
              </div>
              <div>
                <label className={inputStyles.label}>
                  Bathrooms <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  placeholder="1"
                  className={inputStyles.standard}
                  required
                  min="0"
                  step="0.5"
                />
              </div>
            </div>

            {/* Square Footage */}
            <div>
              <label className={inputStyles.label}>
                Square Footage
              </label>
              <input
                type="number"
                name="sqft"
                value={formData.sqft}
                onChange={handleChange}
                placeholder="800"
                className={inputStyles.standard}
                min="0"
                step="50"
              />
            </div>

            {/* Available From */}
            <div>
              <label className={inputStyles.label}>
                Available From
              </label>
              <input
                type="date"
                name="availableFrom"
                value={formData.availableFrom}
                onChange={handleChange}
                className={inputStyles.standard}
              />
            </div>

            {/* Description */}
            <div>
              <label className={inputStyles.label}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your property..."
                className={inputStyles.standard}
                rows={4}
              />
            </div>

            {/* Amenities */}
            <div>
              <label className={inputStyles.label}>
                Amenities (comma-separated)
              </label>
              <input
                type="text"
                name="amenities"
                value={formData.amenities}
                onChange={handleChange}
                placeholder="e.g., In-unit laundry, Parking, Gym, Pool"
                className={inputStyles.standard}
              />
              <p className={textStyles.helperWithMargin}>
                Separate each amenity with a comma
              </p>
            </div>

            {/* Images */}
            <div>
              <label className={inputStyles.label}>
                Image URLs (one per line) <span className="text-red-500">*</span>
              </label>
              <textarea
                name="images"
                value={formData.images}
                onChange={handleChange}
                placeholder="https://images.unsplash.com/photo-example1?w=800"
                className={inputStyles.standard}
                rows={4}
                required
              />
              <p className={textStyles.helperWithMargin}>
                Add one image URL per line. You can use Unsplash URLs or any other image hosting service.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className={textStyles.error}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`${buttonStyles.primary} flex-1`}
              >
                {isSubmitting ? "Updating Listing..." : "Update Listing"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/manager/dashboard")}
                className={buttonStyles.secondary}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function EditListingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    }>
      <EditListingContent />
    </Suspense>
  );
}

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { ApartmentListing } from "@/lib/data";
import { textStyles, inputStyles, buttonStyles } from "@/lib/styles";
import HavenLogo from "@/components/HavenLogo";
import DarkModeToggle from "@/components/DarkModeToggle";
import { getManagerListings, updateListing } from "@/lib/listings";

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

    // Load listing from Supabase
    const loadListing = async () => {
      if (!listingId || !user) return;

      const supabaseListings = await getManagerListings(user.id);
      const supabaseListing = supabaseListings.find(l => l.id === listingId);

      if (supabaseListing) {
        const listing: ApartmentListing = {
          id: supabaseListing.id,
          title: supabaseListing.title,
          address: supabaseListing.address,
          price: Number(supabaseListing.price),
          bedrooms: supabaseListing.bedrooms,
          bathrooms: supabaseListing.bathrooms,
          sqft: supabaseListing.sqft,
          images: supabaseListing.images || [],
          amenities: supabaseListing.amenities || [],
          description: supabaseListing.description,
          availableFrom: supabaseListing.available_from,
        };

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
    };

    loadListing();
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!user || !listingId || !originalListing) {
        setError("Invalid listing");
        setIsSubmitting(false);
        return;
      }

      // Read values directly from form to avoid state race conditions
      const form = e.currentTarget;
      const formDataObj = new FormData(form);

      const title = formDataObj.get("title") as string;
      const address = formDataObj.get("address") as string;
      const price = formDataObj.get("price") as string;
      const bedrooms = formDataObj.get("bedrooms") as string;
      const bathrooms = formDataObj.get("bathrooms") as string;
      const sqft = formDataObj.get("sqft") as string;
      const description = formDataObj.get("description") as string;
      const availableFrom = formDataObj.get("availableFrom") as string;
      const amenities = formDataObj.get("amenities") as string;
      const images = formDataObj.get("images") as string;


      // Validate required fields
      if (!title || !address || !price || !bedrooms || !bathrooms) {
        setError("Please fill in all required fields");
        setIsSubmitting(false);
        return;
      }

      // Validate price is a valid number
      const priceNum = parseInt(price, 10);
      if (isNaN(priceNum) || priceNum < 0) {
        setError("Please enter a valid price");
        setIsSubmitting(false);
        return;
      }

      // Parse image URLs
      const imageUrls = images
        .split("\n")
        .map(url => url.trim())
        .filter(url => url.length > 0);

      if (imageUrls.length === 0) {
        setError("Please add at least one image URL");
        setIsSubmitting(false);
        return;
      }

      // Parse amenities
      const amenitiesList = amenities
        .split(",")
        .map(a => a.trim())
        .filter(a => a.length > 0);

      // Create updated listing object
      const updatedListing: ApartmentListing = {
        ...originalListing,
        title: title,
        address: address,
        price: parseInt(price, 10),
        bedrooms: parseInt(bedrooms, 10),
        bathrooms: parseFloat(bathrooms),
        sqft: parseInt(sqft, 10) || 0,
        images: imageUrls,
        amenities: amenitiesList,
        description: description,
        availableFrom: availableFrom || originalListing.availableFrom,
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


      // Update in Supabase
      const success = await updateListing(listingId, {
        title: title,
        address: address,
        price: updatedListing.price,
        bedrooms: updatedListing.bedrooms,
        bathrooms: updatedListing.bathrooms,
        sqft: updatedListing.sqft,
        images: imageUrls,
        amenities: amenitiesList,
        description: description,
        available_from: availableFrom || new Date().toISOString().split("T")[0],
      });

      if (success) {
        // Redirect to dashboard
        router.push("/manager/dashboard");
      } else {
        setError("Failed to update listing in database. Please try again.");
        setIsSubmitting(false);
      }
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
            <div className="flex items-center gap-3">
              <DarkModeToggle />
              <button
                onClick={() => router.push("/manager/dashboard")}
                className={buttonStyles.secondary}
              >
                Back to Dashboard
              </button>
            </div>
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
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  onBlur={handleChange}
                  placeholder="2500"
                  className={inputStyles.standard}
                  required
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

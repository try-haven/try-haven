"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { ApartmentListing } from "@/lib/data";
import { textStyles, inputStyles, buttonStyles } from "@/lib/styles";
import HavenLogo from "@/components/HavenLogo";
import DarkModeToggle from "@/components/DarkModeToggle";
import { createListing } from "@/lib/listings";

export default function AddListingPage() {
  const router = useRouter();
  const { user, isLoggedIn, isManager } = useUser();
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
  }, [isLoggedIn, isManager, router]);

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

      // Create listing in Supabase
      const listing = await createListing({
        manager_id: user!.id,
        title: formData.title,
        address: formData.address,
        price: parseFloat(formData.price),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseFloat(formData.bathrooms),
        sqft: parseInt(formData.sqft) || 0,
        images: imageUrls,
        amenities: amenitiesList,
        description: formData.description,
        available_from: formData.availableFrom || new Date().toISOString().split("T")[0],
      });

      if (listing) {
        // Redirect to dashboard
        router.push("/manager/dashboard");
      } else {
        setError("Failed to create listing in database. Please try again.");
        setIsSubmitting(false);
      }
    } catch (err) {
      setError("Failed to create listing. Please check your inputs.");
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn || !isManager) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HavenLogo size="sm" showAnimation={false} />
              <h1 className={`${textStyles.heading} text-xl`}>Add New Listing</h1>
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
                {isSubmitting ? "Creating Listing..." : "Create Listing"}
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

        {/* Helper Info */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
            Tips for great listings:
          </h3>
          <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
            <li>• Use high-quality images that showcase your property</li>
            <li>• Write a detailed description highlighting unique features</li>
            <li>• List all amenities to attract more interest</li>
            <li>• Keep pricing competitive with similar properties in the area</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { ApartmentListing } from "@/lib/data";
import { textStyles, inputStyles, buttonStyles } from "@/lib/styles";
import HavenLogo from "@/components/HavenLogo";
import DarkModeToggle from "@/components/DarkModeToggle";
import { createListing } from "@/lib/listings";
import { geocodeAddress } from "@/lib/geocoding";

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
    yearBuilt: "",
    renovationYear: "",
    description: "",
    availableFrom: "",
    images: "",
    outdoorArea: "None",
    view: "None",
  });
  const [amenities, setAmenities] = useState({
    washerDryerInUnit: false,
    washerDryerInBuilding: false,
    dishwasher: false,
    ac: false,
    pets: false,
    fireplace: false,
    gym: false,
    parking: false,
    pool: false,
  });
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geocodingFailed, setGeocodingFailed] = useState(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Reset geocoding validation if address changes
    if (e.target.name === 'address') {
      setGeocodingFailed(false);
      setWarning("");
    }
  };

  const handleAmenityToggle = (amenity: keyof typeof amenities) => {
    setAmenities(prev => ({
      ...prev,
      [amenity]: !prev[amenity]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setWarning("");
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.address || !formData.price || !formData.bedrooms ||
          !formData.bathrooms || !formData.yearBuilt) {
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

      // Validate address via geocoding (unless user already confirmed)
      if (!geocodingFailed) {
        const coords = await geocodeAddress(formData.address);
        if (!coords) {
          setWarning("We couldn't find this address. Are you sure that's the right address? Click 'Create Listing' again to proceed anyway.");
          setGeocodingFailed(true);
          setIsSubmitting(false);
          return;
        }
      }

      // Convert amenities object to array
      const amenitiesList: string[] = [];
      if (amenities.washerDryerInUnit) amenitiesList.push("In-unit laundry");
      if (amenities.washerDryerInBuilding) amenitiesList.push("Washer/Dryer in building");
      if (amenities.dishwasher) amenitiesList.push("Dishwasher");
      if (amenities.ac) amenitiesList.push("AC");
      if (amenities.pets) amenitiesList.push("Pet-friendly");
      if (amenities.fireplace) amenitiesList.push("Fireplace");
      if (amenities.gym) amenitiesList.push("Gym");
      if (amenities.parking) amenitiesList.push("Parking");
      if (amenities.pool) amenitiesList.push("Pool");
      // Outdoor area and view are now in formData, not amenities

      // Create listing in Supabase
      const listing = await createListing({
        manager_id: user!.id,
        title: formData.title,
        address: formData.address,
        price: parseInt(formData.price, 10),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseFloat(formData.bathrooms),
        sqft: parseInt(formData.sqft) || 0,
        images: imageUrls,
        amenities: amenitiesList,
        description: formData.description,
        available_from: formData.availableFrom || new Date().toISOString().split("T")[0],
        // NYC-specific fields
        yearBuilt: parseInt(formData.yearBuilt),
        renovationYear: formData.renovationYear ? parseInt(formData.renovationYear) : null,
        outdoorArea: formData.outdoorArea,
        view: formData.view,
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
                placeholder="e.g., 1234 Main St"
                className={inputStyles.standard}
                required
              />
              <p className={textStyles.helperWithMargin}>
                Location (city, state, neighborhood) will be automatically set based on your apartment complex profile
              </p>
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

            {/* Year Built and Renovation Year */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={inputStyles.label}>
                  Year Built <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="yearBuilt"
                  value={formData.yearBuilt}
                  onChange={handleChange}
                  placeholder="e.g., 2010"
                  className={inputStyles.standard}
                  required
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>
              <div>
                <label className={inputStyles.label}>
                  Renovation Year (optional)
                </label>
                <input
                  type="number"
                  name="renovationYear"
                  value={formData.renovationYear}
                  onChange={handleChange}
                  placeholder="e.g., 2020"
                  className={inputStyles.standard}
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>
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
                Amenities
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Select all amenities that apply to this listing
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amenities.washerDryerInUnit}
                    onChange={() => handleAmenityToggle('washerDryerInUnit')}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">In-unit Washer/Dryer</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amenities.washerDryerInBuilding}
                    onChange={() => handleAmenityToggle('washerDryerInBuilding')}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Building Laundry</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amenities.dishwasher}
                    onChange={() => handleAmenityToggle('dishwasher')}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Dishwasher</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amenities.ac}
                    onChange={() => handleAmenityToggle('ac')}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Air Conditioning</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amenities.pets}
                    onChange={() => handleAmenityToggle('pets')}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Pet-Friendly</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amenities.fireplace}
                    onChange={() => handleAmenityToggle('fireplace')}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Fireplace</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amenities.gym}
                    onChange={() => handleAmenityToggle('gym')}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Gym</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amenities.parking}
                    onChange={() => handleAmenityToggle('parking')}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Parking</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amenities.pool}
                    onChange={() => handleAmenityToggle('pool')}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Pool</span>
                </label>
              </div>
            </div>

            {/* Outdoor Area and View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={inputStyles.label}>
                  Outdoor Area
                </label>
                <select
                  name="outdoorArea"
                  value={formData.outdoorArea}
                  onChange={handleChange}
                  className={inputStyles.standard}
                >
                  <option value="None">None</option>
                  <option value="Balcony">Balcony</option>
                  <option value="Patio">Patio</option>
                  <option value="Garden">Garden</option>
                  <option value="Terrace">Terrace</option>
                  <option value="Rooftop">Rooftop</option>
                </select>
              </div>
              <div>
                <label className={inputStyles.label}>
                  View
                </label>
                <select
                  name="view"
                  value={formData.view}
                  onChange={handleChange}
                  className={inputStyles.standard}
                >
                  <option value="None">None</option>
                  <option value="City">City</option>
                  <option value="Park">Park</option>
                  <option value="Water">Water</option>
                  <option value="Other">Other</option>
                </select>
              </div>
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

            {/* Warning Message */}
            {warning && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-xl">⚠️</span>
                  <p className="text-sm">{warning}</p>
                </div>
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

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { textStyles, buttonStyles, containerStyles, layoutStyles, inputStyles } from "@/lib/styles";

interface ScoringWeights {
  distance: number;
  amenities: number;
  quality: number;
  rating: number;
}

interface ApartmentPreferencesData {
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number[];
  bathrooms?: number[];
  ratingMin?: number;
  ratingMax?: number;
  requiredAmenities?: string[];
  requiredView?: string[]; // e.g., ["City", "Water", "Park"]
  requiredNeighborhoods?: string[]; // e.g., ["Manhattan", "Brooklyn"]
  weights?: ScoringWeights;
}

interface ApartmentPreferencesProps {
  onNext: (preferences: ApartmentPreferencesData) => void;
  onBack?: () => void;
  initialPreferences?: ApartmentPreferencesData;
}

export default function ApartmentPreferences({ onNext, onBack, initialPreferences }: ApartmentPreferencesProps) {
  // State for preferences - auto-set price to full range (0-10000)
  const [priceMin, setPriceMin] = useState<number>(initialPreferences?.priceMin ?? 0);
  const [priceMax, setPriceMax] = useState<number>(initialPreferences?.priceMax ?? 10000);
  const [selectedBedrooms, setSelectedBedrooms] = useState<number[]>(initialPreferences?.bedrooms || []);
  const [selectedBathrooms, setSelectedBathrooms] = useState<number[]>(initialPreferences?.bathrooms || []);
  const [ratingMin, setRatingMin] = useState<number>(initialPreferences?.ratingMin || 0);
  const [ratingMax, setRatingMax] = useState<number>(initialPreferences?.ratingMax || 5);
  const [requiredAmenities, setRequiredAmenities] = useState<string[]>(initialPreferences?.requiredAmenities || []);
  const [requiredView, setRequiredView] = useState<string[]>(initialPreferences?.requiredView || []);
  const [requiredNeighborhoods, setRequiredNeighborhoods] = useState<string[]>(initialPreferences?.requiredNeighborhoods || []);

  // State for "no preference" toggles - default to false so users see the controls
  const [noPricePreference, setNoPricePreference] = useState(false);
  const [noBedroomsPreference, setNoBedroomsPreference] = useState(false);
  const [noBathroomsPreference, setNoBathroomsPreference] = useState(false);
  const [noRatingPreference, setNoRatingPreference] = useState(false);


  const [error, setError] = useState("");

  const handleClearAll = () => {
    // Clear all filters - set price to full range
    setPriceMin(0);
    setPriceMax(10000);
    setSelectedBedrooms([]);
    setSelectedBathrooms([]);
    setRatingMin(0);
    setRatingMax(5);
    setRequiredAmenities([]);
    setRequiredView([]);
    setRequiredNeighborhoods([]);

    // Enable all "no preference" toggles
    setNoPricePreference(true);
    setNoBedroomsPreference(true);
    setNoBathroomsPreference(true);
    setNoRatingPreference(true);

    setError("");
  };

  const handleNext = () => {
    setError("");

    // Build preferences object
    const preferences: ApartmentPreferencesData = {};

    // Validate and add price range
    if (!noPricePreference) {
      if (priceMin > priceMax) {
        setError("Minimum price cannot be greater than maximum price");
        return;
      }

      preferences.priceMin = priceMin;
      preferences.priceMax = priceMax;
    }

    // Add bedroom selections - if nothing selected, treat as no preference
    if (!noBedroomsPreference && selectedBedrooms.length > 0) {
      preferences.bedrooms = selectedBedrooms;
    } else {
      preferences.bedrooms = undefined; // No preference
    }

    // Add bathroom selections - if nothing selected, treat as no preference
    if (!noBathroomsPreference && selectedBathrooms.length > 0) {
      preferences.bathrooms = selectedBathrooms;
    } else {
      preferences.bathrooms = undefined; // No preference
    }

    // Validate and add rating range
    if (!noRatingPreference) {
      if (ratingMin > ratingMax) {
        setError("Minimum rating cannot be greater than maximum rating");
        return;
      }
      preferences.ratingMin = ratingMin;
      preferences.ratingMax = ratingMax;
    }

    // Add required amenities (hard filter)
    if (requiredAmenities.length > 0) {
      preferences.requiredAmenities = requiredAmenities;
    }

    // Add required view (hard filter)
    if (requiredView.length > 0) {
      preferences.requiredView = requiredView;
    }

    // Add required neighborhoods (hard filter)
    if (requiredNeighborhoods.length > 0) {
      preferences.requiredNeighborhoods = requiredNeighborhoods;
    }

    // Always use default scoring weights (user can customize in profile)
    preferences.weights = {
      distance: 40,
      amenities: 35,
      quality: 15,
      rating: 10,
    };

    onNext(preferences);
  };

  return (
    <div className={`${containerStyles.pageIndigo} ${layoutStyles.flexColCenter} px-6`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <h2 className={`${textStyles.headingSmall} text-center mb-4`}>
          {initialPreferences ? "Update your apartment preferences" : "What are you looking for?"}
        </h2>
        <p className={`${textStyles.bodyCenter} mb-6 text-sm`}>
          Set your preferences or leave them open to learn from your behavior
        </p>

        <div className={`${layoutStyles.spaceY4} mb-6`}>
          {/* Price Range */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Monthly Rent
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={noPricePreference}
                  onChange={(e) => {
                    setNoPricePreference(e.target.checked);
                    if (e.target.checked) {
                      setPriceMin(500);
                      setPriceMax(5000);
                    }
                  }}
                  className="rounded"
                />
                No preference
              </label>
            </div>
            {!noPricePreference && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">${priceMin.toLocaleString()}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">${priceMax.toLocaleString()}</span>
                </div>
                <div className="relative h-8 pt-2">
                  <div className="absolute w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg pointer-events-none" />
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={priceMax}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value >= priceMin) setPriceMax(value);
                    }}
                    className="absolute w-full h-2 bg-transparent rounded-lg appearance-none pointer-events-none z-10 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-0"
                  />
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={priceMin}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value <= priceMax) setPriceMin(value);
                    }}
                    className="absolute w-full h-2 bg-transparent rounded-lg appearance-none pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-0"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bedrooms */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Bedrooms
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={noBedroomsPreference}
                  onChange={(e) => {
                    setNoBedroomsPreference(e.target.checked);
                    if (e.target.checked) {
                      setSelectedBedrooms([]);
                    }
                  }}
                  className="rounded"
                />
                No preference
              </label>
            </div>
            {!noBedroomsPreference && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Select all that apply
                </p>
                <div className="grid grid-cols-6 gap-2">
                  {[0, 1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={`bed-${num}`}
                      type="button"
                      onClick={() => {
                        setSelectedBedrooms(prev =>
                          prev.includes(num)
                            ? prev.filter(b => b !== num)
                            : [...prev, num].sort((a, b) => a - b)
                        );
                      }}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                        selectedBedrooms.includes(num)
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {num === 0 ? "Studio" : num}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bathrooms */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Bathrooms
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={noBathroomsPreference}
                  onChange={(e) => {
                    setNoBathroomsPreference(e.target.checked);
                    if (e.target.checked) {
                      setSelectedBathrooms([]);
                    }
                  }}
                  className="rounded"
                />
                No preference
              </label>
            </div>
            {!noBathroomsPreference && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Select all that apply
                </p>
                <div className="grid grid-cols-6 gap-2">
                  {[1, 1.5, 2, 2.5, 3, 3.5].map((num) => (
                    <button
                      key={`bath-${num}`}
                      type="button"
                      onClick={() => {
                        setSelectedBathrooms(prev =>
                          prev.includes(num)
                            ? prev.filter(b => b !== num)
                            : [...prev, num].sort((a, b) => a - b)
                        );
                      }}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                        selectedBathrooms.includes(num)
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Rating
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={noRatingPreference}
                  onChange={(e) => {
                    setNoRatingPreference(e.target.checked);
                    if (e.target.checked) {
                      setRatingMin(0);
                      setRatingMax(5);
                    }
                  }}
                  className="rounded"
                />
                No preference
              </label>
            </div>
            {!noRatingPreference && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{ratingMin.toFixed(1)} ⭐</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{ratingMax.toFixed(1)} ⭐</span>
                </div>
                <div className="relative h-8 pt-2">
                  <div className="absolute w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg pointer-events-none" />
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={ratingMax}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (value >= ratingMin) setRatingMax(value);
                    }}
                    className="absolute w-full h-2 bg-transparent rounded-lg appearance-none pointer-events-none z-10 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-0"
                  />
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={ratingMin}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (value <= ratingMax) setRatingMin(value);
                    }}
                    className="absolute w-full h-2 bg-transparent rounded-lg appearance-none pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-0"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Required Amenities */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <div className="mb-3">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Required Amenities
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Select amenities that listings MUST have. We'll also learn your preferences from your swipes.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                "In-unit laundry",
                "Building laundry",
                "Dishwasher",
                "AC",
                "Pet-friendly",
                "Fireplace",
                "Gym",
                "Parking",
                "Pool",
              ].map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => {
                    setRequiredAmenities(prev =>
                      prev.includes(amenity)
                        ? prev.filter(a => a !== amenity)
                        : [...prev, amenity]
                    );
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                    requiredAmenities.includes(amenity)
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          {/* View Type Filter */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <div className="mb-3">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                View Type
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Select the view types you prefer (optional)
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                "City",
                "Water",
                "Park",
                "Garden",
                "Mountain",
                "Skyline",
              ].map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => {
                    setRequiredView(prev =>
                      prev.includes(view)
                        ? prev.filter(v => v !== view)
                        : [...prev, view]
                    );
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                    requiredView.includes(view)
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>

          {/* Neighborhood Filter */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <div className="mb-3">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Neighborhoods
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Select specific neighborhoods you're interested in (optional)
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {[
                "Manhattan",
                "Brooklyn",
                "Queens",
                "Bronx",
                "Staten Island",
                "Upper East Side",
                "Upper West Side",
                "Midtown",
                "Chelsea",
                "Greenwich Village",
                "SoHo",
                "TriBeCa",
                "Financial District",
                "Williamsburg",
                "DUMBO",
                "Park Slope",
                "Astoria",
                "Long Island City",
              ].map((neighborhood) => (
                <button
                  key={neighborhood}
                  type="button"
                  onClick={() => {
                    setRequiredNeighborhoods(prev =>
                      prev.includes(neighborhood)
                        ? prev.filter(n => n !== neighborhood)
                        : [...prev, neighborhood]
                    );
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                    requiredNeighborhoods.includes(neighborhood)
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {neighborhood}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Clear All Button */}
        <div className="mb-4">
          <button
            onClick={handleClearAll}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
          >
            🗑️ Clear All Filters (No Preferences)
          </button>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className={buttonStyles.backTextDark}
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className={buttonStyles.primaryAction}
          >
            Next
          </button>
        </div>
      </motion.div>
    </div>
  );
}

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
  bedroomsMin?: number;
  bedroomsMax?: number;
  bathroomsMin?: number;
  bathroomsMax?: number;
  minRating?: number;
  weights?: ScoringWeights;
}

interface ApartmentPreferencesProps {
  onNext: (preferences: ApartmentPreferencesData) => void;
  onBack?: () => void;
  initialPreferences?: ApartmentPreferencesData;
}

export default function ApartmentPreferences({ onNext, onBack, initialPreferences }: ApartmentPreferencesProps) {
  // State for preferences
  const [priceMin, setPriceMin] = useState<string>(initialPreferences?.priceMin?.toString() || "");
  const [priceMax, setPriceMax] = useState<string>(initialPreferences?.priceMax?.toString() || "");
  const [bedroomsMin, setBedroomsMin] = useState<string>(initialPreferences?.bedroomsMin?.toString() || "");
  const [bedroomsMax, setBedroomsMax] = useState<string>(initialPreferences?.bedroomsMax?.toString() || "");
  const [bathroomsMin, setBathroomsMin] = useState<string>(initialPreferences?.bathroomsMin?.toString() || "");
  const [bathroomsMax, setBathroomsMax] = useState<string>(initialPreferences?.bathroomsMax?.toString() || "");
  const [minRating, setMinRating] = useState<string>(initialPreferences?.minRating?.toString() || "");

  // State for "no preference" toggles
  const [noPricePreference, setNoPricePreference] = useState(!initialPreferences?.priceMin && !initialPreferences?.priceMax);
  const [noBedroomsPreference, setNoBedroomsPreference] = useState(!initialPreferences?.bedroomsMin && !initialPreferences?.bedroomsMax);
  const [noBathroomsPreference, setNoBathroomsPreference] = useState(!initialPreferences?.bathroomsMin && !initialPreferences?.bathroomsMax);
  const [noRatingPreference, setNoRatingPreference] = useState(!initialPreferences?.minRating);

  // State for scoring weights
  const [weightDistance, setWeightDistance] = useState<number>(initialPreferences?.weights?.distance ?? 40);
  const [weightAmenities, setWeightAmenities] = useState<number>(initialPreferences?.weights?.amenities ?? 35);
  const [weightQuality, setWeightQuality] = useState<number>(initialPreferences?.weights?.quality ?? 15);
  const [weightRating, setWeightRating] = useState<number>(initialPreferences?.weights?.rating ?? 10);
  const [useDefaultWeights, setUseDefaultWeights] = useState(!initialPreferences?.weights);

  const [error, setError] = useState("");

  const handleNext = () => {
    setError("");

    // Build preferences object
    const preferences: ApartmentPreferencesData = {};

    // Validate and add price range
    if (!noPricePreference) {
      const minPrice = priceMin ? parseInt(priceMin, 10) : undefined;
      const maxPrice = priceMax ? parseInt(priceMax, 10) : undefined;

      if (minPrice !== undefined && isNaN(minPrice)) {
        setError("Please enter a valid minimum price");
        return;
      }
      if (maxPrice !== undefined && isNaN(maxPrice)) {
        setError("Please enter a valid maximum price");
        return;
      }
      if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
        setError("Minimum price cannot be greater than maximum price");
        return;
      }

      preferences.priceMin = minPrice;
      preferences.priceMax = maxPrice;
    }

    // Validate and add bedroom range
    if (!noBedroomsPreference) {
      const minBedrooms = bedroomsMin ? parseInt(bedroomsMin, 10) : undefined;
      const maxBedrooms = bedroomsMax ? parseInt(bedroomsMax, 10) : undefined;

      if (minBedrooms !== undefined && (isNaN(minBedrooms) || minBedrooms < 0)) {
        setError("Please enter a valid minimum number of bedrooms");
        return;
      }
      if (maxBedrooms !== undefined && (isNaN(maxBedrooms) || maxBedrooms < 0)) {
        setError("Please enter a valid maximum number of bedrooms");
        return;
      }
      if (minBedrooms !== undefined && maxBedrooms !== undefined && minBedrooms > maxBedrooms) {
        setError("Minimum bedrooms cannot be greater than maximum bedrooms");
        return;
      }

      preferences.bedroomsMin = minBedrooms;
      preferences.bedroomsMax = maxBedrooms;
    }

    // Validate and add bathroom range
    if (!noBathroomsPreference) {
      const minBathrooms = bathroomsMin ? parseFloat(bathroomsMin) : undefined;
      const maxBathrooms = bathroomsMax ? parseFloat(bathroomsMax) : undefined;

      if (minBathrooms !== undefined && (isNaN(minBathrooms) || minBathrooms < 0)) {
        setError("Please enter a valid minimum number of bathrooms");
        return;
      }
      if (maxBathrooms !== undefined && (isNaN(maxBathrooms) || maxBathrooms < 0)) {
        setError("Please enter a valid maximum number of bathrooms");
        return;
      }
      if (minBathrooms !== undefined && maxBathrooms !== undefined && minBathrooms > maxBathrooms) {
        setError("Minimum bathrooms cannot be greater than maximum bathrooms");
        return;
      }

      preferences.bathroomsMin = minBathrooms;
      preferences.bathroomsMax = maxBathrooms;
    }

    // Validate and add minimum rating
    if (!noRatingPreference) {
      const ratingNum = minRating ? parseFloat(minRating) : undefined;
      if (ratingNum !== undefined && (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5)) {
        setError("Please enter a valid rating between 0 and 5");
        return;
      }
      preferences.minRating = ratingNum;
    }

    // Validate and add scoring weights (always save, even if using defaults)
    const totalWeight = weightDistance + weightAmenities + weightQuality + weightRating;
    if (!useDefaultWeights && totalWeight !== 100) {
      // Only validate if user customized weights
      setError(`Scoring weights must sum to 100% (currently ${totalWeight}%)`);
      return;
    }

    preferences.weights = {
      distance: weightDistance,
      amenities: weightAmenities,
      quality: weightQuality,
      rating: weightRating,
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
                      setPriceMin("");
                      setPriceMax("");
                    }
                  }}
                  className="rounded"
                />
                No preference
              </label>
            </div>
            {!noPricePreference && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Min ($)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    placeholder="2000"
                    className={inputStyles.standard}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Max ($)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    placeholder="3000"
                    className={inputStyles.standard}
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
                      setBedroomsMin("");
                      setBedroomsMax("");
                    }
                  }}
                  className="rounded"
                />
                No preference
              </label>
            </div>
            {!noBedroomsPreference && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Min</label>
                  <input
                    type="number"
                    value={bedroomsMin}
                    onChange={(e) => setBedroomsMin(e.target.value)}
                    placeholder="1"
                    min="0"
                    step="1"
                    className={inputStyles.standard}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Max</label>
                  <input
                    type="number"
                    value={bedroomsMax}
                    onChange={(e) => setBedroomsMax(e.target.value)}
                    placeholder="3"
                    min="0"
                    step="1"
                    className={inputStyles.standard}
                  />
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
                      setBathroomsMin("");
                      setBathroomsMax("");
                    }
                  }}
                  className="rounded"
                />
                No preference
              </label>
            </div>
            {!noBathroomsPreference && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Min</label>
                  <input
                    type="number"
                    value={bathroomsMin}
                    onChange={(e) => setBathroomsMin(e.target.value)}
                    placeholder="1"
                    min="0"
                    step="0.5"
                    className={inputStyles.standard}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Max</label>
                  <input
                    type="number"
                    value={bathroomsMax}
                    onChange={(e) => setBathroomsMax(e.target.value)}
                    placeholder="2"
                    min="0"
                    step="0.5"
                    className={inputStyles.standard}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Minimum Rating */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Minimum Rating
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={noRatingPreference}
                  onChange={(e) => {
                    setNoRatingPreference(e.target.checked);
                    if (e.target.checked) {
                      setMinRating("");
                    }
                  }}
                  className="rounded"
                />
                No preference
              </label>
            </div>
            {!noRatingPreference && (
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Minimum (0-5 stars)</label>
                <input
                  type="number"
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  placeholder="3.5"
                  min="0"
                  max="5"
                  step="0.5"
                  className={inputStyles.standard}
                />
              </div>
            )}
          </div>

          {/* Scoring Weights */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Match Score Weights
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={useDefaultWeights}
                  onChange={(e) => {
                    setUseDefaultWeights(e.target.checked);
                    if (e.target.checked) {
                      setWeightDistance(40);
                      setWeightAmenities(35);
                      setWeightQuality(15);
                      setWeightRating(10);
                    }
                  }}
                  className="rounded"
                />
                Use defaults
              </label>
            </div>
            {!useDefaultWeights && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Customize how much each factor contributes to your match score. Must sum to 100%.
                </p>

                {/* Distance Weight */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-600 dark:text-gray-400">📍 Distance</label>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">{weightDistance}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={weightDistance}
                    onChange={(e) => setWeightDistance(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600"
                  />
                </div>

                {/* Amenities Weight */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-600 dark:text-gray-400">🌟 Amenities</label>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">{weightAmenities}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={weightAmenities}
                    onChange={(e) => setWeightAmenities(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600"
                  />
                </div>

                {/* Quality Weight */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-600 dark:text-gray-400">📸 Quality</label>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">{weightQuality}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={weightQuality}
                    onChange={(e) => setWeightQuality(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600"
                  />
                </div>

                {/* Rating Weight */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-600 dark:text-gray-400">⭐ Rating</label>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">{weightRating}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={weightRating}
                    onChange={(e) => setWeightRating(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600"
                  />
                </div>

                {/* Total Display */}
                <div className={`flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700 ${
                  weightDistance + weightAmenities + weightQuality + weightRating === 100
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  <span className="text-xs font-medium">Total:</span>
                  <span className="text-sm font-bold">
                    {weightDistance + weightAmenities + weightQuality + weightRating}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

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

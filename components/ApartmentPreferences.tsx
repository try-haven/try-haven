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
  weights?: ScoringWeights;
}

interface ApartmentPreferencesProps {
  onNext: (preferences: ApartmentPreferencesData) => void;
  onBack?: () => void;
  initialPreferences?: ApartmentPreferencesData;
}

export default function ApartmentPreferences({ onNext, onBack, initialPreferences }: ApartmentPreferencesProps) {
  // State for preferences
  const [priceMin, setPriceMin] = useState<number>(initialPreferences?.priceMin || 500);
  const [priceMax, setPriceMax] = useState<number>(initialPreferences?.priceMax || 5000);
  const [selectedBedrooms, setSelectedBedrooms] = useState<number[]>(initialPreferences?.bedrooms || []);
  const [selectedBathrooms, setSelectedBathrooms] = useState<number[]>(initialPreferences?.bathrooms || []);
  const [ratingMin, setRatingMin] = useState<number>(initialPreferences?.ratingMin || 0);
  const [ratingMax, setRatingMax] = useState<number>(initialPreferences?.ratingMax || 5);

  // State for "no preference" toggles
  const [noPricePreference, setNoPricePreference] = useState(initialPreferences?.priceMin === undefined && initialPreferences?.priceMax === undefined);
  const [noBedroomsPreference, setNoBedroomsPreference] = useState(!initialPreferences?.bedrooms || initialPreferences.bedrooms.length === 0);
  const [noBathroomsPreference, setNoBathroomsPreference] = useState(!initialPreferences?.bathrooms || initialPreferences.bathrooms.length === 0);
  const [noRatingPreference, setNoRatingPreference] = useState(initialPreferences?.ratingMin === undefined && initialPreferences?.ratingMax === undefined);

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
      if (priceMin > priceMax) {
        setError("Minimum price cannot be greater than maximum price");
        return;
      }

      preferences.priceMin = priceMin;
      preferences.priceMax = priceMax;
    }

    // Add bedroom selections
    if (!noBedroomsPreference) {
      if (selectedBedrooms.length === 0) {
        setError("Please select at least one bedroom option");
        return;
      }
      preferences.bedrooms = selectedBedrooms;
    }

    // Add bathroom selections
    if (!noBathroomsPreference) {
      if (selectedBathrooms.length === 0) {
        setError("Please select at least one bathroom option");
        return;
      }
      preferences.bathrooms = selectedBathrooms;
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
                <div className="relative pt-1">
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
                    className="absolute w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-600 [&::-moz-range-thumb]:border-0"
                  />
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
                    className="absolute w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-600 [&::-moz-range-thumb]:border-0"
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
                <div className="relative pt-1">
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
                    className="absolute w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-600 [&::-moz-range-thumb]:border-0"
                  />
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
                    className="absolute w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-600 [&::-moz-range-thumb]:border-0"
                  />
                </div>
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

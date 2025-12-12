"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { textStyles, buttonStyles, containerStyles, layoutStyles, inputStyles } from "@/lib/styles";

interface ApartmentPreferencesData {
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqftMin?: number;
  sqftMax?: number;
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
  const [bedrooms, setBedrooms] = useState<string>(initialPreferences?.bedrooms?.toString() || "");
  const [bathrooms, setBathrooms] = useState<string>(initialPreferences?.bathrooms?.toString() || "");
  const [sqftMin, setSqftMin] = useState<string>(initialPreferences?.sqftMin?.toString() || "");
  const [sqftMax, setSqftMax] = useState<string>(initialPreferences?.sqftMax?.toString() || "");

  // State for "no preference" toggles
  const [noPricePreference, setNoPricePreference] = useState(!initialPreferences?.priceMin && !initialPreferences?.priceMax);
  const [noBedroomsPreference, setNoBedroomsPreference] = useState(!initialPreferences?.bedrooms);
  const [noBathroomsPreference, setNoBathroomsPreference] = useState(!initialPreferences?.bathrooms);
  const [noSqftPreference, setNoSqftPreference] = useState(!initialPreferences?.sqftMin && !initialPreferences?.sqftMax);

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

    // Validate and add bedrooms
    if (!noBedroomsPreference) {
      const bedroomsNum = bedrooms ? parseInt(bedrooms, 10) : undefined;
      if (bedroomsNum !== undefined && (isNaN(bedroomsNum) || bedroomsNum < 0)) {
        setError("Please enter a valid number of bedrooms");
        return;
      }
      preferences.bedrooms = bedroomsNum;
    }

    // Validate and add bathrooms
    if (!noBathroomsPreference) {
      const bathroomsNum = bathrooms ? parseFloat(bathrooms) : undefined;
      if (bathroomsNum !== undefined && (isNaN(bathroomsNum) || bathroomsNum < 0)) {
        setError("Please enter a valid number of bathrooms");
        return;
      }
      preferences.bathrooms = bathroomsNum;
    }

    // Validate and add sqft range
    if (!noSqftPreference) {
      const minSqft = sqftMin ? parseInt(sqftMin, 10) : undefined;
      const maxSqft = sqftMax ? parseInt(sqftMax, 10) : undefined;

      if (minSqft !== undefined && isNaN(minSqft)) {
        setError("Please enter a valid minimum square footage");
        return;
      }
      if (maxSqft !== undefined && isNaN(maxSqft)) {
        setError("Please enter a valid maximum square footage");
        return;
      }
      if (minSqft !== undefined && maxSqft !== undefined && minSqft > maxSqft) {
        setError("Minimum square footage cannot be greater than maximum");
        return;
      }

      preferences.sqftMin = minSqft;
      preferences.sqftMax = maxSqft;
    }

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
                      setBedrooms("");
                    }
                  }}
                  className="rounded"
                />
                No preference
              </label>
            </div>
            {!noBedroomsPreference && (
              <input
                type="number"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                placeholder="2"
                min="0"
                step="1"
                className={inputStyles.standard}
              />
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
                      setBathrooms("");
                    }
                  }}
                  className="rounded"
                />
                No preference
              </label>
            </div>
            {!noBathroomsPreference && (
              <input
                type="number"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                placeholder="1"
                min="0"
                step="0.5"
                className={inputStyles.standard}
              />
            )}
          </div>

          {/* Square Footage */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Square Footage
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={noSqftPreference}
                  onChange={(e) => {
                    setNoSqftPreference(e.target.checked);
                    if (e.target.checked) {
                      setSqftMin("");
                      setSqftMax("");
                    }
                  }}
                  className="rounded"
                />
                No preference
              </label>
            </div>
            {!noSqftPreference && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Min (sqft)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={sqftMin}
                    onChange={(e) => setSqftMin(e.target.value)}
                    placeholder="600"
                    className={inputStyles.standard}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Max (sqft)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={sqftMax}
                    onChange={(e) => setSqftMax(e.target.value)}
                    placeholder="1200"
                    className={inputStyles.standard}
                  />
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

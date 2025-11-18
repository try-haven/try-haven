"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type CommuteOption = "car" | "public-transit" | "walk" | "bike";

interface CommutePreferenceProps {
  onNext: (commuteOptions: CommuteOption[]) => void;
  onBack?: () => void;
  initialOptions?: CommuteOption[];
}

export default function CommutePreference({ onNext, onBack, initialOptions }: CommutePreferenceProps) {
  const [selectedOptions, setSelectedOptions] = useState<CommuteOption[]>(initialOptions || []);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newOptions, setNewOptions] = useState<CommuteOption[]>([]);

  const toggleOption = (option: CommuteOption) => {
    setSelectedOptions((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  };

  const handleNext = () => {
    if (selectedOptions.length > 0) {
      if (initialOptions && JSON.stringify(selectedOptions.sort()) !== JSON.stringify(initialOptions.sort())) {
        setNewOptions(selectedOptions);
        setShowConfirm(true);
      } else {
        onNext(selectedOptions);
      }
    }
  };

  const handleConfirm = () => {
    onNext(newOptions);
    setShowConfirm(false);
  };

  const options: { value: CommuteOption; label: string }[] = [
    { value: "car", label: "Car" },
    { value: "public-transit", label: "Public Transit" },
    { value: "walk", label: "Walk" },
    { value: "bike", label: "Bike" },
  ];

  return (
    <div className="min-h-screen bg-indigo-50 dark:bg-gray-900 flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <h2 className="text-gray-900 dark:text-white text-2xl font-bold text-center mb-4">
          How do you plan to commute?
        </h2>
        {initialOptions && initialOptions.length > 0 && (
          <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
            Current: {initialOptions.map(o => options.find(opt => opt.value === o)?.label).join(", ")}
          </p>
        )}

        {/* Options */}
        <div className="space-y-4 mb-8">
          {options.map((option) => {
            const isSelected = selectedOptions.includes(option.value);
            return (
              <button
                key={option.value}
                onClick={() => toggleOption(option.value)}
                className={`w-full py-4 rounded-xl font-semibold transition-all ${
                  isSelected
                    ? "bg-gray-700 dark:bg-gray-600 text-white border-2 border-indigo-400"
                    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {/* Confirmation Dialog */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirm Changes</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current:</p>
                <p className="text-gray-900 dark:text-white">{initialOptions?.map(o => options.find(opt => opt.value === o)?.label).join(", ") || "None"}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 mt-4">New:</p>
                <p className="text-gray-900 dark:text-white">{newOptions.map(o => options.find(opt => opt.value === o)?.label).join(", ")}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    setSelectedOptions(initialOptions || []);
                  }}
                  className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex-1 py-3 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={selectedOptions.length === 0}
            className="flex-1 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </motion.div>
    </div>
  );
}


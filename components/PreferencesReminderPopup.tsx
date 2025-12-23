"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { XIcon } from "@/lib/icons";

interface PreferencesReminderPopupProps {
  show: boolean;
  onDismiss: () => void;
}

export default function PreferencesReminderPopup({ show, onDismiss }: PreferencesReminderPopupProps) {
  const router = useRouter();
  const [neverAskAgain, setNeverAskAgain] = useState(false);

  const handleSetPreferences = () => {
    router.push("/preferences");
    onDismiss();
  };

  const handleDismiss = () => {
    if (neverAskAgain) {
      // Store in localStorage to never show again
      localStorage.setItem("haven_never_ask_preferences", "true");
    }
    onDismiss();
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 relative">
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <XIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>

              {/* Icon */}
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🏠</span>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Set Your Preferences
              </h3>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Help us find your perfect home! Set your location, budget, and other preferences to get personalized apartment recommendations.
              </p>

              {/* Never ask again checkbox */}
              <label className="flex items-center gap-2 mb-6 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={neverAskAgain}
                  onChange={(e) => setNeverAskAgain(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                  Don't ask me again
                </span>
              </label>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleDismiss}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleSetPreferences}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium shadow-lg shadow-blue-500/30"
                >
                  Set Preferences
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

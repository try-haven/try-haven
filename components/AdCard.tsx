"use client";

import { motion } from "framer-motion";

interface AdCardProps {
  onSkip: () => void;
  index: number;
  total: number;
}

export default function AdCard({ onSkip, index, total }: AdCardProps) {
  if (index >= total) return null;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{
        zIndex: total - index + 100, // Higher z-index to ensure it's visible
        pointerEvents: index === 0 ? "auto" : "none",
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: index === 0 ? 1 : 0.5, scale: index === 0 ? 1 : 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full max-w-md mx-auto h-full flex items-center justify-center pointer-events-auto">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 rounded-3xl shadow-2xl overflow-hidden p-8 text-white w-full max-w-md border-4 border-white dark:border-gray-800">
          <div className="text-center">
            <div className="text-4xl mb-4">📦</div>
            <h2 className="text-2xl font-bold mb-2">Moving Services</h2>
            <p className="text-indigo-100 dark:text-indigo-200 mb-6">
              Get 20% off your first move with our trusted partners
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => window.open("https://example.com/moving", "_blank")}
                className="flex-1 py-3 bg-white text-indigo-600 rounded-full font-semibold hover:bg-gray-100 transition-colors"
              >
                Learn More
              </button>
              <button
                onClick={onSkip}
                className="px-6 py-3 bg-white/20 text-white rounded-full font-semibold hover:bg-white/30 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}


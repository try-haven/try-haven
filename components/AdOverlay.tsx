"use client";

import { useState } from "react";

interface AdOverlayProps {
    position?: "bottom-left" | "bottom-right";
}

export default function AdOverlay({ position = "bottom-right" }: AdOverlayProps) {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <div
            className={`fixed ${position === "bottom-right" ? "bottom-4 right-4" : "bottom-4 left-4"} z-40 transition-all duration-300`}
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-3 max-w-[200px]">
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute -top-2 -right-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-1 transition-colors"
                    aria-label="Close ad"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ad</div>
                <div className="bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded p-2 mb-2">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        Moving Services
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                        Get 20% off your first move
                    </div>
                </div>
                <button className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-1.5 transition-colors">
                    Learn More
                </button>
            </div>
        </div>
    );
}


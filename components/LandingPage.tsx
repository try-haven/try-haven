"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-indigo-600">Haven</div>
          <div className="flex items-center gap-4">
            <Link
              href="#features"
              className="text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Features
            </Link>
            <Link
              href="#about"
              className="text-gray-700 hover:text-indigo-600 transition-colors"
            >
              About
            </Link>
            <button
              onClick={onGetStarted}
              className="px-4 py-2 text-gray-700 hover:text-indigo-600 transition-colors border border-gray-300 rounded-full hover:border-indigo-600"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            className="text-6xl md:text-7xl font-bold text-gray-900 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Find Your Perfect
            <span className="block text-indigo-600">Apartment</span>
          </motion.h1>
          
          <motion.p
            className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Swipe through verified apartments, find roommates, and discover your next home.
            Built for students, by students.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-indigo-600 text-white rounded-full text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Start Swiping
            </button>
            <button className="px-8 py-4 bg-white text-indigo-600 rounded-full text-lg font-semibold hover:bg-gray-50 transition-colors border-2 border-indigo-600">
              Upload Listing
            </button>
          </motion.div>
        </div>

        {/* Feature Cards */}
        <motion.div
          id="features"
          className="grid md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🏠</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Swipe to Discover
            </h3>
            <p className="text-gray-600">
              Browse through verified apartment listings with an intuitive swipe interface.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              AI Validated
            </h3>
            <p className="text-gray-600">
              All listings are verified by AI to ensure quality and authenticity.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Roommate Matching
            </h3>
            <p className="text-gray-600">
              Find compatible roommates based on your preferences and lifestyle.
            </p>
          </div>
        </motion.div>

        {/* About Section */}
        <motion.div
          id="about"
          className="mt-20 max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Apartment Hunting Made Simple
          </h2>
          <p className="text-lg text-gray-600">
            Haven is the modern way to find your next apartment. Swipe through verified listings,
            get personalized recommendations, and connect with potential roommates—all in one place.
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20 py-8">
        <div className="container mx-auto px-6 text-center text-gray-600">
          <p>&copy; 2024 Haven. Built for students, by students.</p>
        </div>
      </footer>
    </div>
  );
}



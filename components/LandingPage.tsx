"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import DarkModeToggle from "./DarkModeToggle";
import HavenLogo from "./HavenLogo";
import { textStyles, buttonStyles, containerStyles, layoutStyles } from "@/lib/styles";

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className={containerStyles.page}>
      {/* Navigation */}
      <nav className={layoutStyles.containerNav}>
        <div className={layoutStyles.flexBetween}>
          <div className={layoutStyles.flexGap}>
            <HavenLogo size="sm" showAnimation={false} />
            <div className={textStyles.headingBrandSmall}>Haven</div>
          </div>
          <div className={layoutStyles.flexGap4}>
            <Link
              href="#features"
              className={buttonStyles.nav}
            >
              Features
            </Link>
            <Link
              href="#about"
              className={buttonStyles.nav}
            >
              About
            </Link>
            <DarkModeToggle />
            <button
              onClick={onGetStarted}
              className={buttonStyles.navBordered}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className={layoutStyles.containerHero}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            className="text-6xl md:text-7xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className={textStyles.heading}>Find Your Perfect</span>
            <span className={`block ${textStyles.brand}`}>Apartment</span>
          </motion.h1>
          
          <motion.p
            className={textStyles.subtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Swipe through personalized apartment listings tailored to your preferences and discover your next home.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <button
              onClick={onGetStarted}
              className={buttonStyles.primary}
            >
              Start Swiping
            </button>
            <button className={buttonStyles.secondary}>
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
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🏠</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Swipe to Discover
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Browse through verified apartment listings with an intuitive swipe interface.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              AI Validated
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              All listings are verified by AI to ensure quality and authenticity.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Personalized Listings
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Get recommendations tailored to your location, commute, and lifestyle preferences.
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
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Apartment Hunting Made Simple
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Haven is the modern way to find your next apartment. Swipe through personalized listings
            based on your preferences, leave reviews, and discover the perfect place to call home.
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-20 py-8">
        <div className="container mx-auto px-6 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2024 Haven.</p>
        </div>
      </footer>
    </div>
  );
}



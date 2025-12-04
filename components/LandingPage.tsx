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
            <span className={textStyles.heading}>Your Next</span>
            <span className={`block ${textStyles.brand}`}>Home Awaits</span>
          </motion.h1>

          <motion.p
            className={textStyles.subtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Find your perfect apartment or showcase your property to qualified renters. Haven makes apartment hunting and listing simple.
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
              Get Started
            </button>
          </motion.div>
          <motion.p
            className="text-sm text-gray-600 dark:text-gray-400 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            Whether you're searching for an apartment or listing one, Haven has you covered
          </motion.p>
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
              For Renters
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Swipe through personalized listings, save favorites, and leave reviews to help others.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🏢</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              For Managers
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              List your properties and track real-time metrics on views, likes, and engagement.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Data-Driven Insights
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Managers see detailed analytics while renters get personalized recommendations.
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
            One Platform, Two Perspectives
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
            Haven connects apartment seekers with property managers through an intuitive, modern platform.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Renters swipe through personalized listings and leave reviews. Managers showcase properties
            and track engagement metrics. Everyone finds what they're looking for.
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-20 py-8">
        <div className="container mx-auto px-6 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2025 Haven.</p>
        </div>
      </footer>
    </div>
  );
}



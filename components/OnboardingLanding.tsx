"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import DarkModeToggle from "./DarkModeToggle";
import HavenLogo from "./HavenLogo";
import { useUser } from "@/contexts/UserContext";

interface OnboardingLandingProps {
  onSignUp: () => void;
  onLogIn: () => void;
  onBack?: () => void;
}

export default function OnboardingLanding({ onSignUp, onLogIn, onBack }: OnboardingLandingProps) {
  const { signUp, logIn, isLoggedIn } = useUser();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // If already logged in, proceed to next step
  if (isLoggedIn) {
    onSignUp();
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSignUp) {
      if (!email || !username || !password) {
        setError("Please fill in all fields");
        return;
      }
      const success = signUp(email, username, password);
      if (success) {
        onSignUp();
      } else {
        setError("An account with this email or username already exists. Please log in instead.");
      }
    } else {
      if (!username || !password) {
        setError("Please fill in all fields");
        return;
      }
      const success = logIn(username, password);
      if (success) {
        onLogIn();
      } else {
        setError("Invalid username or password");
      }
    }
  };
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center px-6 relative">
      {/* Dark Mode Toggle */}
      <div className="absolute top-6 right-6">
        <DarkModeToggle />
      </div>

      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-200 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <HavenLogo size="md" showAnimation={true} />
      </motion.div>

      {/* App Name */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-5xl font-bold text-indigo-600 dark:text-indigo-400 mb-4"
      >
        Haven
      </motion.h1>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-gray-700 dark:text-white text-lg mb-12 text-center"
      >
        Search. Connect. Move.
      </motion.p>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="w-full max-w-sm space-y-4"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required={isSignUp}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required={isSignUp}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This will be displayed in your reviews and comments
                </p>
              </div>
            </>
          )}
          {!isSignUp && (
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username or Email"
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          )}
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <button
            type="submit"
            className="w-full py-4 bg-indigo-600 dark:bg-indigo-400 text-white dark:text-gray-900 rounded-xl font-semibold text-lg hover:bg-indigo-700 dark:hover:bg-indigo-300 transition-colors"
          >
            {isSignUp ? "Sign Up" : "Log In"}
          </button>
        </form>
        <div className="text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            {isSignUp ? "Already have an account? Log in" : "Don't have an account? Sign up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}


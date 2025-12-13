"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import DarkModeToggle from "./DarkModeToggle";
import HavenLogo from "./HavenLogo";
import { useUser } from "@/contexts/UserContext";
import { textStyles, inputStyles, buttonStyles } from "@/lib/styles";
import { EyeIcon, EyeSlashIcon, ChevronLeftIcon } from "@/lib/icons";

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
  const [userType, setUserType] = useState<"searcher" | "manager">("searcher");
  const [error, setError] = useState("");
  const [justSignedUp, setJustSignedUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // If already logged in when component mounts, proceed to login flow
  // But NOT if we just signed up (that's handled by the signup button)
  useEffect(() => {
    if (isLoggedIn && !justSignedUp) {
      onLogIn();
    }
  }, [isLoggedIn, onLogIn, justSignedUp]);

  // If already logged in, don't render the form
  if (isLoggedIn) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSignUp) {
      if (!email || !username || !password) {
        setError("Please fill in all fields");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      const result = await signUp(email, username, password, userType);
      if (result.success) {
        setJustSignedUp(true);
        onSignUp();
      } else {
        setError(result.error || "Signup failed. Please try again.");
      }
    } else {
      if (!username || !password) {
        setError("Please fill in all fields");
        return;
      }
      const result = await logIn(username, password);
      if (result.success) {
        onLogIn();
      } else {
        setError(result.error || "Invalid username or password");
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
          className={`absolute top-6 left-6 ${buttonStyles.icon}`}
        >
          <ChevronLeftIcon />
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
        className={`${textStyles.headingBrand} mb-4`}
      >
        Haven
      </motion.h1>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className={textStyles.tagline}
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
                <label className={inputStyles.label}>
                  I am a...
                </label>
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setUserType("searcher")}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                      userType === "searcher"
                        ? "border-blue-500 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">🔍</div>
                      <div className="font-semibold">Apartment Searcher</div>
                      <div className="text-xs opacity-70 mt-1">Find your perfect home</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType("manager")}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                      userType === "manager"
                        ? "border-blue-500 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">🏢</div>
                      <div className="font-semibold">Property Manager</div>
                      <div className="text-xs opacity-70 mt-1">List your properties</div>
                    </div>
                  </button>
                </div>
              </div>
              <div>
                <label className={inputStyles.label}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className={inputStyles.standard}
                  required={isSignUp}
                />
              </div>
              <div>
                <label className={inputStyles.label}>
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className={inputStyles.standard}
                  required={isSignUp}
                />
                <p className={`${textStyles.helperWithMargin}`}>
                  This will be displayed in your {userType === "manager" ? "listings" : "reviews and comments"}
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
                className={inputStyles.standard}
                required
              />
            </div>
          )}
          <div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className={inputStyles.standard}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={buttonStyles.iconInput}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeIcon /> : <EyeSlashIcon />}
              </button>
            </div>
            {isSignUp && (
              <p className={`${textStyles.helperWithMargin}`}>
                Must be at least 6 characters
              </p>
            )}
          </div>
          {error && (
            <div className={textStyles.error}>{error}</div>
          )}
          <button
            type="submit"
            className={buttonStyles.primaryFull}
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
            className={buttonStyles.link}
          >
            {isSignUp ? "Already have an account? Log in" : "Don't have an account? Sign up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}


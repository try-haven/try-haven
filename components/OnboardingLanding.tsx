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
  const [apartmentComplexName, setApartmentComplexName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [error, setError] = useState("");
  const [justSignedUp, setJustSignedUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Auto-populate username from apartment complex name for managers
  // Normalize by removing spaces and special characters, converting to lowercase
  useEffect(() => {
    if (isSignUp && userType === "manager" && apartmentComplexName) {
      // Convert "The Oaks Apartments" → "theoaksapartments"
      const normalizedUsername = apartmentComplexName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ''); // Remove all non-alphanumeric characters
      setUsername(normalizedUsername);
    }
  }, [isSignUp, userType, apartmentComplexName]);

  // Redirect is now handled by the home page's useEffect
  // Removed the auto-login effect to prevent navigation loops

  // If already logged in, don't render the form
  if (isLoggedIn) {
    return null;
  }

  // Helper function to validate manager email domain matches apartment complex name
  const validateManagerEmail = (email: string, complexName: string): boolean => {
    // Extract domain from email (e.g., "john@oaksapartments.com" -> "oaksapartments")
    const emailParts = email.toLowerCase().split('@');
    if (emailParts.length !== 2) return false;

    const domain = emailParts[1].split('.')[0]; // Get the main domain part before TLD

    // Normalize complex name: remove spaces, special chars, convert to lowercase
    const normalizedComplex = complexName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ''); // Remove all non-alphanumeric characters

    // Check if domain contains the normalized complex name or vice versa
    // This handles cases like:
    // - "The Oaks Apartments" -> "theoaksapartments" matches domain "oaksapartments"
    // - "john@oaksapartments.com" matches "Oaks Apartments"
    const domainClean = domain.replace(/[^a-z0-9]/g, '');

    return domainClean.includes(normalizedComplex) || normalizedComplex.includes(domainClean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSignUp) {
      if (!email || !username || !password) {
        setError("Please fill in all fields");
        return;
      }
      if (userType === "manager" && !apartmentComplexName.trim()) {
        setError("Please enter your apartment complex name");
        return;
      }
      if (userType === "manager" && (!city.trim() || !state.trim() || !neighborhood.trim())) {
        setError("Please enter the city, state, and neighborhood of your apartment complex");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      // Validate manager email domain matches apartment complex name
      if (userType === "manager") {
        if (!validateManagerEmail(email, apartmentComplexName)) {
          setError(
            "Your email domain must match your apartment complex name for verification. " +
            "If you're unable to use a matching email, please contact us at havenaptsearch@gmail.com to verify your account."
          );
          return;
        }
      }

      const result = await signUp(email, username, password, userType, apartmentComplexName, city, state, neighborhood);
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
              {userType === "manager" && (
                <>
                  <div>
                    <label className={inputStyles.label}>
                      Apartment Complex Name
                    </label>
                    <input
                      type="text"
                      value={apartmentComplexName}
                      onChange={(e) => setApartmentComplexName(e.target.value)}
                      placeholder="e.g., The Oaks Apartments"
                      className={inputStyles.standard}
                      required
                    />
                    <p className={`${textStyles.helperWithMargin}`}>
                      Your email domain must match your complex name for verification
                    </p>
                  </div>
                  <div>
                    <label className={inputStyles.label}>
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g., New York"
                      className={inputStyles.standard}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={inputStyles.label}>
                        State
                      </label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value.toUpperCase())}
                        placeholder="e.g., NY"
                        className={inputStyles.standard}
                        required
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <label className={inputStyles.label}>
                        Neighborhood
                      </label>
                      <input
                        type="text"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        placeholder="e.g., Manhattan"
                        className={inputStyles.standard}
                        required
                      />
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className={inputStyles.label}>
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={userType === "manager" ? "Auto-populated from complex name" : "Choose a username"}
                  className={inputStyles.standard}
                  required={isSignUp}
                  readOnly={userType === "manager"}
                />
                <p className={`${textStyles.helperWithMargin}`}>
                  {userType === "manager"
                    ? "Your username is auto-generated from your complex name (lowercase, no spaces). Use this to log in."
                    : "This will be displayed in your reviews and comments"}
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


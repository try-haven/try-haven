"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

// Dynamically import the map component to avoid SSR issues
const MapView = dynamic(() => import("./MapView"), { ssr: false });

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    suburb?: string;
    neighbourhood?: string;
  };
}

interface AddressInputProps {
  onNext: (address: string) => void;
  onBack?: () => void;
  initialAddress?: string;
}

export default function AddressInput({ onNext, onBack, initialAddress }: AddressInputProps) {
  const [address, setAddress] = useState(initialAddress || "");
  const [showConfirm, setShowConfirm] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Format address to be simpler and cleaner
  const formatAddress = (suggestion: AddressSuggestion): string => {
    const addr = suggestion.address || {};
    const parts: string[] = [];
    
    // Priority: neighbourhood/suburb > city/town/village > state
    if (addr.neighbourhood) parts.push(addr.neighbourhood);
    else if (addr.suburb) parts.push(addr.suburb);
    
    if (addr.city) parts.push(addr.city);
    else if (addr.town) parts.push(addr.town);
    else if (addr.village) parts.push(addr.village);
    
    if (addr.state && !parts.includes(addr.state)) {
      parts.push(addr.state);
    }
    
    // If we have parts, join them; otherwise use a simplified display_name
    if (parts.length > 0) {
      return parts.join(", ");
    }
    
    // Fallback: simplify display_name by taking first part before comma
    const simplified = suggestion.display_name.split(",")[0].trim();
    return simplified;
  };

  // Get current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                "User-Agent": "Haven App"
              }
            }
          );
          const data = await response.json();
          
          if (data.display_name) {
            const formattedAddress = formatAddress(data);
            setAddress(formattedAddress);
            setSelectedLocation({ lat: latitude, lng: longitude });
          } else {
            setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            setSelectedLocation({ lat: latitude, lng: longitude });
          }
        } catch (error) {
          console.error("Error reverse geocoding:", error);
          setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          setSelectedLocation({ lat: latitude, lng: longitude });
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to get your location. Please enter an address manually.");
        setIsGettingLocation(false);
      }
    );
  };

  // Fetch address suggestions from Nominatim (OpenStreetMap)
  useEffect(() => {
    if (address.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5&addressdetails=1`,
          {
            headers: {
              "User-Agent": "Haven App"
            }
          }
        );
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // Debounce for 300ms

    return () => clearTimeout(timeoutId);
  }, [address]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    const formattedAddress = formatAddress(suggestion);
    setAddress(formattedAddress);
    setSelectedLocation({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    });
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleNext();
  };

  const handleNext = () => {
    if (address.trim()) {
      if (initialAddress && address.trim() !== initialAddress) {
        setNewAddress(address.trim());
        setShowConfirm(true);
      } else {
        // If address hasn't changed but we have an initial address, still proceed
        // This allows users to keep their current address
        onNext(address.trim() || initialAddress);
      }
    } else if (initialAddress) {
      // If no new address entered but we have an initial address, keep the current one
      onNext(initialAddress);
    }
  };

  const handleConfirm = () => {
    onNext(newAddress);
    setShowConfirm(false);
  };

  return (
    <div className="min-h-screen bg-indigo-50 dark:bg-gray-900 flex flex-col py-8 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl mx-auto"
      >
        {/* Header */}
        <h2 className="text-indigo-300 dark:text-indigo-300 text-xl text-center mb-6">
          {initialAddress ? "Update your desired neighborhood or work address" : "Enter your desired neighborhood or work address"}
        </h2>

        {/* Current Address Display - More Prominent */}
        {initialAddress && (
          <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-indigo-300 dark:border-indigo-600 shadow-lg">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Current Address</p>
            <p className="text-lg text-gray-900 dark:text-white font-bold">{initialAddress}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left side - Input and suggestions */}
          <div className="space-y-4">
            {/* Current Location Button */}
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isGettingLocation}
              className="w-full py-3 px-4 bg-indigo-500 dark:bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-600 dark:hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGettingLocation ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Getting location...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Use Current Location</span>
                </>
              )}
            </button>

            <div className="text-center text-indigo-200 dark:text-indigo-300 text-sm">or</div>

            {/* Confirmation Dialog */}
            {showConfirm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirm Changes</h3>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current:</p>
                    <p className="text-gray-900 dark:text-white">{initialAddress || "None"}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 mt-4">New:</p>
                    <p className="text-gray-900 dark:text-white">{newAddress}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowConfirm(false);
                        setAddress(initialAddress || "");
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


            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  placeholder="Search for an address..."
                  className="w-full px-4 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  autoFocus
                />
                
                {/* Loading indicator */}
                {isLoading && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}

                {/* Suggestions dropdown */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      ref={suggestionsRef}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto"
                    >
                      {suggestions.map((suggestion, index) => {
                        const formattedAddress = formatAddress(suggestion);
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                          >
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {formattedAddress}
                            </div>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="flex-1 py-3 text-indigo-300 dark:text-indigo-300 hover:text-indigo-200 dark:hover:text-indigo-200 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNext();
                  }}
                  disabled={!address.trim() && !initialAddress}
                  className="flex-1 py-3 bg-indigo-400 dark:bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-300 dark:hover:bg-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </form>
          </div>

          {/* Right side - Map */}
          <div className="h-96 md:h-[500px] rounded-xl overflow-hidden shadow-xl border-2 border-gray-300 dark:border-gray-600">
            {selectedLocation ? (
              <MapView
                lat={selectedLocation.lat}
                lng={selectedLocation.lng}
                address={address}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <svg
                    className="w-16 h-16 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <p>Select an address to see it on the map</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

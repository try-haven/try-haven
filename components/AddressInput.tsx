"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { textStyles, buttonStyles, containerStyles, layoutStyles, inputStyles } from "@/lib/styles";

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
        onNext(address.trim());
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
    <div className={`${containerStyles.pageIndigo} flex flex-col py-8 px-6`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl mx-auto"
      >
        {/* Header */}
        <h2 className={`${textStyles.brandLight} text-xl text-center mb-6`}>
          {initialAddress ? "Update your desired neighborhood or work address" : "Enter your desired neighborhood or work address"}
        </h2>

        {/* Current Address Display - More Prominent */}
        {initialAddress && (
          <div className={`mb-6 ${containerStyles.sectionHighlight}`}>
            <p className={inputStyles.labelSmall}>Current Address</p>
            <p className={`${textStyles.heading} text-lg font-bold`}>{initialAddress}</p>
          </div>
        )}

        <div className={layoutStyles.grid2Col}>
          {/* Left side - Input and suggestions */}
          <div className={layoutStyles.spaceY4}>
            {/* Current Location Button */}
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isGettingLocation}
              className={buttonStyles.location}
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

            <div className={`text-center ${textStyles.brandLight} text-sm`}>or</div>

            {/* Confirmation Dialog */}
            {showConfirm && (
              <div className={containerStyles.dialogOverlay}>
                <div className={containerStyles.dialog}>
                  <h3 className={`${textStyles.headingSmall} mb-4`}>Confirm Changes</h3>
                  <div className="mb-4">
                    <p className={`${textStyles.bodySmall} mb-2`}>Current:</p>
                    <p className={textStyles.heading}>{initialAddress || "None"}</p>
                    <p className={`${textStyles.bodySmall} mb-2 mt-4`}>New:</p>
                    <p className={textStyles.heading}>{newAddress}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowConfirm(false);
                        setAddress(initialAddress || "");
                      }}
                      className={buttonStyles.secondaryCancel}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirm}
                      className={buttonStyles.primaryConfirm}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}


            {/* Input Form */}
            <form onSubmit={handleSubmit} className={layoutStyles.spaceY4}>
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
                  className={inputStyles.standardLarge}
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
                      className={containerStyles.dropdown}
                    >
                      {suggestions.map((suggestion, index) => {
                        const formattedAddress = formatAddress(suggestion);
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className={containerStyles.dropdownItem}
                          >
                            <div className={`${textStyles.bodySmall} font-medium`}>
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
                    className={buttonStyles.backText}
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
                  className={buttonStyles.primaryAction}
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

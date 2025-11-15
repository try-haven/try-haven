"use client";

import { ApartmentListing } from "@/lib/data";
import Image from "next/image";
import { useState } from "react";

interface LikedListingsProps {
  likedListings: ApartmentListing[];
  onBack: () => void;
  onRemoveLike: (listingId: string) => void;
}

export default function LikedListings({ likedListings, onBack, onRemoveLike }: LikedListingsProps) {
  const [selectedListing, setSelectedListing] = useState<ApartmentListing | null>(null);
  const [imageIndex, setImageIndex] = useState(0);

  if (likedListings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-indigo-600">Haven</h1>
            <button
              onClick={onBack}
              className="px-4 py-2 text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Back to Swiping
            </button>
          </div>
          <div className="flex flex-col items-center justify-center min-h-[600px] text-center p-8 bg-white rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              No liked listings yet
            </h2>
            <p className="text-gray-600 mb-6">
              Start swiping to like apartments you&apos;re interested in!
            </p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-colors"
            >
              Start Swiping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedListing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setSelectedListing(null)}
              className="px-4 py-2 text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to List
            </button>
            <h1 className="text-3xl font-bold text-indigo-600">Haven</h1>
            <div className="w-24"></div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Image Carousel */}
            <div className="relative h-96 bg-gray-200">
              <Image
                src={selectedListing.images[imageIndex]}
                alt={selectedListing.title}
                fill
                className="object-cover"
              />
              
              {selectedListing.images.length > 1 && (
                <>
                  <div className="absolute top-4 left-4 right-4 flex gap-2">
                    {selectedListing.images.map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 h-1 rounded-full ${
                          i === imageIndex ? "bg-white" : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setImageIndex((prev) => (prev - 1 + selectedListing.images.length) % selectedListing.images.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setImageIndex((prev) => (prev + 1) % selectedListing.images.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Details */}
            <div className="p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedListing.title}</h2>
                  <p className="text-gray-600">{selectedListing.address}</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-indigo-600">
                    ${selectedListing.price.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">/month</div>
                </div>
              </div>

              <div className="flex gap-4 text-lg text-gray-600 mb-6">
                <span>{selectedListing.bedrooms} bed{selectedListing.bedrooms !== 1 ? "s" : ""}</span>
                <span>•</span>
                <span>{selectedListing.bathrooms} bath{selectedListing.bathrooms !== 1 ? "s" : ""}</span>
                <span>•</span>
                <span>{selectedListing.sqft.toLocaleString()} sqft</span>
              </div>

              <p className="text-gray-700 mb-6 text-lg leading-relaxed">{selectedListing.description}</p>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedListing.amenities.map((amenity, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 flex items-center justify-between">
                <p className="text-gray-600">
                  <span className="font-semibold">Available from:</span>{" "}
                  {new Date(selectedListing.availableFrom).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <button
                  onClick={() => {
                    onRemoveLike(selectedListing.id);
                    setSelectedListing(null);
                  }}
                  className="px-6 py-3 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Remove from Liked
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">Haven</h1>
          <div className="flex gap-4">
            <button
              onClick={onBack}
              className="px-4 py-2 text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Back to Swiping
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Your Liked Listings ({likedListings.length})
          </h2>
          <p className="text-gray-600">Apartments you&apos;ve swiped right on</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {likedListings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow relative group"
            >
              <div
                onClick={() => {
                  setSelectedListing(listing);
                  setImageIndex(0);
                }}
                className="cursor-pointer"
              >
                <div className="relative h-48 bg-gray-200">
                  <Image
                    src={listing.images[0]}
                    alt={listing.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{listing.title}</h3>
                    <div className="text-xl font-bold text-indigo-600">
                      ${listing.price.toLocaleString()}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-1">{listing.address}</p>
                  <div className="flex gap-2 text-xs text-gray-500 mb-3">
                    <span>{listing.bedrooms} bed</span>
                    <span>•</span>
                    <span>{listing.bathrooms} bath</span>
                    <span>•</span>
                    <span>{listing.sqft.toLocaleString()} sqft</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {listing.amenities.slice(0, 2).map((amenity, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                      >
                        {amenity}
                      </span>
                    ))}
                    {listing.amenities.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        +{listing.amenities.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {/* Remove button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveLike(listing.id);
                }}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Remove from liked"
                title="Remove from liked"
              >
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


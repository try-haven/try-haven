"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getAllListings, Listing } from "@/lib/listings";
import { ApartmentListing } from "@/lib/data";

interface ListingsContextType {
  listings: ApartmentListing[];
  isLoading: boolean;
  refreshListings: () => Promise<void>;
}

const ListingsContext = createContext<ListingsContextType | undefined>(undefined);

export function ListingsProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState<ApartmentListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadListings = async () => {
    setIsLoading(true);
    try {
      console.log('[ListingsContext] Loading listings...');
      const supabaseListings = await getAllListings();
      console.log('[ListingsContext] Loaded', supabaseListings.length, 'listings');

      const convertedListings: ApartmentListing[] = supabaseListings.map(listing => ({
        id: listing.id,
        title: listing.title,
        address: listing.address,
        latitude: listing.latitude ? Number(listing.latitude) : undefined,
        longitude: listing.longitude ? Number(listing.longitude) : undefined,
        price: Number(listing.price),
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        sqft: listing.sqft,
        images: listing.images || [],
        amenities: listing.amenities || [],
        description: listing.description,
        availableFrom: listing.available_from,
        averageRating: listing.average_rating ? Number(listing.average_rating) : undefined,
        totalRatings: listing.total_ratings || undefined,
      }));
      setListings(convertedListings);
    } catch (error) {
      console.error("[ListingsContext] Error loading listings:", error);
      // Set empty array on error so the UI doesn't get stuck
      setListings([]);
    } finally {
      setIsLoading(false);
      console.log('[ListingsContext] Loading complete');
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const refreshListings = async () => {
    await loadListings();
  };

  return (
    <ListingsContext.Provider value={{ listings, isLoading, refreshListings }}>
      {children}
    </ListingsContext.Provider>
  );
}

export function useListings() {
  const context = useContext(ListingsContext);
  if (context === undefined) {
    throw new Error("useListings must be used within a ListingsProvider");
  }
  return context;
}

"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
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
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Safety timeout: force loading to false after 20 seconds
  const setLoadingWithTimeout = useCallback((loading: boolean) => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    setIsLoading(loading);

    if (loading) {
      loadingTimeoutRef.current = setTimeout(() => {
        console.warn('[ListingsContext] Loading timeout reached - forcing loading to false');
        setIsLoading(false);
        loadingTimeoutRef.current = null;
      }, 20000); // 20 second timeout (listings can be slow to load)
    }
  }, []);

  const loadListings = useCallback(async (retryCount = 0) => {
    setLoadingWithTimeout(true);
    try {
      console.log('[ListingsContext] Loading listings...', retryCount > 0 ? `(retry ${retryCount})` : '');
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

      // Retry up to 2 times on failure
      if (retryCount < 2) {
        console.log('[ListingsContext] Retrying listings load...');
        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5 seconds
        return loadListings(retryCount + 1);
      }

      // After all retries failed, set empty array so UI doesn't get stuck
      console.error('[ListingsContext] All retries failed, setting empty listings');
      setListings([]);
    } finally {
      setLoadingWithTimeout(false);
      console.log('[ListingsContext] Loading complete');
    }
  }, [setLoadingWithTimeout]);

  useEffect(() => {
    loadListings();

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
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

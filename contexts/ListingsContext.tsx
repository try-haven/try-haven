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
      const supabaseListings = await getAllListings();
      const convertedListings: ApartmentListing[] = supabaseListings.map(listing => ({
        id: listing.id,
        title: listing.title,
        address: listing.address,
        price: Number(listing.price),
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        sqft: listing.sqft,
        images: listing.images || [],
        amenities: listing.amenities || [],
        description: listing.description,
        availableFrom: listing.available_from,
      }));
      setListings(convertedListings);
    } catch (error) {
      console.error("Error loading listings:", error);
      setListings([]);
    } finally {
      setIsLoading(false);
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

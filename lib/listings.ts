import { supabase } from './supabase';
import { geocodeAddress } from './geocoding';
import { NYCApartmentListing } from './data';

// Types
export interface Listing {
  id: string;
  manager_id: string;
  title: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  images: string[];
  amenities: string[];
  description: string;
  available_from: string;
  latitude?: number;
  longitude?: number;
  average_rating?: number;
  total_ratings?: number;
  created_at?: string;
  updated_at?: string;
}

// Database schema for listings_nyc table (snake_case with unusual column names)
export interface ListingNYC {
  "Unit ID": number;
  "Manager ID": number;
  "Title": string;
  "Address": string;
  "State": string;
  "City": string;
  "Neighborhood": string;
  "Price": number;
  "Date Listed": string;
  "Date Available": string;
  "Bedrooms": string; // Note: stored as string in DB
  "Bathrooms": number;
  "Sqft": number;
  "Year Built": number;
  "Renovation Year": number | null;
  "Washer/Dryer in unit": string; // "0" or "1"
  "Washer/Dryer in building": string;
  "Dishwasher": string;
  "AC": string;
  "Pets": number; // Already numeric
  "Fireplace": string;
  "Gym": number;
  "Parking": number;
  "Pool": string;
  "Outdoor Area": string;
  "View": string;
  images?: string[]; // Array of image URLs
  description?: string; // Detailed description
  latitude?: number;
  longitude?: number;
  average_rating?: number;
  total_ratings?: number;
  created_at?: string;
  updated_at?: string;
}

// Helper: Convert "0"/"1" strings to boolean
function parseBoolean(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return value === 1;
  return value === '1';
}

// Helper: Safely parse bedrooms (can be "0", "1", etc.)
function parseBedrooms(value: string | number): number {
  if (typeof value === 'number') return value;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
}

// Convert NYC listing from DB format to UI format
function convertNYCListing(dbListing: ListingNYC): NYCApartmentListing {
  return {
    id: dbListing["Unit ID"].toString(),
    unitId: dbListing["Unit ID"],
    managerId: dbListing["Manager ID"],
    title: dbListing["Title"],
    address: dbListing["Address"],
    state: dbListing["State"],
    city: dbListing["City"],
    neighborhood: dbListing["Neighborhood"],
    latitude: dbListing.latitude,
    longitude: dbListing.longitude,
    price: dbListing["Price"],
    dateListedOnDB: dbListing["Date Listed"],
    dateAvailable: dbListing["Date Available"],
    bedrooms: parseBedrooms(dbListing["Bedrooms"]),
    bathrooms: dbListing["Bathrooms"],
    sqft: dbListing["Sqft"],
    yearBuilt: dbListing["Year Built"],
    renovationYear: dbListing["Renovation Year"],
    amenities: {
      washerDryerInUnit: parseBoolean(dbListing["Washer/Dryer in unit"]),
      washerDryerInBuilding: parseBoolean(dbListing["Washer/Dryer in building"]),
      dishwasher: parseBoolean(dbListing["Dishwasher"]),
      ac: parseBoolean(dbListing["AC"]),
      pets: parseBoolean(dbListing["Pets"]),
      fireplace: parseBoolean(dbListing["Fireplace"]),
      gym: parseBoolean(dbListing["Gym"]),
      parking: parseBoolean(dbListing["Parking"]),
      pool: parseBoolean(dbListing["Pool"]),
      outdoorArea: dbListing["Outdoor Area"] || null,
      view: dbListing["View"] || null,
    },
    images: dbListing.images || [], // Load images from database
    description: dbListing.description || `${dbListing["Bedrooms"]} bedroom apartment in ${dbListing["Neighborhood"]}, ${dbListing["City"]}`, // Use DB description or fallback
    averageRating: dbListing.average_rating,
    totalRatings: dbListing.total_ratings,
  };
}

// Convert old Listing format to NYCApartmentListing format (fallback)
function convertOldListingToNYC(listing: Listing): NYCApartmentListing {
  // Parse amenities array to binary amenities
  const amenitiesLower = listing.amenities.map(a => a.toLowerCase());
  const hasAmenity = (keywords: string[]) =>
    keywords.some(keyword => amenitiesLower.some(a => a.includes(keyword)));

  return {
    id: listing.id,
    unitId: parseInt(listing.id, 10) || 0, // Parse id as number for unitId
    managerId: parseInt(listing.manager_id || '0', 10) || 0,
    title: listing.title,
    address: listing.address,
    latitude: listing.latitude,
    longitude: listing.longitude,
    price: listing.price,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    sqft: listing.sqft,
    state: 'NY', // Default to NY for old listings
    city: 'New York', // Default to New York
    neighborhood: 'Manhattan', // Default neighborhood
    yearBuilt: 2000, // Default year
    renovationYear: null,
    dateListedOnDB: listing.created_at || new Date().toISOString(),
    dateAvailable: listing.available_from,
    amenities: {
      washerDryerInUnit: hasAmenity(['in-unit laundry', 'washer', 'dryer in unit']),
      washerDryerInBuilding: hasAmenity(['laundry', 'washer/dryer in building']),
      dishwasher: hasAmenity(['dishwasher']),
      ac: hasAmenity(['ac', 'air conditioning', 'central air']),
      pets: hasAmenity(['pet', 'dog', 'cat']),
      fireplace: hasAmenity(['fireplace']),
      gym: hasAmenity(['gym', 'fitness']),
      parking: hasAmenity(['parking', 'garage']),
      pool: hasAmenity(['pool', 'swimming']),
      outdoorArea: hasAmenity(['balcony', 'patio', 'terrace']) ? 'Balcony' : null,
      view: hasAmenity(['view', 'skyline', 'waterfront']) ? 'City' : null,
    },
    images: listing.images || [],
    description: listing.description || '',
    averageRating: listing.average_rating,
    totalRatings: listing.total_ratings,
  };
}

// Fetch all NYC listings from listings_nyc table
export async function getAllListingsNYC(): Promise<NYCApartmentListing[]> {
  try {
    console.log('[getAllListingsNYC] Starting query to listings_nyc table...');

    const { data, error } = await supabase
      .from('listings_nyc')
      .select('*')
      .order('Unit ID', { ascending: true });

    console.log('[getAllListingsNYC] Query completed');
    console.log('[getAllListingsNYC] Error:', error);
    console.log('[getAllListingsNYC] Data count:', data?.length || 0);

    if (error) {
      console.error('[getAllListingsNYC] Supabase error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn('[getAllListingsNYC] No listings found in listings_nyc table');
      console.log('[getAllListingsNYC] This could mean:');
      console.log('  1. The table is empty (no data inserted yet)');
      console.log('  2. RLS policies are blocking access');
      console.log('  3. The table name is incorrect');
      return [];
    }

    // Log first listing to inspect schema (helpful for debugging)
    console.log('[getAllListingsNYC] First listing from DB:', JSON.stringify(data[0], null, 2));
    console.log('[getAllListingsNYC] Column names:', Object.keys(data[0]));

    const converted = data.map(convertNYCListing);
    console.log(`[getAllListingsNYC] Loaded ${converted.length} NYC listings`);
    console.log('[getAllListingsNYC] First converted listing:', converted[0]);

    return converted;
  } catch (error) {
    console.error('[getAllListingsNYC] Caught error:', error);
    console.error('[getAllListingsNYC] Error type:', typeof error);
    console.error('[getAllListingsNYC] Error details:', JSON.stringify(error, null, 2));
    return [];
  }
}

// Listings CRUD operations
export async function getAllListings(): Promise<Listing[]> {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching listings:', error);
    return [];
  }
}

export async function getManagerListings(managerId: string): Promise<Listing[]> {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('manager_id', managerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching manager listings:', error);
    return [];
  }
}

export async function createListing(listing: Omit<Listing, 'id' | 'created_at' | 'updated_at'>): Promise<Listing | null> {
  try {
    // Geocode the address to get latitude and longitude
    const coords = await geocodeAddress(listing.address);

    const listingWithCoords = {
      ...listing,
      latitude: coords?.latitude || null,
      longitude: coords?.longitude || null,
    };

    // Insert into old listings table (for backwards compatibility)
    const { data, error } = await supabase
      .from('listings')
      .insert(listingWithCoords)
      .select()
      .single();

    if (error) throw error;

    // Also insert into listings_nyc table for consistency
    try {
      // Convert amenities array to binary format
      const amenitiesLower = listing.amenities.map(a => a.toLowerCase());
      const hasAmenity = (keywords: string[]) =>
        keywords.some(keyword => amenitiesLower.some(a => a.includes(keyword)));

      // Parse location from address (simple heuristic - can be improved)
      const addressParts = listing.address.split(',').map(p => p.trim());
      const neighborhood = addressParts[0] || 'Manhattan'; // First part is usually neighborhood
      const city = 'New York'; // Default to NYC
      const state = 'NY';

      const nycListing = {
        'Unit ID': parseInt(data.id) || Math.floor(Math.random() * 1000000),
        'Manager ID': listing.manager_id,
        'Title': listing.title,
        'Address': listing.address,
        'State': state,
        'City': city,
        'Neighborhood': neighborhood,
        'Price': listing.price,
        'Date Listed': new Date().toISOString(),
        'Date Available': listing.available_from,
        'Bedrooms': listing.bedrooms.toString(),
        'Bathrooms': listing.bathrooms,
        'Sqft': listing.sqft,
        'Year Built': new Date().getFullYear() - 5, // Default to 5 years old
        'Renovation Year': null,
        'Washer/Dryer in unit': hasAmenity(['in-unit laundry', 'washer', 'dryer in unit']) ? 1 : 0,
        'Washer/Dryer in building': hasAmenity(['laundry', 'washer/dryer in building']) ? 1 : 0,
        'Dishwasher': hasAmenity(['dishwasher']) ? 1 : 0,
        'AC': hasAmenity(['ac', 'air conditioning', 'central air']) ? 1 : 0,
        'Pets': hasAmenity(['pet', 'dog', 'cat']) ? 1 : 0,
        'Fireplace': hasAmenity(['fireplace']) ? 1 : 0,
        'Gym': hasAmenity(['gym', 'fitness']) ? 1 : 0,
        'Parking': hasAmenity(['parking', 'garage']) ? 1 : 0,
        'Pool': hasAmenity(['pool', 'swimming']) ? 1 : 0,
        'Outdoor Area': hasAmenity(['balcony', 'patio', 'terrace']) ? 'Balcony' : 'None',
        'View': hasAmenity(['view', 'skyline', 'waterfront']) ? 'City' : 'None',
        images: listing.images,
        description: listing.description,
        latitude: coords?.latitude || null,
        longitude: coords?.longitude || null,
        average_rating: null,
        total_ratings: 0,
      };

      await supabase
        .from('listings_nyc')
        .insert(nycListing);

    } catch (nycError) {
      console.error('Error inserting into listings_nyc (non-critical):', nycError);
      // Don't fail the whole operation if NYC insert fails
    }

    return data;
  } catch (error) {
    console.error('Error creating listing:', error);
    return null;
  }
}

export async function updateListing(id: string, updates: Partial<Listing>): Promise<boolean> {
  try {
    let updatesWithCoords = { ...updates };

    // If address is being updated, geocode the new address
    if (updates.address) {
      const coords = await geocodeAddress(updates.address);
      updatesWithCoords = {
        ...updates,
        latitude: coords?.latitude || undefined,
        longitude: coords?.longitude || undefined,
      };
    }

    const { error } = await supabase
      .from('listings')
      .update(updatesWithCoords)
      .eq('id', id);

    return !error;
  } catch (error) {
    console.error('Error updating listing:', error);
    return false;
  }
}

export async function deleteListing(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    return !error;
  } catch (error) {
    console.error('Error deleting listing:', error);
    return false;
  }
}

// Liked listings operations
export async function getLikedListings(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('liked_listings')
      .select('listing_id')
      .eq('user_id', userId);

    if (error) throw error;
    return data?.map(item => item.listing_id) || [];
  } catch (error) {
    console.error('Error fetching liked listings:', error);
    return [];
  }
}

export async function addLikedListing(userId: string, listingId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('liked_listings')
      .upsert({ user_id: userId, listing_id: listingId }, {
        onConflict: 'user_id,listing_id',
        ignoreDuplicates: true
      });

    return !error;
  } catch (error) {
    console.error('Error adding liked listing:', error);
    return false;
  }
}

export async function removeLikedListing(userId: string, listingId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('liked_listings')
      .delete()
      .eq('user_id', userId)
      .eq('listing_id', listingId);

    return !error;
  } catch (error) {
    console.error('Error removing liked listing:', error);
    return false;
  }
}

export async function isListingLiked(userId: string, listingId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('liked_listings')
      .select('id')
      .eq('user_id', userId)
      .eq('listing_id', listingId)
      .single();

    return !!data && !error;
  } catch (error) {
    return false;
  }
}

// Review operations
export interface Review {
  id: string;
  listing_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

export async function getListingReviews(listingId: string): Promise<Review[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}

export async function addReview(review: Omit<Review, 'id' | 'created_at' | 'updated_at'>): Promise<Review | null> {
  try {
    // First, check if user already has a review for this listing
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', review.user_id)
      .eq('listing_id', review.listing_id)
      .single();

    if (existing) {
      // Update existing review
      const { data, error } = await supabase
        .from('reviews')
        .update({
          user_name: review.user_name,
          rating: review.rating,
          comment: review.comment,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new review
      const { data, error } = await supabase
        .from('reviews')
        .insert(review)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error adding review:', error);
    return null;
  }
}

export async function deleteReview(userId: string, listingId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('user_id', userId)
      .eq('listing_id', listingId);

    return !error;
  } catch (error) {
    console.error('Error deleting review:', error);
    return false;
  }
}

import { supabase } from './supabase';
import { geocodeAddress } from './geocoding';
import { NYCApartmentListing } from './data';

// Types
export interface Listing {
  id: string;
  manager_id: string;
  apartment_complex_name?: string; // Manager's apartment complex name
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

// Price change entry in price_history
export interface PriceChange {
  timestamp: string; // ISO date string
  old_price: number;
  new_price: number;
}

// Database schema for listings_nyc table (snake_case with unusual column names)
export interface ListingNYC {
  "Unit ID": number;
  manager_id: string; // UUID reference to manager profile
  apartment_complex_name?: string; // From JOIN with profiles table
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
  price_history?: PriceChange[]; // Array of price changes over time
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
    managerId: dbListing.manager_id, // UUID string reference to manager
    apartmentComplexName: dbListing.apartment_complex_name || undefined,
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
    priceHistory: dbListing.price_history || [], // Price changes over time
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
    managerId: listing.manager_id, // Keep as UUID string
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

    // Try with JOIN first (after migration)
    // Try multiple join syntaxes until one works
    let { data, error } = await supabase
      .from('listings_nyc')
      .select(`
        *,
        profiles(apartment_complex_name)
      `)
      .order('Unit ID', { ascending: true });

    // If that fails, try with explicit foreign key name
    if (error && error.code === 'PGRST200') {
      const retry = await supabase
        .from('listings_nyc')
        .select(`
          *,
          profiles!listings_nyc_manager_id_fkey(apartment_complex_name)
        `)
        .order('Unit ID', { ascending: true });
      data = retry.data;
      error = retry.error;
    }

    // If JOIN fails (migration not run yet), fall back to simple query
    if (error && error.code === 'PGRST200') {
      console.warn('[getAllListingsNYC] Foreign key not found, fetching without JOIN. Run migration: replace_manager_id_with_uuid.sql');
      const fallback = await supabase
        .from('listings_nyc')
        .select('*')
        .order('Unit ID', { ascending: true });

      data = fallback.data;
      error = fallback.error;
    }

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

    // Map the joined data to include apartment_complex_name at top level
    const converted = data.map((item: any) => {
      const listing = {
        ...item,
        apartment_complex_name: item.profiles?.apartment_complex_name || null,
      };
      delete listing.profiles; // Remove nested profiles object
      return convertNYCListing(listing);
    });

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
    // Try with explicit foreign key name first
    let { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        profiles!listings_manager_id_fkey(apartment_complex_name)
      `)
      .order('created_at', { ascending: false });

    // If that fails, try simpler JOIN syntax
    if (error && error.code === 'PGRST200') {
      const retry = await supabase
        .from('listings')
        .select(`
          *,
          profiles(apartment_complex_name)
        `)
        .order('created_at', { ascending: false });
      data = retry.data;
      error = retry.error;
    }

    // If JOIN still fails, fetch without it
    if (error && error.code === 'PGRST200') {
      console.warn('[getAllListings] Foreign key not found, fetching without JOIN.');
      const fallback = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error('[getAllListings] Error details:', error);
      throw error;
    }

    // Map the joined data to include apartment_complex_name at top level
    const listings = (data || []).map((item: any) => ({
      ...item,
      apartment_complex_name: item.profiles?.apartment_complex_name || null,
      profiles: undefined, // Remove the nested profiles object
    }));

    return listings;
  } catch (error) {
    console.error('Error fetching listings:', error);
    return [];
  }
}

// Fetch manager's NYC listings (from listings_nyc table)
export async function getManagerListingsNYC(managerId: string): Promise<NYCApartmentListing[]> {
  try {
    console.log('[getManagerListingsNYC] Fetching listings for manager:', managerId);

    // Try with JOIN first
    let { data, error } = await supabase
      .from('listings_nyc')
      .select(`
        *,
        profiles(apartment_complex_name)
      `)
      .eq('manager_id', managerId)
      .order('Unit ID', { ascending: false });

    // If that fails, try with explicit foreign key name
    if (error && error.code === 'PGRST200') {
      const retry = await supabase
        .from('listings_nyc')
        .select(`
          *,
          profiles!listings_nyc_manager_id_fkey(apartment_complex_name)
        `)
        .eq('manager_id', managerId)
        .order('Unit ID', { ascending: false });
      data = retry.data;
      error = retry.error;
    }

    // If JOIN still fails, fetch without it
    if (error && error.code === 'PGRST200') {
      console.warn('[getManagerListingsNYC] Foreign key not found, fetching without JOIN.');
      const fallback = await supabase
        .from('listings_nyc')
        .select('*')
        .eq('manager_id', managerId)
        .order('Unit ID', { ascending: false });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error('[getManagerListingsNYC] Error details:', error);
      throw error;
    }

    console.log('[getManagerListingsNYC] Found', data?.length || 0, 'listings');

    if (!data || data.length === 0) {
      return [];
    }

    // Map the joined data to include apartment_complex_name at top level
    const converted = data.map((item: any) => {
      const listing = {
        ...item,
        apartment_complex_name: item.profiles?.apartment_complex_name || null,
      };
      delete listing.profiles;
      return convertNYCListing(listing);
    });

    return converted;
  } catch (error) {
    console.error('[getManagerListingsNYC] Caught error:', error);
    return [];
  }
}

export async function getManagerListings(managerId: string): Promise<Listing[]> {
  try {
    // Try with explicit foreign key name first
    let { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        profiles!listings_manager_id_fkey(apartment_complex_name)
      `)
      .eq('manager_id', managerId)
      .order('created_at', { ascending: false });

    // If that fails, try simpler JOIN syntax
    if (error && error.code === 'PGRST200') {
      const retry = await supabase
        .from('listings')
        .select(`
          *,
          profiles(apartment_complex_name)
        `)
        .eq('manager_id', managerId)
        .order('created_at', { ascending: false });
      data = retry.data;
      error = retry.error;
    }

    // If JOIN still fails, fetch without it
    if (error && error.code === 'PGRST200') {
      console.warn('[getManagerListings] Foreign key not found, fetching without JOIN.');
      const fallback = await supabase
        .from('listings')
        .select('*')
        .eq('manager_id', managerId)
        .order('created_at', { ascending: false });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error('[getManagerListings] Error details:', error);
      throw error;
    }

    // Map the joined data to include apartment_complex_name at top level
    const listings = (data || []).map((item: any) => ({
      ...item,
      apartment_complex_name: item.profiles?.apartment_complex_name || null,
      profiles: undefined, // Remove the nested profiles object
    }));

    return listings;
  } catch (error) {
    console.error('Error fetching manager listings:', error);
    return [];
  }
}

export async function createListing(
  listing: Omit<Listing, 'id' | 'created_at' | 'updated_at'> & {
    yearBuilt?: number;
    renovationYear?: number | null;
    outdoorArea?: string;
    view?: string;
  }
): Promise<Listing | null> {
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

      // Fetch location from manager's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('city, state, neighborhood')
        .eq('id', listing.manager_id)
        .single();

      if (profileError) {
        console.error('Error fetching manager profile for location:', profileError);
      }

      // Use manager's profile location or fallback to defaults
      // For backwards compatibility, default to NYC if manager hasn't set location
      const city = profile?.city?.trim() || 'New York';
      const state = profile?.state?.trim() || 'NY';
      const neighborhood = profile?.neighborhood?.trim() || 'Manhattan';

      const nycListing = {
        'Unit ID': parseInt(data.id) || Math.floor(Math.random() * 1000000),
        manager_id: listing.manager_id, // UUID reference for JOIN with profiles
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
        'Year Built': listing.yearBuilt || new Date().getFullYear() - 5,
        'Renovation Year': listing.renovationYear || null,
        'Washer/Dryer in unit': hasAmenity(['in-unit laundry', 'washer', 'dryer in unit']) ? 1 : 0,
        'Washer/Dryer in building': hasAmenity(['laundry', 'washer/dryer in building']) ? 1 : 0,
        'Dishwasher': hasAmenity(['dishwasher']) ? 1 : 0,
        'AC': hasAmenity(['ac', 'air conditioning', 'central air']) ? 1 : 0,
        'Pets': hasAmenity(['pet', 'dog', 'cat']) ? 1 : 0,
        'Fireplace': hasAmenity(['fireplace']) ? 1 : 0,
        'Gym': hasAmenity(['gym', 'fitness']) ? 1 : 0,
        'Parking': hasAmenity(['parking', 'garage']) ? 1 : 0,
        'Pool': hasAmenity(['pool', 'swimming']) ? 1 : 0,
        'Outdoor Area': listing.outdoorArea || (hasAmenity(['balcony', 'patio', 'terrace']) ? 'Balcony' : 'None'),
        'View': listing.view || (hasAmenity(['view', 'skyline', 'waterfront']) ? 'City' : 'None'),
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

export async function updateListingNYC(
  unitId: string,
  updates: {
    title?: string;
    address?: string;
    price?: number;
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    yearBuilt?: number;
    renovationYear?: number | null;
    description?: string;
    dateAvailable?: string;
    images?: string[];
    washerDryerInUnit?: boolean;
    washerDryerInBuilding?: boolean;
    dishwasher?: boolean;
    ac?: boolean;
    pets?: boolean;
    fireplace?: boolean;
    gym?: boolean;
    parking?: boolean;
    pool?: boolean;
    outdoorArea?: string;
    view?: string;
  }
): Promise<boolean> {
  try {
    console.log('[updateListingNYC] Updating listing:', unitId);

    // If price is changing, fetch current listing to track price history
    if (updates.price !== undefined) {
      const { data: currentListing, error: fetchError } = await supabase
        .from('listings_nyc')
        .select('Price, price_history')
        .eq('Unit ID', parseInt(unitId, 10))
        .single();

      if (fetchError) {
        console.error('[updateListingNYC] Error fetching current listing:', fetchError);
      } else if (currentListing && currentListing['Price'] !== updates.price) {
        // Price is changing - add to history
        const currentHistory: PriceChange[] = currentListing.price_history || [];
        const newChange: PriceChange = {
          timestamp: new Date().toISOString(),
          old_price: currentListing['Price'],
          new_price: updates.price,
        };

        // Append to price history
        const updatedHistory = [...currentHistory, newChange];

        // Update price_history in the updateData
        const { error: historyError } = await supabase
          .from('listings_nyc')
          .update({ price_history: updatedHistory })
          .eq('Unit ID', parseInt(unitId, 10));

        if (historyError) {
          console.error('[updateListingNYC] Error updating price history:', historyError);
        }
      }
    }

    // Build update object with NYC column names
    const updateData: any = {};

    if (updates.title !== undefined) updateData['Title'] = updates.title;
    if (updates.address !== undefined) updateData['Address'] = updates.address;
    if (updates.price !== undefined) updateData['Price'] = updates.price;
    if (updates.bedrooms !== undefined) updateData['Bedrooms'] = updates.bedrooms.toString();
    if (updates.bathrooms !== undefined) updateData['Bathrooms'] = updates.bathrooms;
    if (updates.sqft !== undefined) updateData['Sqft'] = updates.sqft;
    if (updates.yearBuilt !== undefined) updateData['Year Built'] = updates.yearBuilt;
    if (updates.renovationYear !== undefined) updateData['Renovation Year'] = updates.renovationYear;
    if (updates.description !== undefined) updateData['description'] = updates.description;
    if (updates.dateAvailable !== undefined) updateData['Date Available'] = updates.dateAvailable;
    if (updates.images !== undefined) updateData['images'] = updates.images;

    // Amenities
    if (updates.washerDryerInUnit !== undefined) updateData['Washer/Dryer in unit'] = updates.washerDryerInUnit ? 1 : 0;
    if (updates.washerDryerInBuilding !== undefined) updateData['Washer/Dryer in building'] = updates.washerDryerInBuilding ? 1 : 0;
    if (updates.dishwasher !== undefined) updateData['Dishwasher'] = updates.dishwasher ? 1 : 0;
    if (updates.ac !== undefined) updateData['AC'] = updates.ac ? 1 : 0;
    if (updates.pets !== undefined) updateData['Pets'] = updates.pets ? 1 : 0;
    if (updates.fireplace !== undefined) updateData['Fireplace'] = updates.fireplace ? 1 : 0;
    if (updates.gym !== undefined) updateData['Gym'] = updates.gym ? 1 : 0;
    if (updates.parking !== undefined) updateData['Parking'] = updates.parking ? 1 : 0;
    if (updates.pool !== undefined) updateData['Pool'] = updates.pool ? 1 : 0;
    if (updates.outdoorArea !== undefined) updateData['Outdoor Area'] = updates.outdoorArea;
    if (updates.view !== undefined) updateData['View'] = updates.view;

    // Geocode if address changed
    if (updates.address) {
      const coords = await geocodeAddress(updates.address);
      updateData['latitude'] = coords?.latitude || null;
      updateData['longitude'] = coords?.longitude || null;
    }

    const { error } = await supabase
      .from('listings_nyc')
      .update(updateData)
      .eq('Unit ID', parseInt(unitId, 10));

    if (error) {
      console.error('[updateListingNYC] Error:', error);
      return false;
    }

    console.log('[updateListingNYC] Successfully updated listing');
    return true;
  } catch (error) {
    console.error('[updateListingNYC] Caught error:', error);
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

export async function deleteListingNYC(unitId: string): Promise<boolean> {
  try {
    console.log('[deleteListingNYC] Deleting listing with Unit ID:', unitId);

    const { error } = await supabase
      .from('listings_nyc')
      .delete()
      .eq('Unit ID', parseInt(unitId, 10));

    if (error) {
      console.error('[deleteListingNYC] Error:', error);
      return false;
    }

    console.log('[deleteListingNYC] Successfully deleted listing');
    return true;
  } catch (error) {
    console.error('[deleteListingNYC] Caught error:', error);
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

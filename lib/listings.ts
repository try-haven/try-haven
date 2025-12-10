import { supabase } from './supabase';

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
  created_at?: string;
  updated_at?: string;
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
    const { data, error } = await supabase
      .from('listings')
      .insert(listing)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating listing:', error);
    return null;
  }
}

export async function updateListing(id: string, updates: Partial<Listing>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('listings')
      .update(updates)
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
      .insert({ user_id: userId, listing_id: listingId });

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

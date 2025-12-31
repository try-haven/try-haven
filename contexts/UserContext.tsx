"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { geocodeAddress } from "@/lib/geocoding";

type CommuteOption = "car" | "public-transit" | "walk" | "bike";
type UserType = "searcher" | "manager";

interface LearnedPreferences {
  preferredAmenities?: Record<string, number>; // Amenity -> weight
  preferredLocations?: string[]; // City/neighborhood keywords
  avgImageCount?: number;
  avgDescriptionLength?: number;
  avgSqftByBedrooms?: Record<number, number>; // Bedroom count -> median sqft
  updatedAt?: string;
}

export interface ScoringWeights {
  distance: number;   // 0-100 percentage
  amenities: number;  // 0-100 percentage
  propertyFeatures: number;  // 0-100 percentage
  quality: number;    // 0-100 percentage
  rating: number;     // 0-100 percentage
}

interface UserPreferences {
  address?: string;
  latitude?: number;
  longitude?: number;
  commute?: CommuteOption[];
  // Apartment preferences (optional - if not set, use learned values)
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number[];
  bathrooms?: number[];
  ratingMin?: number;
  ratingMax?: number;
  requiredAmenities?: string[]; // Hard filter - listings must have these
  requiredView?: string[]; // Hard filter - view types required
  requiredNeighborhoods?: string[]; // Hard filter - specific neighborhoods
  // Scoring weights (customizable - defaults to 40/35/15/10)
  weights?: ScoringWeights;
  weightsLocked?: boolean; // If true, ML model won't update weights
  // Learned preferences (automatically calculated from swipe behavior)
  learned?: LearnedPreferences;
}

interface Profile {
  id: string;
  username: string;
  name?: string;
  user_type: UserType;
  address?: string;
  commute_options?: CommuteOption[];
}

interface User {
  id: string;
  email: string;
  username: string;
  name?: string;
  userType: UserType;
  preferences?: UserPreferences;
}

interface UserContextType {
  user: User | null;
  isLoggedIn: boolean;
  isManager: boolean;
  loading: boolean;
  signUp: (email: string, username: string, password: string, userType?: UserType) => Promise<{ success: boolean; error?: string }>;
  logIn: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logOut: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  hasReviewedListing: (listingId: string) => Promise<boolean>;
  markListingAsReviewed: (listingId: string) => Promise<void>;
  updatePreferences: (preferences: UserPreferences) => Promise<void>;
  updateLearnedPreferences: (learned: LearnedPreferences) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const loadedUserIdRef = useRef<string | null>(null); // Track if we've already loaded this user
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const isLoadingInProgressRef = useRef(false); // Prevent concurrent loads
  const mountedRef = useRef(true); // Track if component is mounted

  // Safety timeout: force loading to false after 15 seconds to prevent infinite loading
  const setLoadingWithTimeout = useCallback((isLoading: boolean) => {
    if (!mountedRef.current) return; // Don't update state if unmounted

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    setLoading(isLoading);

    if (isLoading) {
      loadingTimeoutRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        console.warn('[UserContext] Loading timeout reached - forcing loading to false');
        setLoading(false);
        loadingTimeoutRef.current = null;
        isLoadingInProgressRef.current = false; // Reset the flag
      }, 15000); // 15 second timeout (increased from 10)
    }
  }, []);

  // Load user from Supabase on mount
  useEffect(() => {
    mountedRef.current = true;

    const initAuth = async () => {
      // Prevent concurrent loads during rapid refreshes
      if (isLoadingInProgressRef.current) {
        console.log('[UserContext] Load already in progress, skipping...');
        return;
      }

      isLoadingInProgressRef.current = true;

      try {
        console.log('[UserContext] Loading session...');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mountedRef.current) return; // Abort if unmounted

        if (error) {
          console.error('[UserContext] Session error:', error);
          throw error;
        }

        if (session?.user) {
          console.log('[UserContext] Session found, loading profile...');
          await loadUserProfile(session.user);
          if (!mountedRef.current) return; // Check again after async operation
          loadedUserIdRef.current = session.user.id; // Mark as loaded
        } else {
          console.log('[UserContext] No session found');
        }
      } catch (error) {
        console.error("[UserContext] Error loading session:", error);
      } finally {
        isLoadingInProgressRef.current = false;
        if (mountedRef.current) {
          setLoadingWithTimeout(false);
          console.log('[UserContext] Auth initialization complete');
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[UserContext] Auth state changed:', event);

      // CRITICAL FIX: Ignore TOKEN_REFRESHED events to prevent loading flicker on tab switch
      // Also ignore INITIAL_SESSION since we handle that in initAuth
      if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        console.log('[UserContext] Ignoring', event, 'event - no UI update needed');
        return;
      }

      if (session?.user) {
        // Only reload profile if user ID changed (prevents redundant loads)
        if (loadedUserIdRef.current !== session.user.id) {
          console.log('[UserContext] User changed, loading new profile...');
          setLoadingWithTimeout(true);
          try {
            await loadUserProfile(session.user);
            loadedUserIdRef.current = session.user.id;
          } catch (error) {
            console.error('[UserContext] Error in auth state change handler:', error);
          } finally {
            setLoadingWithTimeout(false);
          }
        } else {
          console.log('[UserContext] Same user, skipping profile reload');
        }
      } else {
        console.log('[UserContext] No session, clearing user state');
        setUser(null);
        loadedUserIdRef.current = null;
        setLoadingWithTimeout(false);
      }
    });

    return () => {
      mountedRef.current = false;
      isLoadingInProgressRef.current = false;
      subscription.unsubscribe();
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  const loadUserProfile = async (authUser: SupabaseUser, retryCount = 0): Promise<void> => {
    try {
      console.log('[UserContext] Loading profile for user:', authUser.id, retryCount > 0 ? `(retry ${retryCount})` : '');
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error("[UserContext] Error fetching profile:", error);
        // Profile might not exist yet if email confirmation is pending
        if (error.code === 'PGRST116') {
          console.log("[UserContext] Profile not found - might be pending email confirmation");
        }

        // Retry on network errors (but not on "not found" errors)
        if (retryCount < 2 && error.code !== 'PGRST116') {
          console.log('[UserContext] Retrying profile load...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          return loadUserProfile(authUser, retryCount + 1);
        }

        throw error;
      }

      if (profile) {
        console.log('[UserContext] Profile loaded successfully:', profile.username);
        setUser({
          id: profile.id,
          email: authUser.email!,
          username: profile.username,
          name: profile.name,
          userType: profile.user_type as UserType,
          preferences: {
            address: profile.address,
            latitude: profile.latitude,
            longitude: profile.longitude,
            commute: profile.commute_options as CommuteOption[],
            priceMin: profile.price_min,
            priceMax: profile.price_max,
            bedrooms: profile.bedrooms,
            bathrooms: profile.bathrooms,
            ratingMin: profile.rating_min,
            ratingMax: profile.rating_max,
            requiredAmenities: profile.required_amenities,
            requiredView: profile.required_view,
            requiredNeighborhoods: profile.required_neighborhoods,
            weights: {
              distance: profile.weight_distance ?? 30,
              amenities: profile.weight_amenities ?? 30,
              propertyFeatures: profile.weight_property_features ?? 20,
              quality: profile.weight_quality ?? 15,
              rating: profile.weight_rating ?? 5,
            },
            weightsLocked: profile.weights_locked ?? false,
            learned: {
              preferredAmenities: profile.learned_preferred_amenities || {},
              avgImageCount: profile.learned_avg_image_count,
              avgDescriptionLength: profile.learned_avg_description_length,
              avgSqftByBedrooms: profile.learned_avg_sqft_by_bedrooms,
              updatedAt: profile.learned_preferences_updated_at,
            },
          },
        });
        console.log('[UserContext] User state updated');
      } else {
        console.log('[UserContext] No profile data returned');
      }
    } catch (error) {
      console.error("[UserContext] Error loading profile:", error);
    }
  };

  const signUp = async (email: string, username: string, password: string, userType: UserType = "searcher"): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if username is already taken using RPC function (safer than direct SELECT)
      const { data: isAvailable, error: checkError } = await supabase
        .rpc('check_username_available', { username_input: username });

      if (checkError) {
        console.error("Username check error:", checkError);
        // If check fails, continue with signup - backend will catch it
        // Better UX than blocking signup entirely
      } else if (isAvailable === false) {
        return {
          success: false,
          error: `The username "${username}" is already taken. Please try a different username.`
        };
      }

      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            user_type: userType,
          },
        },
      });

      if (error) {
        console.error("Signup error:", error);

        // Handle specific Supabase Auth errors with helpful messages
        if (error.message.includes("already registered") || error.message.includes("already been registered")) {
          return {
            success: false,
            error: "This email is already registered. Please log in instead or use a different email."
          };
        }

        if (error.message.includes("Database error")) {
          return {
            success: false,
            error: "Unable to create account. The username might already be taken. Please try a different username."
          };
        }

        if (error.message.includes("Password")) {
          return { success: false, error: "Password must be at least 6 characters long." };
        }

        if (error.message.includes("Invalid email")) {
          return { success: false, error: "Please enter a valid email address." };
        }

        // Generic error with more helpful text
        return { success: false, error: `Signup failed: ${error.message}. Please try again.` };
      }

      if (data.user) {
        // If email confirmation is required, the user exists but profile won't be created yet
        if (data.user.confirmed_at) {
          await loadUserProfile(data.user);
        } else {
          console.log("Email confirmation required - profile will be created after confirmation");
        }
        return { success: true };
      }

      return { success: false, error: "Signup failed. Please try again." };
    } catch (error) {
      console.error("Signup error:", error);
      return {
        success: false,
        error: "An unexpected error occurred. Please check your internet connection and try again."
      };
    }
  };

  const logIn = async (usernameOrEmail: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if input is email or username
      let email = usernameOrEmail;

      if (!usernameOrEmail.includes('@')) {
        // It's a username, fetch the email using RPC function
        const { data: userEmail, error: rpcError } = await supabase
          .rpc('get_email_from_username', { username_input: usernameOrEmail });

        if (rpcError || !userEmail) {
          return { success: false, error: "Invalid credentials" };
        }
        email = userEmail;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: "Invalid credentials" };
      }

      if (data.user) {
        await loadUserProfile(data.user);
        return { success: true };
      }

      return { success: false, error: "Login failed" };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const logOut = async () => {
    console.log('[UserContext] Starting logout...');
    // Set loading state to prevent race conditions during logout
    setLoadingWithTimeout(true);

    try {
      // Sign out from Supabase first
      await supabase.auth.signOut();
      console.log('[UserContext] Supabase session cleared');

      // Clear user state after session is cleared
      setUser(null);
      loadedUserIdRef.current = null;
      console.log('[UserContext] User state cleared');
    } catch (error) {
      console.error("[UserContext] Logout error:", error);
      // Clear user state even if signOut fails
      setUser(null);
      loadedUserIdRef.current = null;
    } finally {
      setLoadingWithTimeout(false);
      console.log('[UserContext] Logout complete');
    }
  };

  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: "No user logged in" };
    }

    console.log('[UserContext] Starting account deletion...');
    setLoadingWithTimeout(true);

    try {
      // Call the RPC function to delete everything
      console.log('[UserContext] Calling delete_user_account RPC...');
      const { data, error: rpcError } = await supabase.rpc('delete_user_account');

      if (rpcError) {
        console.error('[UserContext] RPC error details:', {
          message: rpcError.message,
          details: rpcError.details,
          hint: rpcError.hint,
          code: rpcError.code
        });
        return {
          success: false,
          error: `Database error: ${rpcError.message || 'Function not found'}. You need to run the SQL migration in supabase_migrations/complete_account_deletion.sql first.`
        };
      }

      console.log('[UserContext] RPC response:', data);

      // Check if the RPC function returned an error
      if (data && !data.success) {
        console.error('[UserContext] Deletion failed:', data.error);
        return {
          success: false,
          error: data.error || "Failed to delete account"
        };
      }

      // Clear all local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('haven_liked_listings');
        localStorage.removeItem('haven_swipe_history');
        localStorage.removeItem('haven_swipe_position');
        localStorage.removeItem('haven_reviewed_listings');
        localStorage.removeItem('haven_listing_metrics');
        localStorage.removeItem('haven_listing_metric_events');
        localStorage.removeItem('haven-auth-token');

        // Clear all cached listing reviews
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('haven_listing_reviews_')) {
            localStorage.removeItem(key);
          }
        });
      }

      // Sign out (this should happen automatically since auth user is deleted, but do it anyway)
      await supabase.auth.signOut();
      setUser(null);
      loadedUserIdRef.current = null;

      console.log('[UserContext] Account deletion complete');
      return { success: true };
    } catch (error) {
      console.error("[UserContext] Account deletion error:", error);
      return {
        success: false,
        error: "Failed to delete account. Please try again or contact support."
      };
    } finally {
      setLoadingWithTimeout(false);
    }
  };

  const hasReviewedListing = async (listingId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('reviewed_listings')
        .select('id')
        .eq('user_id', user.id)
        .eq('listing_id', listingId)
        .single();

      return !!data && !error;
    } catch (error) {
      return false;
    }
  };

  const markListingAsReviewed = async (listingId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('reviewed_listings')
        .insert({
          user_id: user.id,
          listing_id: listingId,
        });
    } catch (error) {
      console.error("Error marking listing as reviewed:", error);
    }
  };

  const updatePreferences = async (preferences: UserPreferences) => {
    if (!user) {
      console.error('[UserContext] Cannot update preferences: no user');
      return;
    }

    console.log('[UserContext] Updating preferences:', preferences);

    try {
      // Geocode the address if it's being updated
      let coords = null;
      if (preferences.address) {
        console.log('[UserContext] Geocoding address:', preferences.address);
        coords = await geocodeAddress(preferences.address);
        console.log('[UserContext] Geocoded coords:', coords);
      }

      // Prepare update data - use null instead of undefined to clear fields
      const updateData: Record<string, any> = {
        address: preferences.address || null,
        latitude: coords?.latitude || null,
        longitude: coords?.longitude || null,
        commute_options: preferences.commute || null,
        price_min: preferences.priceMin ?? null,
        price_max: preferences.priceMax ?? null,
        bedrooms: preferences.bedrooms || null,
        bathrooms: preferences.bathrooms || null,
        rating_min: preferences.ratingMin ?? null,
        rating_max: preferences.ratingMax ?? null,
        required_amenities: preferences.requiredAmenities || null,
        required_view: preferences.requiredView || null,
        required_neighborhoods: preferences.requiredNeighborhoods || null,
        weight_distance: preferences.weights?.distance ?? null,
        weight_amenities: preferences.weights?.amenities ?? null,
        weight_property_features: preferences.weights?.propertyFeatures ?? null,
        weight_quality: preferences.weights?.quality ?? null,
        weight_rating: preferences.weights?.rating ?? null,
      };

      // Only update weightsLocked if explicitly provided (don't overwrite with false)
      if (preferences.weightsLocked !== undefined) {
        updateData.weights_locked = preferences.weightsLocked;
      }

      console.log('[UserContext] Updating database with:', updateData);

      // Update database
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        console.error('[UserContext] Database update error:', updateError);
        throw updateError;
      }

      console.log('[UserContext] Database updated successfully');

      // Fetch updated profile to ensure consistency
      console.log('[UserContext] Fetching updated profile...');
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('[UserContext] Profile fetch error:', fetchError);
        throw fetchError;
      }

      console.log('[UserContext] Fetched profile:', profile);

      // Update local state with confirmed database values
      setUser({
        ...user,
        preferences: {
          address: profile.address,
          latitude: profile.latitude,
          longitude: profile.longitude,
          commute: profile.commute_options as CommuteOption[],
          priceMin: profile.price_min,
          priceMax: profile.price_max,
          bedrooms: profile.bedrooms,
          bathrooms: profile.bathrooms,
          ratingMin: profile.rating_min,
          ratingMax: profile.rating_max,
          requiredAmenities: profile.required_amenities,
          requiredView: profile.required_view,
          requiredNeighborhoods: profile.required_neighborhoods,
          weights: {
            distance: profile.weight_distance ?? 30,
            amenities: profile.weight_amenities ?? 30,
            propertyFeatures: profile.weight_property_features ?? 20,
            quality: profile.weight_quality ?? 15,
            rating: profile.weight_rating ?? 5,
          },
          learned: user.preferences?.learned, // Keep existing learned preferences
        },
      });

      console.log('[UserContext] Preferences updated successfully');
    } catch (error) {
      console.error('[UserContext] Error updating preferences:', error);
      throw error; // Re-throw to let caller handle
    }
  };

  const updateLearnedPreferences = async (learned: LearnedPreferences) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          learned_preferred_amenities: learned.preferredAmenities || {},
          learned_avg_image_count: learned.avgImageCount ?? null,
          learned_avg_description_length: learned.avgDescriptionLength ?? null,
          learned_avg_sqft_by_bedrooms: learned.avgSqftByBedrooms ?? null,
          learned_preferences_updated_at: learned.updatedAt ?? null,
        })
        .eq('id', user.id);

      if (error) {
        console.error("Error updating learned preferences:", {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      // Update local user state
      setUser({
        ...user,
        preferences: {
          ...user.preferences,
          learned: learned,
        },
      });
    } catch (error) {
      console.error("Error updating learned preferences (catch):", error);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isManager: user?.userType === "manager",
        loading,
        signUp,
        logIn,
        logOut,
        deleteAccount,
        hasReviewedListing,
        markListingAsReviewed,
        updatePreferences,
        updateLearnedPreferences,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}


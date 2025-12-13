"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
  updatedAt?: string;
}

export interface ScoringWeights {
  distance: number;   // 0-100 percentage
  amenities: number;  // 0-100 percentage
  quality: number;    // 0-100 percentage
  rating: number;     // 0-100 percentage
}

interface UserPreferences {
  address?: string;
  latitude?: number;
  longitude?: number;
  commute?: CommuteOption[];
  minRating?: number;
  // Apartment preferences (optional - if not set, use learned values)
  priceMin?: number;
  priceMax?: number;
  bedroomsMin?: number;
  bedroomsMax?: number;
  bathroomsMin?: number;
  bathroomsMax?: number;
  // Scoring weights (customizable - defaults to 40/35/15/10)
  weights?: ScoringWeights;
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
  hasReviewedListing: (listingId: string) => Promise<boolean>;
  markListingAsReviewed: (listingId: string) => Promise<void>;
  updatePreferences: (preferences: UserPreferences) => Promise<void>;
  updateLearnedPreferences: (learned: LearnedPreferences) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from Supabase on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadUserProfile(session.user);
        }
      } catch (error) {
        console.error("Error loading session:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser: SupabaseUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        // Profile might not exist yet if email confirmation is pending
        if (error.code === 'PGRST116') {
          console.log("Profile not found - might be pending email confirmation");
        }
        throw error;
      }

      if (profile) {
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
            minRating: profile.min_rating,
            priceMin: profile.price_min,
            priceMax: profile.price_max,
            bedroomsMin: profile.bedrooms_min,
            bedroomsMax: profile.bedrooms_max,
            bathroomsMin: profile.bathrooms_min,
            bathroomsMax: profile.bathrooms_max,
            weights: {
              distance: profile.weight_distance ?? 40,
              amenities: profile.weight_amenities ?? 35,
              quality: profile.weight_quality ?? 15,
              rating: profile.weight_rating ?? 10,
            },
            learned: {
              preferredAmenities: profile.learned_preferred_amenities || {},
              avgImageCount: profile.learned_avg_image_count,
              avgDescriptionLength: profile.learned_avg_description_length,
              updatedAt: profile.learned_preferences_updated_at,
            },
          },
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
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
    // Clear user state immediately for instant UI feedback
    setUser(null);

    // Sign out from Supabase in the background
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
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
    if (!user) return;

    try {
      // Geocode the address if it's being updated
      let coords = null;
      if (preferences.address) {
        coords = await geocodeAddress(preferences.address);
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          address: preferences.address,
          latitude: coords?.latitude || null,
          longitude: coords?.longitude || null,
          commute_options: preferences.commute,
          min_rating: preferences.minRating,
          price_min: preferences.priceMin,
          price_max: preferences.priceMax,
          bedrooms_min: preferences.bedroomsMin,
          bedrooms_max: preferences.bedroomsMax,
          bathrooms_min: preferences.bathroomsMin,
          bathrooms_max: preferences.bathroomsMax,
          weight_distance: preferences.weights?.distance,
          weight_amenities: preferences.weights?.amenities,
          weight_quality: preferences.weights?.quality,
          weight_rating: preferences.weights?.rating,
        })
        .eq('id', user.id);

      if (error) throw error;

      setUser({
        ...user,
        preferences: {
          ...preferences,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
        },
      });
    } catch (error) {
      console.error("Error updating preferences:", error);
    }
  };

  const updateLearnedPreferences = async (learned: LearnedPreferences) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          learned_preferred_amenities: learned.preferredAmenities || {},
          learned_avg_image_count: learned.avgImageCount,
          learned_avg_description_length: learned.avgDescriptionLength,
          learned_preferences_updated_at: new Date().toISOString(),
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
          learned: {
            ...learned,
            updatedAt: new Date().toISOString(),
          },
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


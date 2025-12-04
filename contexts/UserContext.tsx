"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type CommuteOption = "car" | "public-transit" | "walk" | "bike";
type UserType = "searcher" | "manager";

interface UserPreferences {
  address?: string;
  commute?: CommuteOption[];
}

interface User {
  email: string;
  username: string;
  password: string;
  name?: string;
  userType: UserType;
  preferences?: UserPreferences;
}

interface UserContextType {
  user: User | null;
  isLoggedIn: boolean;
  isManager: boolean;
  signUp: (email: string, username: string, password: string, userType?: UserType) => boolean;
  logIn: (username: string, password: string) => boolean;
  logOut: () => void;
  hasReviewedListing: (listingId: string) => boolean;
  markListingAsReviewed: (listingId: string) => void;
  updatePreferences: (preferences: UserPreferences) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("haven_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing stored user:", error);
      }
    }
    setMounted(true);
  }, []);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (mounted) {
      if (user) {
        localStorage.setItem("haven_user", JSON.stringify(user));
      } else {
        localStorage.removeItem("haven_user");
      }
    }
  }, [user, mounted]);

  const signUp = (email: string, username: string, password: string, userType: UserType = "searcher"): boolean => {
    // Check if user already exists
    const existingUsers = localStorage.getItem("haven_users");
    const users: User[] = existingUsers ? JSON.parse(existingUsers) : [];

    if (users.some((u) => u.email === email || u.username === username)) {
      return false; // User already exists
    }

    const newUser: User = { email, username, password, userType };
    users.push(newUser);
    localStorage.setItem("haven_users", JSON.stringify(users));
    setUser(newUser);
    return true;
  };

  const logIn = (username: string, password: string): boolean => {
    const existingUsers = localStorage.getItem("haven_users");
    const users: User[] = existingUsers ? JSON.parse(existingUsers) : [];
    
    const foundUser = users.find((u) => (u.username === username || u.email === username) && u.password === password);
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const logOut = () => {
    setUser(null);
    localStorage.removeItem("haven_user");
  };

  const hasReviewedListing = (listingId: string): boolean => {
    if (!user) return false;
    const reviewedListings = localStorage.getItem(`haven_reviews_${user.username}`);
    if (!reviewedListings) return false;
    const reviews: string[] = JSON.parse(reviewedListings);
    return reviews.includes(listingId);
  };

  const markListingAsReviewed = (listingId: string) => {
    if (!user) return;
    const reviewedListings = localStorage.getItem(`haven_reviews_${user.username}`);
    const reviews: string[] = reviewedListings ? JSON.parse(reviewedListings) : [];
    if (!reviews.includes(listingId)) {
      reviews.push(listingId);
      localStorage.setItem(`haven_reviews_${user.username}`, JSON.stringify(reviews));
    }
  };

  const updatePreferences = (preferences: UserPreferences) => {
    if (!user) return;

    const updatedUser = { ...user, preferences };
    setUser(updatedUser);

    // Update in users array
    const existingUsers = localStorage.getItem("haven_users");
    const users: User[] = existingUsers ? JSON.parse(existingUsers) : [];
    const updatedUsers = users.map(u =>
      u.username === user.username ? updatedUser : u
    );
    localStorage.setItem("haven_users", JSON.stringify(updatedUsers));
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isManager: user?.userType === "manager",
        signUp,
        logIn,
        logOut,
        hasReviewedListing,
        markListingAsReviewed,
        updatePreferences,
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


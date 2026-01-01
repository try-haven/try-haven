"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useUser } from '@/contexts/UserContext';
import { getLikedListings, addLikedListing, removeLikedListing } from '@/lib/listings';

interface LikedListingsContextType {
  likedIds: Set<string>;
  likedCount: number;
  loading: boolean;
  toggleLike: (listingId: string) => Promise<boolean>;
  isLiked: (listingId: string) => boolean;
  setLikedIds: (newIds: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  reload: () => Promise<void>;
  flushPendingSync: () => Promise<void>;
  clearAllLikes: () => Promise<void>;
}

const LikedListingsContext = createContext<LikedListingsContextType | undefined>(undefined);

export function LikedListingsProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const previousLikedIds = useRef<Set<string>>(new Set());
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingAddsRef = useRef<Set<string>>(new Set());
  const pendingRemovesRef = useRef<Set<string>>(new Set());
  const loadedUserIdRef = useRef<string | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef(false); // Track initial load to handle refresh properly
  const isLoadingInProgressRef = useRef(false); // Prevent concurrent loads
  const mountedRef = useRef(true); // Track if component is mounted

  // Safety timeout: force loading to false after 12 seconds
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
        console.warn('[LikedListingsContext] Loading timeout reached - forcing loading to false');
        setLoading(false);
        loadingTimeoutRef.current = null;
        isLoadingInProgressRef.current = false; // Reset the flag
      }, 12000); // 12 second timeout (increased from 8)
    }
  }, []);

  // Process pending syncs in batch
  const processPendingSync = useCallback(async () => {
    const userId = user?.id;
    if (!userId) return;

    const toAdd = Array.from(pendingAddsRef.current);
    const toRemove = Array.from(pendingRemovesRef.current);

    // Clear pending queues
    pendingAddsRef.current.clear();
    pendingRemovesRef.current.clear();

    if (toAdd.length === 0 && toRemove.length === 0) return;

    try {
      // Process all operations
      const results = await Promise.allSettled([
        ...toAdd.map(id => addLikedListing(userId, id)),
        ...toRemove.map(id => removeLikedListing(userId, id))
      ]);

      // Log any failures
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const isAdd = index < toAdd.length;
          const id = isAdd ? toAdd[index] : toRemove[index - toAdd.length];
          console.error(`Failed to ${isAdd ? 'add' : 'remove'} listing ${id}:`, result.reason);
        }
      });
    } catch (error) {
      console.error('[LikedListingsContext] Error in batch sync:', error);
    }
  }, [user?.id]);

  // Load liked listings from Supabase
  const loadLikedListings = useCallback(async (retryCount = 0) => {
    const userId = user?.id;

    if (!userId) {
      if (mountedRef.current) {
        setLikedIds(new Set());
        previousLikedIds.current = new Set();
        loadedUserIdRef.current = null;
        hasInitializedRef.current = true;
        // Clear localStorage when no user
        localStorage.removeItem("haven_liked_listings");
        setLoadingWithTimeout(false);
      }
      return;
    }

    // On first load (page refresh), always load fresh data
    // On subsequent calls, skip if already loaded for this user (prevents overwriting optimistic updates)
    if (hasInitializedRef.current && loadedUserIdRef.current === userId) {
      setLoadingWithTimeout(false);
      return;
    }

    // Prevent concurrent loads during rapid refreshes
    if (isLoadingInProgressRef.current && retryCount === 0) {
      return;
    }

    isLoadingInProgressRef.current = true;
    setLoadingWithTimeout(true);

    try {
      // Load from database (since we now sync immediately, database should be source of truth)
      const ids = await getLikedListings(userId);

      if (!mountedRef.current) return; // Abort if unmounted

      const idsSet = new Set(ids);
      setLikedIds(idsSet);
      previousLikedIds.current = new Set(idsSet);
      loadedUserIdRef.current = userId; // Mark as loaded
      hasInitializedRef.current = true; // Mark as initialized
      localStorage.setItem("haven_liked_listings", JSON.stringify(ids));
    } catch (error) {
      console.error('[LikedListingsContext] Error loading liked listings:', error);

      // Retry up to 2 times on failure
      if (retryCount < 2 && mountedRef.current) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        if (!mountedRef.current) return; // Check again after timeout
        return loadLikedListings(retryCount + 1);
      }

      // After all retries failed, set empty set so UI doesn't get stuck
      if (mountedRef.current) {
        console.error('[LikedListingsContext] All retries failed, setting empty liked listings');
        setLikedIds(new Set());
        previousLikedIds.current = new Set();
        hasInitializedRef.current = true;
        localStorage.setItem("haven_liked_listings", JSON.stringify([]));
      }
    } finally {
      isLoadingInProgressRef.current = false;
      if (mountedRef.current) {
        setLoadingWithTimeout(false);
      }
    }
  }, [user?.id, setLoadingWithTimeout]); // ✅ FIX: Only depend on user ID, not entire user object

  // Load liked listings when user changes
  useEffect(() => {
    mountedRef.current = true;
    loadLikedListings();

    return () => {
      mountedRef.current = false;
    };
  }, [loadLikedListings]);

  // Flush pending syncs immediately (for logout, etc.)
  const flushPendingSync = useCallback(async () => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    await processPendingSync();
  }, [processPendingSync]);

  // Cleanup: process pending syncs on unmount and clear timeout
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      isLoadingInProgressRef.current = false;
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        // Note: Can't await in cleanup, but we try to start the sync
        processPendingSync();
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [processPendingSync]);

  const toggleLike = async (listingId: string): Promise<boolean> => {
    if (!user) return false;

    const isCurrentlyLiked = likedIds.has(listingId);

    // Calculate what the new set will be
    const newSet = new Set(likedIds);
    if (isCurrentlyLiked) {
      newSet.delete(listingId);
    } else {
      newSet.add(listingId);
    }

    // Optimistically update UI
    setLikedIds(newSet);
    localStorage.setItem("haven_liked_listings", JSON.stringify(Array.from(newSet)));

    // Sync to database
    const success = isCurrentlyLiked
      ? await removeLikedListing(user.id, listingId)
      : await addLikedListing(user.id, listingId);

    if (!success) {
      // Revert on failure
      const revertedSet = new Set(likedIds); // Use the original likedIds
      setLikedIds(revertedSet);
      localStorage.setItem("haven_liked_listings", JSON.stringify(Array.from(revertedSet)));
      // Don't update previousLikedIds since we reverted
    } else {
      // Update previous ref with the successful new set
      previousLikedIds.current = new Set(newSet);
    }

    return success;
  };

  const isLiked = (listingId: string): boolean => {
    return likedIds.has(listingId);
  };

  // Batch update function for CardStack - sync immediately to database
  const setLikedIdsBatch = useCallback(async (newIds: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    const userId = user?.id;
    if (!userId) return;

    // Calculate what changed - use functional update to get current state
    const oldSet = previousLikedIds.current;
    let newSetCopy: Set<string>;

    if (typeof newIds === 'function') {
      // Get the current state from setLikedIds callback
      let currentSet: Set<string> | null = null;
      setLikedIds(current => {
        currentSet = current;
        return current; // Don't update yet, just read
      });
      newSetCopy = newIds(currentSet!);
    } else {
      newSetCopy = new Set(newIds);
    }

    const added = Array.from(newSetCopy).filter(id => !oldSet.has(id));
    const removed = Array.from(oldSet).filter(id => !newSetCopy.has(id));

    // GUARD: Prevent race condition where CardStack initializes with empty Set before context finishes loading
    // If we have items in oldSet but newSet is completely empty, this is likely CardStack's initial mount
    // Don't remove everything - just skip this update
    if (oldSet.size > 0 && newSetCopy.size === 0 && removed.length === oldSet.size) {
      return;
    }

    if (added.length === 0 && removed.length === 0) {
      return; // No changes
    }

    // Update state immediately (optimistic)
    setLikedIds(newSetCopy);
    previousLikedIds.current = newSetCopy;
    localStorage.setItem("haven_liked_listings", JSON.stringify(Array.from(newSetCopy)));

    try {
      const results = await Promise.allSettled([
        ...added.map(id => addLikedListing(userId, id)),
        ...removed.map(id => removeLikedListing(userId, id))
      ]);

      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        console.error('[LikedListingsContext] Database sync failed:', failures);
      }
    } catch (error) {
      console.error('[LikedListingsContext] Database sync error:', error);
    }
  }, [user?.id]);

  // Clear all liked listings
  const clearAllLikes = useCallback(async () => {
    const userId = user?.id;
    if (!userId) return;

    const currentLikes = Array.from(likedIds);

    // Clear state and localStorage immediately
    setLikedIds(new Set());
    previousLikedIds.current = new Set();
    localStorage.setItem("haven_liked_listings", JSON.stringify([]));

    // Remove from database
    try {
      await Promise.all(
        currentLikes.map(id => removeLikedListing(userId, id))
      );
    } catch (error) {
      console.error('[LikedListingsContext] Error clearing likes:', error);
      throw error;
    }
  }, [user?.id, likedIds]);

  // Force reload from database (resets the cache)
  const reload = useCallback(async () => {
    loadedUserIdRef.current = null; // Reset cache to force reload
    hasInitializedRef.current = false; // Reset initialization flag
    await loadLikedListings();
  }, [loadLikedListings]);

  return (
    <LikedListingsContext.Provider
      value={{
        likedIds,
        likedCount: likedIds.size,
        loading,
        toggleLike,
        isLiked,
        setLikedIds: setLikedIdsBatch,
        reload,
        flushPendingSync,
        clearAllLikes,
      }}
    >
      {children}
    </LikedListingsContext.Provider>
  );
}

export function useLikedListingsContext() {
  const context = useContext(LikedListingsContext);
  if (context === undefined) {
    throw new Error('useLikedListingsContext must be used within a LikedListingsProvider');
  }
  return context;
}

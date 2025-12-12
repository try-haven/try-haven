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

  // Process pending syncs in batch
  const processPendingSync = useCallback(async () => {
    if (!user) return;

    const toAdd = Array.from(pendingAddsRef.current);
    const toRemove = Array.from(pendingRemovesRef.current);

    // Clear pending queues
    pendingAddsRef.current.clear();
    pendingRemovesRef.current.clear();

    if (toAdd.length === 0 && toRemove.length === 0) return;

    console.log('[LikedListingsContext] Processing batched sync:', { toAdd: toAdd.length, toRemove: toRemove.length });

    try {
      // Process all operations
      const results = await Promise.allSettled([
        ...toAdd.map(id => addLikedListing(user.id, id)),
        ...toRemove.map(id => removeLikedListing(user.id, id))
      ]);

      // Log any failures
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const isAdd = index < toAdd.length;
          const id = isAdd ? toAdd[index] : toRemove[index - toAdd.length];
          console.error(`Failed to ${isAdd ? 'add' : 'remove'} listing ${id}:`, result.reason);
        }
      });

      console.log('[LikedListingsContext] Batch sync complete');
    } catch (error) {
      console.error('[LikedListingsContext] Error in batch sync:', error);
    }
  }, [user]);

  // Load liked listings from Supabase
  const loadLikedListings = useCallback(async () => {
    if (!user) {
      setLikedIds(new Set());
      previousLikedIds.current = new Set();
      // Clear localStorage when no user
      localStorage.removeItem("haven_liked_listings");
      setLoading(false);
      return;
    }

    console.log('[LikedListingsContext] Loading liked listings for user:', user.id);
    setLoading(true);
    const ids = await getLikedListings(user.id);
    console.log('[LikedListingsContext] Loaded liked listings from Supabase:', ids.length);
    const idsSet = new Set(ids);
    setLikedIds(idsSet);
    previousLikedIds.current = new Set(idsSet);
    // Save to localStorage for personalization engine
    localStorage.setItem("haven_liked_listings", JSON.stringify(ids));
    setLoading(false);
  }, [user]);

  // Load liked listings when user changes
  useEffect(() => {
    loadLikedListings();
  }, [loadLikedListings]);

  // Flush pending syncs immediately (for logout, etc.)
  const flushPendingSync = useCallback(async () => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    await processPendingSync();
  }, [processPendingSync]);

  // Cleanup: process pending syncs on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        // Note: Can't await in cleanup, but we try to start the sync
        processPendingSync();
      }
    };
  }, [processPendingSync]);

  const toggleLike = async (listingId: string): Promise<boolean> => {
    if (!user) return false;

    const isCurrentlyLiked = likedIds.has(listingId);

    // Optimistically update UI
    setLikedIds(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyLiked) {
        newSet.delete(listingId);
      } else {
        newSet.add(listingId);
      }
      // Save to localStorage immediately for personalization engine
      localStorage.setItem("haven_liked_listings", JSON.stringify(Array.from(newSet)));
      return newSet;
    });

    // Sync to database
    const success = isCurrentlyLiked
      ? await removeLikedListing(user.id, listingId)
      : await addLikedListing(user.id, listingId);

    if (!success) {
      // Revert on failure
      setLikedIds(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.add(listingId);
        } else {
          newSet.delete(listingId);
        }
        // Update localStorage with reverted state
        localStorage.setItem("haven_liked_listings", JSON.stringify(Array.from(newSet)));
        return newSet;
      });
    } else {
      // Update previous ref
      previousLikedIds.current = new Set(likedIds);
    }

    return success;
  };

  const isLiked = (listingId: string): boolean => {
    return likedIds.has(listingId);
  };

  // Batch update function for CardStack
  const setLikedIdsBatch = useCallback((newIds: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    if (!user) {
      console.log('[LikedListingsContext] No user, skipping batch update');
      return;
    }

    setLikedIds(currentIds => {
      const newSet = typeof newIds === 'function' ? newIds(currentIds) : newIds;
      const oldSet = previousLikedIds.current;

      // Create a copy to avoid reference issues
      const newSetCopy = new Set(newSet);

      // Find added and removed IDs
      const added = Array.from(newSetCopy).filter(id => !oldSet.has(id));
      const removed = Array.from(oldSet).filter(id => !newSetCopy.has(id));

      console.log('[LikedListingsContext] Batch update:', {
        oldCount: oldSet.size,
        newCount: newSetCopy.size,
        added: added.length,
        removed: removed.length
      });

      // Update previous ref
      previousLikedIds.current = newSetCopy;

      // Save to localStorage immediately for personalization engine
      const likedArray = Array.from(newSetCopy);
      localStorage.setItem("haven_liked_listings", JSON.stringify(likedArray));

      // Queue operations for batched sync
      if (added.length > 0 || removed.length > 0) {
        // Add to pending queues
        added.forEach(id => pendingAddsRef.current.add(id));
        removed.forEach(id => pendingRemovesRef.current.add(id));

        // Clear existing timeout and schedule new batch
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }

        // Debounce: wait 500ms after last change before syncing
        syncTimeoutRef.current = setTimeout(() => {
          processPendingSync();
        }, 500);
      }

      return newSetCopy;
    });
  }, [user, processPendingSync]);

  return (
    <LikedListingsContext.Provider
      value={{
        likedIds,
        likedCount: likedIds.size,
        loading,
        toggleLike,
        isLiked,
        setLikedIds: setLikedIdsBatch,
        reload: loadLikedListings,
        flushPendingSync,
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

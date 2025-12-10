import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { getLikedListings, addLikedListing, removeLikedListing } from '@/lib/listings';

export function useLikedListings() {
  const { user } = useUser();
  const [likedIds, setLikedIdsInternal] = useState<Set<string>>(new Set());
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

    console.log('[useLikedListings] Processing batched sync:', { toAdd: toAdd.length, toRemove: toRemove.length });

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

      console.log('[useLikedListings] Batch sync complete');
    } catch (error) {
      console.error('[useLikedListings] Error in batch sync:', error);
    }
  }, [user]);

  // Load liked listings from Supabase
  useEffect(() => {
    const loadLikedListings = async () => {
      if (!user) {
        setLikedIdsInternal(new Set());
        previousLikedIds.current = new Set();
        setLoading(false);
        return;
      }

      console.log('[useLikedListings] Loading liked listings for user:', user.id);
      setLoading(true);
      const ids = await getLikedListings(user.id);
      console.log('[useLikedListings] Loaded liked listings from Supabase:', ids.length, ids);
      const idsSet = new Set(ids);
      setLikedIdsInternal(idsSet);
      previousLikedIds.current = new Set(idsSet); // Create a copy
      setLoading(false);
    };

    loadLikedListings();
  }, [user]);

  // Cleanup: process pending syncs on unmount or user change
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        // Process immediately on cleanup
        processPendingSync();
      }
    };
  }, [processPendingSync]);

  const toggleLike = async (listingId: string): Promise<boolean> => {
    if (!user) return false;

    const isLiked = likedIds.has(listingId);

    if (isLiked) {
      const success = await removeLikedListing(user.id, listingId);
      if (success) {
        setLikedIdsInternal(prev => {
          const newSet = new Set(prev);
          newSet.delete(listingId);
          previousLikedIds.current = newSet;
          return newSet;
        });
      }
      return success;
    } else {
      const success = await addLikedListing(user.id, listingId);
      if (success) {
        setLikedIdsInternal(prev => {
          const newSet = new Set(prev).add(listingId);
          previousLikedIds.current = newSet;
          return newSet;
        });
      }
      return success;
    }
  };

  const isLiked = (listingId: string): boolean => {
    return likedIds.has(listingId);
  };

  // Wrapper for setLikedIds that syncs to Supabase
  const setLikedIds = useCallback((newIds: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    if (!user) {
      console.log('[useLikedListings] No user, skipping sync');
      return;
    }

    setLikedIdsInternal(currentIds => {
      const newSet = typeof newIds === 'function' ? newIds(currentIds) : newIds;
      const oldSet = previousLikedIds.current;

      // Create a copy to avoid reference issues
      const newSetCopy = new Set(newSet);

      // Find added and removed IDs
      const added = Array.from(newSetCopy).filter(id => !oldSet.has(id));
      const removed = Array.from(oldSet).filter(id => !newSetCopy.has(id));

      console.log('[useLikedListings] Queueing changes:', {
        oldCount: oldSet.size,
        newCount: newSetCopy.size,
        added: added.length,
        removed: removed.length
      });

      // Update ref for next comparison
      previousLikedIds.current = newSetCopy;

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

  return {
    likedIds,
    likedCount: likedIds.size,
    loading,
    toggleLike,
    isLiked,
    setLikedIds, // Now syncs with Supabase!
  };
}

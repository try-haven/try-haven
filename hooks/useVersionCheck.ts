import { useEffect, useRef } from 'react';

interface Version {
  buildId: string;
  timestamp: string;
  commit: string;
}

const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
const VERSION_STORAGE_KEY = 'haven-build-id';

export function useVersionCheck() {
  const currentBuildId = useRef<string | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkVersion = async () => {
    try {
      // Fetch version.json with cache-busting query param
      // Use NEXT_PUBLIC_BASE_PATH for deployment compatibility (GitHub Pages vs Vercel)
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const response = await fetch(`${basePath}/version.json?t=${Date.now()}`, {
        cache: 'no-cache',
      });

      if (!response.ok) {
        console.warn('Failed to fetch version.json');
        return;
      }

      const version: Version = await response.json();
      const newBuildId = version.buildId;

      // On first check, just store the current version
      if (currentBuildId.current === null) {
        currentBuildId.current = newBuildId;
        localStorage.setItem(VERSION_STORAGE_KEY, newBuildId);
        console.log('✓ Current build ID:', newBuildId);
        return;
      }

      // If version changed, force reload
      if (currentBuildId.current !== newBuildId) {
        console.log('🔄 New version detected, reloading...', {
          old: currentBuildId.current,
          new: newBuildId,
        });

        // Clear any potential stale state
        // (Keep auth token but clear other cached data if needed)
        localStorage.setItem(VERSION_STORAGE_KEY, newBuildId);

        // Force hard reload to get fresh assets
        window.location.reload();
      }
    } catch (error) {
      console.error('Version check failed:', error);
    }
  };

  useEffect(() => {
    // Initial check
    checkVersion();

    // Set up periodic checks
    checkIntervalRef.current = setInterval(checkVersion, CHECK_INTERVAL);

    // Check when tab becomes visible (user comes back)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}

"use client";

import { usePathname } from "next/navigation";
import { UserProvider } from "@/contexts/UserContext";
import { ListingsProvider } from "@/contexts/ListingsContext";
import { LikedListingsProvider } from "@/contexts/LikedListingsContext";

export function ConditionalProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Public routes that don't need auth contexts
  const isPublicRoute = pathname?.startsWith('/listing');

  if (isPublicRoute) {
    // For public routes, render children without auth contexts
    return <>{children}</>;
  }

  // For authenticated routes, wrap with all contexts
  return (
    <UserProvider>
      <ListingsProvider>
        <LikedListingsProvider>{children}</LikedListingsProvider>
      </ListingsProvider>
    </UserProvider>
  );
}

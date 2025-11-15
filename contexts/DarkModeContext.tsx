"use client";

import { createContext, useContext, useEffect, useState } from "react";

type DarkModeContextType = {
  isDark: boolean;
  toggleDarkMode: () => void;
};

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize on mount
  useEffect(() => {
    // Check localStorage first, then system preference
    const stored = localStorage.getItem("darkMode");
    let shouldBeDark = false;
    
    if (stored !== null) {
      shouldBeDark = stored === "true";
    } else {
      shouldBeDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    
    setIsDark(shouldBeDark);
    setMounted(true);
    
    // Apply immediately to prevent flash
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Update class and localStorage when isDark changes (after mount)
  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [isDark, mounted]);

  const toggleDarkMode = () => {
    setIsDark((prev) => {
      const newValue = !prev;
      // Immediately update the DOM for instant feedback
      const root = document.documentElement;
      if (newValue) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      return newValue;
    });
  };

  return (
    <DarkModeContext.Provider value={{ isDark, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error("useDarkMode must be used within a DarkModeProvider");
  }
  return context;
}


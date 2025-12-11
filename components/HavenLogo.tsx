"use client";

import { useState } from "react";
import { HavenLogoIcon } from "@/lib/icons";
import Celebration from "./Celebration";

interface HavenLogoProps {
  size?: "sm" | "md" | "lg";
  showAnimation?: boolean;
  onClick?: () => void;
}

export default function HavenLogo({ size = "md", showAnimation = true, onClick }: HavenLogoProps) {
  const [showCelebration, setShowCelebration] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger celebration easter egg if animation is enabled
    if (showAnimation) {
      setShowCelebration(true);
      // Keep celebration visible for full animation duration
      setTimeout(() => setShowCelebration(false), 3000);
    }

    // Call parent onClick if provided
    if (onClick) {
      onClick();
    }
  };

  // Only make clickable if animation is enabled (easter egg) or onClick is provided
  const shouldBeClickable = showAnimation || onClick;

  return (
    <>
      <div
        onClick={shouldBeClickable ? handleClick : undefined}
        className={shouldBeClickable ? "cursor-pointer" : undefined}
      >
        <HavenLogoIcon size={size} showAnimation={showAnimation} />
      </div>
      {showCelebration && <Celebration />}
    </>
  );
}


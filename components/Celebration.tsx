"use client";

import { useEffect, useState } from "react";

interface ConfettiPiece {
  id: number;
  left: number;
  emoji: string;
  delay: number;
  duration: number;
}

export default function Celebration() {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const emojis = ["🎉", "🎊", "✨", "🎈", "🎆", "⭐", "💫", "🌟", "🎁", "🍾", "🥳"];
    const pieces: ConfettiPiece[] = [];

    // Create 100 confetti pieces
    for (let i = 0; i < 100; i++) {
      pieces.push({
        id: i,
        left: Math.random() * 100,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        delay: Math.random() * 0.2,
        duration: 1.2 + Math.random() * 0.8,
      });
    }

    setConfetti(pieces);

    // Clean up after animation
    const timer = setTimeout(() => {
      setConfetti([]);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (confetti.length === 0) return null;

  return (
    <>
      <style>
        {`
          @keyframes confetti-fall {
            0% {
              transform: translateY(0) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0;
            }
          }
        `}
      </style>
      <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
        {confetti.map((piece) => (
          <div
            key={piece.id}
            className="absolute text-2xl md:text-3xl"
            style={{
              left: `${piece.left}%`,
              top: "-10%",
              animation: `confetti-fall ${piece.duration}s linear ${piece.delay}s forwards`,
            }}
          >
            {piece.emoji}
          </div>
        ))}
      </div>
    </>
  );
}

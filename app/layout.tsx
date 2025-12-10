import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DarkModeProvider } from "@/contexts/DarkModeContext";
import { UserProvider } from "@/contexts/UserContext";
import { ListingsProvider } from "@/contexts/ListingsContext";
import { LikedListingsProvider } from "@/contexts/LikedListingsContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Haven — Apartment Swiping App",
  description: "Find your perfect apartment by swiping through verified listings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <DarkModeProvider>
          <UserProvider>
            <ListingsProvider>
              <LikedListingsProvider>{children}</LikedListingsProvider>
            </ListingsProvider>
          </UserProvider>
        </DarkModeProvider>
      </body>
    </html>
  );
}

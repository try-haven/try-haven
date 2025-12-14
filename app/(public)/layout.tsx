import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

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
  metadataBase: new URL('https://try-haven.github.io'),
  openGraph: {
    title: "Haven — Apartment Swiping App",
    description: "Find your perfect apartment by swiping through verified listings.",
    type: "website",
    images: ['/haven/og-image.png'],
  },
  twitter: {
    card: "summary_large_image",
    title: "Haven — Apartment Swiping App",
    description: "Find your perfect apartment by swiping through verified listings.",
    images: ['/haven/og-image.png'],
  },
};

// Public route layout - completely standalone, no contexts
export default function PublicLayout({
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
        {children}
      </body>
    </html>
  );
}

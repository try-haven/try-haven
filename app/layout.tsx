import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConditionalProviders } from "@/components/ConditionalProviders";
import { DeploymentMonitor } from "@/components/DeploymentMonitor";

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
    images: [`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/og-image.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: "Haven — Apartment Swiping App",
    description: "Find your perfect apartment by swiping through verified listings.",
    images: [`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/og-image.png`],
  },
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
        <DeploymentMonitor />
        <ConditionalProviders>{children}</ConditionalProviders>
      </body>
    </html>
  );
}

import { DarkModeProvider } from "@/contexts/DarkModeContext";

export default function ListingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Listing page doesn't need auth or listings contexts
  // Only needs dark mode for theming
  return <DarkModeProvider>{children}</DarkModeProvider>;
}

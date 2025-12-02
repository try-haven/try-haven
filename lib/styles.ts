/**
 * Common style class strings for consistent styling across the app
 */

// Text styles
export const textStyles = {
  // Helper text (small, muted)
  helper: "text-xs text-gray-500 dark:text-gray-400",
  helperWithMargin: "text-xs text-gray-500 dark:text-gray-400 mt-1",
  helperSmall: "text-xs text-gray-500 dark:text-gray-400 mb-1",
  
  // Body text
  body: "text-gray-700 dark:text-gray-300",
  bodyWithMargin: "text-gray-700 dark:text-gray-300 mb-4",
  bodyClamp2: "text-gray-700 dark:text-gray-300 mb-4 line-clamp-2",
  bodyLight: "text-gray-600 dark:text-gray-300",
  bodyCenter: "text-gray-600 dark:text-gray-300 text-center",
  bodySmall: "text-sm text-gray-600 dark:text-gray-300",
  bodySmallClamp2: "text-sm text-gray-700 dark:text-gray-300 line-clamp-2",
  bodySmallCenter: "text-sm text-gray-600 dark:text-gray-400 text-center",
  
  // Headings
  heading: "text-gray-900 dark:text-white",
  headingLarge: "text-3xl font-bold text-gray-900 dark:text-white",
  headingMedium: "text-2xl font-bold text-gray-900 dark:text-white",
  headingSmall: "text-xl font-bold text-gray-900 dark:text-white",
  headingBrand: "text-xl md:text-3xl font-bold text-indigo-600 dark:text-indigo-400",
  headingBrandSmall: "text-lg md:text-2xl font-bold text-indigo-600 dark:text-indigo-400",
  
  // Brand colors
  brand: "text-indigo-600 dark:text-indigo-400",
  brandHover: "text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300",
  brandLight: "text-indigo-300 dark:text-indigo-300",
  brandLightHover: "text-indigo-300 dark:text-indigo-300 hover:text-indigo-200 dark:hover:text-indigo-200",
  
  // Error text
  error: "text-red-500 text-sm text-center",
  
  // Date/Time
  date: "text-sm text-gray-600 dark:text-gray-400",
  
  // Tagline/Subtitle
  tagline: "text-gray-700 dark:text-white text-lg mb-12 text-center",
  subtitle: "text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto",
};

// Button styles
export const buttonStyles = {
  // Navigation buttons
  nav: "px-3 md:px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm md:text-base",
  navHideMobile: "hidden md:block px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors",
  navHideSmall: "hidden sm:block px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors",
  navBordered: "px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-gray-300 dark:border-gray-600 rounded-full hover:border-indigo-600 dark:hover:border-indigo-400",
  
  // Primary button
  primary: "px-8 py-4 bg-indigo-600 text-white rounded-full text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl",
  primaryFull: "w-full py-4 bg-indigo-600 dark:bg-indigo-400 text-white dark:text-gray-900 rounded-xl font-semibold text-lg hover:bg-indigo-700 dark:hover:bg-indigo-300 transition-colors",
  primarySmall: "w-full text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-1.5 transition-colors",
  primaryAction: "flex-1 py-3 bg-indigo-400 dark:bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-300 dark:hover:bg-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
  primaryConfirm: "flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors",
  
  // Secondary button
  secondary: "px-8 py-4 bg-white text-indigo-600 rounded-full text-lg font-semibold hover:bg-gray-50 transition-colors border-2 border-indigo-600",
  secondaryCancel: "flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors",
  
  // Link button
  link: "text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300",
  
  // Back button
  back: "px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2",
  backText: "flex-1 py-3 text-indigo-300 dark:text-indigo-300 hover:text-indigo-200 dark:hover:text-indigo-200 transition-colors",
  backTextDark: "flex-1 py-3 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors",
  
  // Icon button
  icon: "text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-200 transition-colors flex items-center gap-2",
  iconClose: "absolute -top-2 -right-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-1 transition-colors",
  
  // Location button
  location: "w-full py-3 px-4 bg-indigo-500 dark:bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-600 dark:hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
  
  // Liked listings button
  liked: "px-3 md:px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors flex items-center gap-2 font-semibold text-sm md:text-base",
  
  // Option button (for commute preferences)
  option: "w-full py-4 rounded-xl font-semibold transition-all",
  optionSelected: "bg-gray-700 dark:bg-gray-600 text-white border-2 border-indigo-400",
  optionUnselected: "bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
};

  // Input styles
export const inputStyles = {
  // Standard input
  standard: "w-full px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500",
  standardLarge: "w-full px-4 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400",
  
  // Label
  label: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
  labelBlock: "text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block",
  labelSmall: "text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide",
  labelFlex: "flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300",
};

// Badge/Tag styles
export const badgeStyles = {
  default: "px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium",
  small: "px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs",
};

// Card/Container styles
export const containerStyles = {
  // Card
  card: "bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden",
  cardHover: "bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer",
  cardSmall: "bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700",
  
  // Section background
  section: "bg-gray-50 dark:bg-gray-700/50 rounded-xl",
  sectionIndigo: "bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-800",
  sectionHighlight: "p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-indigo-300 dark:border-indigo-600 shadow-lg",
  
  // Page background
  page: "min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900",
  pageIndigo: "min-h-screen bg-indigo-50 dark:bg-gray-900",
  pageGray: "min-h-screen bg-gray-100 dark:bg-gray-900",
  
  // Dialog/Modal
  dialogOverlay: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",
  dialog: "bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full",
  
  // Dropdown/Suggestions
  dropdown: "absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto",
  dropdownItem: "w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0",
};

// Layout styles
export const layoutStyles = {
  // Container
  container: "container mx-auto px-6",
  containerMax: "container mx-auto px-6 max-w-4xl",
  containerMax6xl: "container mx-auto px-6 max-w-6xl",
  containerNav: "container mx-auto px-6 py-6",
  containerHero: "container mx-auto px-6 py-20",
  
  // Flex
  flexBetween: "flex items-center justify-between",
  flexCenter: "flex items-center justify-center",
  flexColCenter: "flex flex-col items-center justify-center",
  flexGap: "flex items-center gap-3",
  flexGap2: "flex items-center gap-2",
  flexGap4: "flex items-center gap-4",
  
  // Grid
  grid2Col: "grid md:grid-cols-2 gap-6",
  grid3Col: "grid md:grid-cols-2 lg:grid-cols-3 gap-6",
  
  // Spacing
  spaceY4: "space-y-4",
  spaceY6: "space-y-6",
  
  // Position
  absoluteTopRight: "absolute top-6 right-6",
  absoluteTopLeft: "absolute top-6 left-6",
  fixedBottomRight: "fixed bottom-4 right-4 z-40 transition-all duration-300",
  fixedBottomLeft: "fixed bottom-4 left-4 z-40 transition-all duration-300",
};


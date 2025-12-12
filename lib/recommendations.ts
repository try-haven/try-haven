import { ApartmentListing } from "./data";
import { calculateDistance, scoreByDistance } from "./geocoding";

interface UserPreferences {
  address?: string;
  latitude?: number; // User's preferred location latitude
  longitude?: number; // User's preferred location longitude
  commute?: string[];
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqftMin?: number;
  sqftMax?: number;
  minRating?: number; // Minimum average rating (0-5 scale)
}

interface ListingWithScore extends ApartmentListing {
  matchScore: number;
  isTopPick: boolean;
}

interface SwipeHistory {
  listingId: string;
  liked: boolean;
}

interface LearnedPreferences extends Partial<UserPreferences> {
  preferredAmenities?: Map<string, number>; // Amenity -> frequency in liked listings
  preferredLocations?: string[]; // Common location keywords (cities, neighborhoods)
  avgImageCount?: number; // Average number of images in liked listings
  avgDescriptionLength?: number; // Average description length in liked listings
}

/**
 * Learn user preferences from their swipe history
 * This extracts patterns from listings the user has liked
 */
function learnFromSwipeHistory(
  swipeHistory: SwipeHistory[],
  allListings: ApartmentListing[]
): LearnedPreferences {
  // Get all liked listings
  const likedListingIds = swipeHistory.filter((s) => s.liked).map((s) => s.listingId);
  const likedListings = allListings.filter((l) => likedListingIds.includes(l.id));

  // Get all disliked listings for contrast learning
  const dislikedListingIds = swipeHistory.filter((s) => !s.liked).map((s) => s.listingId);
  const dislikedListings = allListings.filter((l) => dislikedListingIds.includes(l.id));

  if (likedListings.length === 0) {
    return {};
  }

  // Use median for more robust estimates
  const median = (arr: number[]) => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  // Learn basic numeric preferences
  const prices = likedListings.map((l) => l.price);
  const bedroomCounts = likedListings.map((l) => l.bedrooms);
  const bathroomCounts = likedListings.map((l) => l.bathrooms);
  const sqfts = likedListings.map((l) => l.sqft);

  const avgPrice = median(prices);
  const avgBedrooms = Math.round(median(bedroomCounts));
  const avgBathrooms = Math.round(median(bathroomCounts)); // Round to nearest integer
  const avgSqft = median(sqfts);

  // Learn amenity preferences
  const amenityFrequency = new Map<string, number>();
  likedListings.forEach((listing) => {
    if (listing.amenities) {
      listing.amenities.forEach((amenity) => {
        const normalized = amenity.toLowerCase().trim();
        amenityFrequency.set(normalized, (amenityFrequency.get(normalized) || 0) + 1);
      });
    }
  });

  // Calculate amenity preference strength (liked vs disliked)
  const dislikedAmenityFrequency = new Map<string, number>();
  dislikedListings.forEach((listing) => {
    if (listing.amenities) {
      listing.amenities.forEach((amenity) => {
        const normalized = amenity.toLowerCase().trim();
        dislikedAmenityFrequency.set(normalized, (dislikedAmenityFrequency.get(normalized) || 0) + 1);
      });
    }
  });

  // Adjust amenity scores based on contrast with disliked listings
  amenityFrequency.forEach((likedCount, amenity) => {
    const dislikedCount = dislikedAmenityFrequency.get(amenity) || 0;
    const likeRate = likedCount / (likedCount + dislikedCount);
    // Boost amenities that appear more in liked than disliked
    amenityFrequency.set(amenity, likeRate * likedCount);
  });

  // Learn location preferences
  const locationKeywords = new Map<string, number>();
  likedListings.forEach((listing) => {
    // Extract city/neighborhood from address (split by comma)
    const parts = listing.address.split(",").map((s) => s.trim());
    parts.forEach((part) => {
      const normalized = part.toLowerCase();
      locationKeywords.set(normalized, (locationKeywords.get(normalized) || 0) + 1);
    });
  });

  // Get top location keywords (appear in at least 20% of liked listings)
  const minLocationFrequency = Math.max(1, Math.floor(likedListings.length * 0.2));
  const preferredLocations = Array.from(locationKeywords.entries())
    .filter(([_, count]) => count >= minLocationFrequency)
    .map(([location, _]) => location);

  // Learn quality preferences
  const imageCounts = likedListings
    .filter((l) => l.images)
    .map((l) => l.images.length);
  const descriptionLengths = likedListings
    .filter((l) => l.description)
    .map((l) => l.description?.length || 0);

  const avgImageCount = imageCounts.length > 0 ? median(imageCounts) : undefined;
  const avgDescriptionLength = descriptionLengths.length > 0 ? median(descriptionLengths) : undefined;

  // Create range around median values (±20% for price/sqft)
  return {
    priceMin: Math.floor(avgPrice * 0.8),
    priceMax: Math.ceil(avgPrice * 1.2),
    bedrooms: avgBedrooms,
    bathrooms: avgBathrooms,
    sqftMin: Math.floor(avgSqft * 0.8),
    sqftMax: Math.ceil(avgSqft * 1.2),
    preferredAmenities: amenityFrequency,
    preferredLocations,
    avgImageCount,
    avgDescriptionLength,
  };
}

/**
 * Calculate match score for a single listing based on SOFT preferences only
 * Hard filters (location, price, bedrooms, bathrooms) are applied before scoring
 * Score is 0-100, where 100 is perfect match
 *
 * Scoring weights (soft factors only):
 * - Location/Distance: 40% (proximity to user's preferred location - PRIMARY FACTOR)
 * - Amenities: 35% (learned from user behavior)
 * - Quality: 15% (images, description completeness)
 * - Rating: 10% (if available)
 */
function calculateMatchScore(
  listing: ApartmentListing,
  preferences: UserPreferences,
  learnedPreferences: Partial<UserPreferences>
): number {
  let score = 0;
  let maxScore = 0;

  // Helper to add score component
  const addScore = (weight: number, match: number) => {
    maxScore += weight;
    score += weight * match;
  };

  // Location/Distance match (weight: 40) - PRIMARY FACTOR
  // Calculate distance between user's preferred location and listing
  // This is the most important factor - far listings are essentially unusable
  if (
    preferences.latitude &&
    preferences.longitude &&
    listing.latitude &&
    listing.longitude
  ) {
    const distanceInMiles = calculateDistance(
      preferences.latitude,
      preferences.longitude,
      listing.latitude,
      listing.longitude
    );
    const locationScore = scoreByDistance(distanceInMiles);
    addScore(40, locationScore);
  }

  // Amenities match (weight: 35) - SECONDARY BEHAVIORAL FACTOR
  // This is learned from user's swipe behavior
  if (learnedPreferences.preferredAmenities && learnedPreferences.preferredAmenities.size > 0) {
    let amenitiesScore = 0;

    if (listing.amenities && listing.amenities.length > 0) {
      // Calculate weighted score based on amenity preferences
      listing.amenities.forEach((amenity) => {
        const normalized = amenity.toLowerCase().trim();
        const preferenceWeight = learnedPreferences.preferredAmenities!.get(normalized) || 0;
        amenitiesScore += preferenceWeight;
      });

      // Normalize by the sum of all preferred amenity weights
      const totalPreferredWeight = Array.from(learnedPreferences.preferredAmenities!.values())
        .reduce((sum, weight) => sum + weight, 0);

      if (totalPreferredWeight > 0) {
        amenitiesScore = Math.min(1, amenitiesScore / (totalPreferredWeight * 0.5)); // 50% coverage = perfect score
      }
    }

    addScore(35, amenitiesScore);
  } else if (listing.amenities && listing.amenities.length > 0) {
    // Fallback: give bonus for having more amenities (before learning kicks in)
    const amenitiesScore = Math.min(1, listing.amenities.length / 8); // 8+ amenities = perfect
    addScore(35, amenitiesScore);
  }

  // Quality match (weight: 15)
  let qualityScore = 0;

  // Image count preference (50% of quality score)
  if (learnedPreferences.avgImageCount && listing.images) {
    const imageCountDiff = Math.abs(listing.images.length - learnedPreferences.avgImageCount);
    const imageScore = Math.max(0, 1 - imageCountDiff / learnedPreferences.avgImageCount);
    qualityScore += imageScore * 0.5;
  } else if (listing.images && listing.images.length >= 5) {
    qualityScore += 0.5; // Full points for 5+ images
  } else if (listing.images && listing.images.length >= 3) {
    qualityScore += 0.35; // Good if has 3+ images
  } else if (listing.images && listing.images.length >= 1) {
    qualityScore += 0.2; // Some points for any images
  }

  // Description length preference (50% of quality score)
  if (learnedPreferences.avgDescriptionLength && listing.description) {
    const descLengthDiff = Math.abs(listing.description.length - learnedPreferences.avgDescriptionLength);
    const descScore = Math.max(0, 1 - descLengthDiff / learnedPreferences.avgDescriptionLength);
    qualityScore += descScore * 0.5;
  } else if (listing.description && listing.description.length > 200) {
    qualityScore += 0.5; // Full points for detailed description
  } else if (listing.description && listing.description.length > 100) {
    qualityScore += 0.35; // Good if has 100+ chars
  } else if (listing.description && listing.description.length > 0) {
    qualityScore += 0.2; // Some points for any description
  }

  addScore(15, qualityScore);

  // Rating match (weight: 10)
  // Use average rating from reviews (0-5 scale)
  if (listing.averageRating !== undefined && listing.totalRatings && listing.totalRatings > 0) {
    // Rating is 0-5 scale, normalize to 0-1
    const ratingScore = listing.averageRating / 5.0;
    addScore(10, ratingScore);
  } else {
    // No rating available - give neutral score to not penalize new listings
    addScore(10, 0.5);
  }

  // Calculate final score (0-100)
  if (maxScore === 0) {
    // Fallback if no scoring factors are available
    return 50; // Neutral score
  }

  return (score / maxScore) * 100;
}

/**
 * Convert learned preferences from stored format (Record) to internal format (Map)
 */
function convertStoredLearnedPreferences(stored: Partial<UserPreferences>): LearnedPreferences {
  const amenitiesRecord = stored.preferredAmenities as Record<string, number> | undefined;

  return {
    priceMin: stored.priceMin,
    priceMax: stored.priceMax,
    bedrooms: stored.bedrooms,
    bathrooms: stored.bathrooms,
    sqftMin: stored.sqftMin,
    sqftMax: stored.sqftMax,
    preferredAmenities: amenitiesRecord ? new Map(Object.entries(amenitiesRecord)) : undefined,
    preferredLocations: stored.preferredLocations,
    avgImageCount: stored.avgImageCount,
    avgDescriptionLength: stored.avgDescriptionLength,
  };
}

/**
 * Check if learned preferences need to be recalculated
 * Returns true if stale (> 1 hour old) or don't exist
 */
export function shouldUpdateLearnedPreferences(userPreferences: UserPreferences, minSwipes: number = 5): boolean {
  const learned = userPreferences.learned;

  // No learned preferences yet
  if (!learned || !learned.updatedAt) return true;

  // Check if we have enough swipe history
  const swipeHistory = getSwipeHistory();
  if (swipeHistory.length < minSwipes) return false;

  // Check if stale (> 1 hour old)
  const updatedAt = new Date(learned.updatedAt).getTime();
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;

  return (now - updatedAt) > ONE_HOUR;
}

/**
 * Calculate and return new learned preferences from swipe history
 * This should be called periodically and saved to the user profile
 */
export function calculateLearnedPreferences(
  listings: ApartmentListing[],
  swipeHistory: SwipeHistory[] = []
): LearnedPreferences {
  const learned = learnFromSwipeHistory(swipeHistory, listings);

  // Convert Map to Record for storage
  return {
    ...learned,
    preferredAmenities: learned.preferredAmenities
      ? Object.fromEntries(learned.preferredAmenities) as any
      : undefined,
  };
}

/**
 * Rank listings based on user preferences and learned preferences
 * Returns listings sorted by match score (highest first)
 */
export function rankListings(
  listings: ApartmentListing[],
  userPreferences: UserPreferences,
  swipeHistory: SwipeHistory[] = []
): ListingWithScore[] {
  // Use stored learned preferences if available, otherwise calculate from swipe history
  let learnedPreferences: LearnedPreferences;

  if (userPreferences.learned && userPreferences.learned.preferredAmenities) {
    // Use stored learned preferences
    learnedPreferences = convertStoredLearnedPreferences(userPreferences.learned as any);
  } else {
    // Fallback: calculate from swipe history (for backwards compatibility)
    learnedPreferences = learnFromSwipeHistory(swipeHistory, listings);
  }

  // Calculate score for each listing
  const listingsWithScores: ListingWithScore[] = listings.map((listing) => {
    const matchScore = calculateMatchScore(listing, userPreferences, learnedPreferences);

    return {
      ...listing,
      matchScore,
      isTopPick: matchScore >= 80, // Top picks are 80+ match score
    };
  });

  // Sort by score (descending)
  return listingsWithScores.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Get swipe history from localStorage
 */
export function getSwipeHistory(): SwipeHistory[] {
  if (typeof window === "undefined") return [];

  try {
    // Get liked listings
    const likedData = localStorage.getItem("haven_liked_listings");
    const liked = likedData ? JSON.parse(likedData) : [];

    // Get reviewed (swiped) listings
    const reviewedData = localStorage.getItem("haven_reviewed_listings");
    const reviewed = reviewedData ? JSON.parse(reviewedData) : [];

    // Combine into swipe history
    const history: SwipeHistory[] = reviewed.map((listingId: string) => ({
      listingId,
      liked: liked.includes(listingId),
    }));

    return history;
  } catch (error) {
    console.error("Error loading swipe history:", error);
    return [];
  }
}

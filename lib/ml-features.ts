import { NYCApartmentListing } from './data';

export interface FeatureVector {
  features: number[]; // Numeric feature array
  featureNames: string[]; // For debugging/interpretability
}

export interface FeatureStats {
  priceMin: number;
  priceMax: number;
  sqftMin: number;
  sqftMax: number;
  ageMin: number;
  ageMax: number;
  renovationAgeMin: number;
  renovationAgeMax: number;
}

/**
 * Calculate statistics from all listings for normalization
 */
export function calculateFeatureStats(listings: NYCApartmentListing[]): FeatureStats {
  const currentYear = new Date().getFullYear();

  const prices = listings.map(l => l.price);
  const sqfts = listings.map(l => l.sqft);
  const ages = listings.map(l => currentYear - l.yearBuilt);
  const renovationAges = listings
    .filter(l => l.renovationYear)
    .map(l => currentYear - l.renovationYear!);

  return {
    priceMin: Math.min(...prices),
    priceMax: Math.max(...prices),
    sqftMin: Math.min(...sqfts),
    sqftMax: Math.max(...sqfts),
    ageMin: Math.min(...ages),
    ageMax: Math.max(...ages),
    renovationAgeMin: renovationAges.length > 0 ? Math.min(...renovationAges) : 0,
    renovationAgeMax: renovationAges.length > 0 ? Math.max(...renovationAges) : 100,
  };
}

/**
 * Normalize value to [0, 1] range using min-max scaling
 */
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5; // Avoid division by zero
  return (value - min) / (max - min);
}

/**
 * Calculate distance between two coordinates in miles (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Extract feature vector from a listing
 *
 * Feature set (18 features):
 * - Price (normalized)
 * - Bedrooms (normalized 0-4+)
 * - Bathrooms (normalized 0-4+)
 * - Sqft (normalized)
 * - Building age (normalized)
 * - Years since renovation (normalized, 0 if never renovated)
 * - 9 binary amenities (0/1)
 * - Has outdoor area (0/1)
 * - Has view (0/1)
 * - Distance to user (normalized, optional - defaults to 0.5 if unavailable)
 */
export function extractFeatures(
  listing: NYCApartmentListing,
  stats: FeatureStats,
  userLocation?: { latitude: number; longitude: number }
): FeatureVector {
  const currentYear = new Date().getFullYear();
  const buildingAge = currentYear - listing.yearBuilt;
  const renovationAge = listing.renovationYear
    ? currentYear - listing.renovationYear
    : stats.renovationAgeMax; // Max age if never renovated

  // Calculate distance if user location provided
  let distanceScore = 0.5; // Neutral if no location
  if (userLocation && listing.latitude && listing.longitude) {
    const distanceInMiles = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      listing.latitude,
      listing.longitude
    );
    // Convert distance to [0, 1] score (0 = far, 1 = close)
    // Using exponential decay: score = exp(-distance/10)
    distanceScore = Math.exp(-distanceInMiles / 10);
  }

  const features = [
    // Continuous features (normalized to [0, 1])
    normalize(listing.price, stats.priceMin, stats.priceMax),
    normalize(Math.min(listing.bedrooms, 4), 0, 4), // Cap at 4+ bedrooms
    normalize(Math.min(listing.bathrooms, 4), 0, 4), // Cap at 4+ bathrooms
    normalize(listing.sqft, stats.sqftMin, stats.sqftMax),
    normalize(buildingAge, stats.ageMin, stats.ageMax),
    normalize(renovationAge, stats.renovationAgeMin, stats.renovationAgeMax),

    // Binary amenities (already 0/1)
    listing.amenities.washerDryerInUnit ? 1 : 0,
    listing.amenities.washerDryerInBuilding ? 1 : 0,
    listing.amenities.dishwasher ? 1 : 0,
    listing.amenities.ac ? 1 : 0,
    listing.amenities.pets ? 1 : 0,
    listing.amenities.fireplace ? 1 : 0,
    listing.amenities.gym ? 1 : 0,
    listing.amenities.parking ? 1 : 0,
    listing.amenities.pool ? 1 : 0,

    // Categorical as binary
    listing.amenities.outdoorArea ? 1 : 0,
    listing.amenities.view ? 1 : 0,

    // Distance score
    distanceScore,
  ];

  const featureNames = [
    'price', 'bedrooms', 'bathrooms', 'sqft', 'buildingAge', 'renovationAge',
    'washerDryerInUnit', 'washerDryerInBuilding', 'dishwasher', 'ac', 'pets',
    'fireplace', 'gym', 'parking', 'pool', 'hasOutdoorArea', 'hasView', 'distanceScore'
  ];

  return { features, featureNames };
}

/**
 * Prepare training data from swipe history
 * Returns features (X) and labels (y)
 */
export function prepareTrainingData(
  listings: NYCApartmentListing[],
  swipeHistory: Array<{ listingId: string; liked: boolean }>,
  stats: FeatureStats,
  userLocation?: { latitude: number; longitude: number }
): { X: number[][]; y: number[] } {
  const X: number[][] = [];
  const y: number[] = [];

  swipeHistory.forEach(swipe => {
    const listing = listings.find(l => l.id === swipe.listingId);
    if (!listing) return; // Skip if listing not found

    const { features } = extractFeatures(listing, stats, userLocation);
    X.push(features);
    y.push(swipe.liked ? 1 : 0);
  });

  return { X, y };
}

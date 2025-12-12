/**
 * Geocoding utilities using OpenStreetMap Nominatim API
 * Free and open-source geocoding service
 */

interface GeocodingResult {
  latitude: number;
  longitude: number;
}

/**
 * Geocode an address to get latitude and longitude
 * Uses Nominatim API (rate limit: 1 request/second)
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  try {
    // Nominatim API endpoint
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Haven App (apartment rental platform)', // Required by Nominatim
      },
    });

    if (!response.ok) {
      console.error('Geocoding API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0]; // Take first result
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
      };
    }

    console.warn('No geocoding results found for address:', address);
    return null;
  } catch (error) {
    console.error('Error geocoding address:', address, error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Score a listing based on distance from user's preferred location
 * Returns 0-1 score (1 = perfect, 0 = too far)
 * Very punishing for far listings - 50+ miles essentially filtered out
 */
export function scoreByDistance(distanceInMiles: number): number {
  if (distanceInMiles <= 5) return 1.0;   // 0-5 miles: perfect
  if (distanceInMiles <= 15) return 0.8;  // 5-15 miles: very good
  if (distanceInMiles <= 30) return 0.5;  // 15-30 miles: moderate
  if (distanceInMiles <= 50) return 0.2;  // 30-50 miles: poor
  return 0.0;                              // 50+ miles: essentially filtered out
}

/**
 * Delay helper for respecting rate limits (Nominatim: 1 req/sec)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

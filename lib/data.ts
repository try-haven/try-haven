export interface Review {
    id: string;
    userName: string;
    userId: string; // Actual user who posted (even if posted anonymously)
    rating: number;
    comment: string;
    date: string;
}

// Price change entry
export interface PriceChange {
    timestamp: string; // ISO date string
    old_price: number;
    new_price: number;
}

// Binary amenity structure for NYC listings
export interface NYCAmenities {
    washerDryerInUnit: boolean;
    washerDryerInBuilding: boolean;
    dishwasher: boolean;
    ac: boolean;
    pets: boolean;
    fireplace: boolean;
    gym: boolean;
    parking: boolean;
    pool: boolean;
    outdoorArea: string | null; // "Balcony", "Patio", "Garden", etc.
    view: string | null; // "City", "Park", "Water", "Other", etc.
}

// NYC-specific listing type with binary amenities
export interface NYCApartmentListing {
    id: string;
    unitId: number;
    managerId: string; // UUID reference to manager profile
    apartmentComplexName?: string; // Manager's apartment complex name
    title: string;
    address: string;
    state: string;
    city: string;
    neighborhood: string;
    latitude?: number;
    longitude?: number;
    price: number;
    dateListedOnDB: string; // Database listing date
    dateAvailable: string;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    yearBuilt: number;
    renovationYear: number | null;
    amenities: NYCAmenities; // Binary amenities object
    images: string[]; // Will need to populate or use placeholders
    description: string; // Will need to generate or populate
    averageRating?: number;
    totalRatings?: number;
    reviews?: Review[];
    priceHistory?: PriceChange[]; // Array of price changes over time
}

export interface ApartmentListing {
    id: string;
    apartmentComplexName?: string; // Manager's apartment complex name
    title: string;
    address: string;
    latitude?: number;
    longitude?: number;
    price: number;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    images: string[];
    amenities: string[];
    description: string;
    availableFrom: string;
    averageRating?: number;
    totalRatings?: number;
    reviews?: Review[];
}

// Generate fake rental history for demo listings
export function initializeFakeRentalHistory() {
  // Load existing changes (for manager listings)
  const existingChanges = localStorage.getItem("haven_listing_changes");
  let allChanges = existingChanges ? JSON.parse(existingChanges) : [];

  // Remove any existing fake listing history (IDs 1-10) to refresh with new data
  allChanges = allChanges.filter((c: any) => {
    const id = parseInt(c.listingId);
    return isNaN(id) || id < 1 || id > 10;
  });

  const changes = allChanges;

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  // Listing 1: Price decreased recently (good deal!)
  changes.push({
    listingId: "1",
    timestamp: now - (5 * oneDay),
    field: "price",
    oldValue: 1950,
    newValue: 1850
  });

  // Listing 2: Price increased recently
  changes.push({
    listingId: "2",
    timestamp: now - (45 * oneDay),
    field: "price",
    oldValue: 2900,
    newValue: 3000
  });
  changes.push({
    listingId: "2",
    timestamp: now - (4 * oneDay),
    field: "price",
    oldValue: 3000,
    newValue: 3200
  });

  // Listing 3: Stable pricing, recent small decrease
  changes.push({
    listingId: "3",
    timestamp: now - (6 * oneDay),
    field: "price",
    oldValue: 2300,
    newValue: 2200
  });

  // Listing 4: Luxury unit, price decreased to attract renters
  changes.push({
    listingId: "4",
    timestamp: now - (30 * oneDay),
    field: "price",
    oldValue: 6200,
    newValue: 5800
  });
  changes.push({
    listingId: "4",
    timestamp: now - (10 * oneDay),
    field: "price",
    oldValue: 5800,
    newValue: 5500
  });

  // Listing 5: Budget option, recent increase
  changes.push({
    listingId: "5",
    timestamp: now - (60 * oneDay),
    field: "price",
    oldValue: 1550,
    newValue: 1600
  });
  changes.push({
    listingId: "5",
    timestamp: now - (6 * oneDay),
    field: "price",
    oldValue: 1600,
    newValue: 1650
  });

  // Listing 6: Premium unit, recent price drop
  changes.push({
    listingId: "6",
    timestamp: now - (3 * oneDay),
    field: "price",
    oldValue: 4200,
    newValue: 3800
  });

  // Listing 7: Garden unit, recent price adjustment
  changes.push({
    listingId: "7",
    timestamp: now - (40 * oneDay),
    field: "price",
    oldValue: 2300,
    newValue: 2500
  });
  changes.push({
    listingId: "7",
    timestamp: now - (5 * oneDay),
    field: "price",
    oldValue: 2500,
    newValue: 2400
  });

  // Listing 8: Family home, recent price increase
  changes.push({
    listingId: "8",
    timestamp: now - (4 * oneDay),
    field: "price",
    oldValue: 6200,
    newValue: 6500
  });

  // Listing 9: Loft, recent decrease
  changes.push({
    listingId: "9",
    timestamp: now - (7 * oneDay),
    field: "price",
    oldValue: 2100,
    newValue: 1950
  });

  // Listing 10: Views unit, price decreased recently
  changes.push({
    listingId: "10",
    timestamp: now - (2 * oneDay),
    field: "price",
    oldValue: 3600,
    newValue: 3400
  });

  localStorage.setItem("haven_listing_changes", JSON.stringify(changes));
}

export const fakeListings: ApartmentListing[] = [
    {
        id: "1",
        title: "Modern Studio in Westwood",
        address: "1234 Westwood Blvd, Los Angeles, CA 90024",
        price: 1850,
        bedrooms: 0,
        bathrooms: 1,
        sqft: 550,
        images: [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
        ],
        amenities: ["In-unit laundry", "Parking", "Pet-friendly", "Gym"],
        description: "Beautiful studio apartment in the heart of Westwood, perfect for students. Walking distance to UCLA campus.",
        availableFrom: "2024-09-01",
    },
    {
        id: "2",
        title: "Spacious 2BR Near Campus",
        address: "5678 Gayley Ave, Los Angeles, CA 90024",
        price: 3200,
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1200,
        images: [
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
            "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800",
            "https://images.unsplash.com/photo-1560448075-cbc16bb4af90?w=800",
        ],
        amenities: ["Dishwasher", "AC", "Balcony", "Parking", "Gym"],
        description: "Bright and airy 2-bedroom apartment with modern finishes. Great natural light and updated kitchen.",
        availableFrom: "2024-08-15",
    },
    {
        id: "3",
        title: "Cozy 1BR with Balcony",
        address: "9012 Hilgard Ave, Los Angeles, CA 90024",
        price: 2200,
        bedrooms: 1,
        bathrooms: 1,
        sqft: 750,
        images: [
            "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
            "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800",
        ],
        amenities: ["Balcony", "Parking", "Pet-friendly", "In-unit laundry"],
        description: "Charming one-bedroom with private balcony overlooking the neighborhood. Recently renovated.",
        availableFrom: "2024-09-01",
    },
    {
        id: "4",
        title: "Luxury 3BR Penthouse",
        address: "3456 Sunset Blvd, Los Angeles, CA 90028",
        price: 5500,
        bedrooms: 3,
        bathrooms: 2.5,
        sqft: 1800,
        images: [
            "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800",
            "https://images.unsplash.com/photo-1560449752-7d2e0b0b0b0b?w=800",
            "https://images.unsplash.com/photo-1560448204-61dc36dc5e5a?w=800",
        ],
        amenities: ["Rooftop access", "Gym", "Pool", "Concierge", "Parking", "AC"],
        description: "Stunning penthouse with panoramic city views. High-end finishes and premium amenities.",
        availableFrom: "2024-10-01",
    },
    {
        id: "5",
        title: "Affordable Studio Near Metro",
        address: "7890 Santa Monica Blvd, Los Angeles, CA 90046",
        price: 1650,
        bedrooms: 0,
        bathrooms: 1,
        sqft: 500,
        images: [
            "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
        ],
        amenities: ["Near transit", "Parking", "Pet-friendly"],
        description: "Budget-friendly studio perfect for students. Close to public transportation and local shops.",
        availableFrom: "2024-08-20",
    },
    {
        id: "6",
        title: "Chic 2BR with Rooftop",
        address: "2345 Melrose Ave, Los Angeles, CA 90046",
        price: 3800,
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1300,
        images: [
            "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800",
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
            "https://images.unsplash.com/photo-1560448075-cbc16bb4af90?w=800",
        ],
        amenities: ["Rooftop", "Gym", "Parking", "AC", "Dishwasher", "In-unit laundry"],
        description: "Stylish two-bedroom with access to shared rooftop. Modern design and great location.",
        availableFrom: "2024-09-15",
    },
    {
        id: "7",
        title: "Bright 1BR Garden Unit",
        address: "4567 Beverly Blvd, Los Angeles, CA 90048",
        price: 2400,
        bedrooms: 1,
        bathrooms: 1,
        sqft: 800,
        images: [
            "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
            "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800",
        ],
        amenities: ["Garden access", "Parking", "Pet-friendly", "In-unit laundry"],
        description: "Ground-floor unit with private garden access. Quiet neighborhood, perfect for working from home.",
        availableFrom: "2024-08-25",
    },
    {
        id: "8",
        title: "Modern 4BR House",
        address: "6789 La Cienega Blvd, Los Angeles, CA 90035",
        price: 6500,
        bedrooms: 4,
        bathrooms: 3,
        sqft: 2200,
        images: [
            "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800",
            "https://images.unsplash.com/photo-1560449752-7d2e0b0b0b0b?w=800",
            "https://images.unsplash.com/photo-1560448204-61dc36dc5e5a?w=800",
        ],
        amenities: ["Yard", "Parking", "Gym", "AC", "Dishwasher", "In-unit laundry"],
        description: "Spacious family home with private yard. Perfect for roommates or families. Recently updated.",
        availableFrom: "2024-09-01",
    },
    {
        id: "9",
        title: "Efficient Studio Loft",
        address: "3210 Venice Blvd, Los Angeles, CA 90019",
        price: 1950,
        bedrooms: 0,
        bathrooms: 1,
        sqft: 600,
        images: [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
        ],
        amenities: ["High ceilings", "Parking", "Pet-friendly", "Near transit"],
        description: "Unique loft-style studio with high ceilings and open layout. Great for creative professionals.",
        availableFrom: "2024-08-30",
    },
    {
        id: "10",
        title: "Updated 2BR with Views",
        address: "5432 Wilshire Blvd, Los Angeles, CA 90036",
        price: 3400,
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1250,
        images: [
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
            "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800",
            "https://images.unsplash.com/photo-1560448075-cbc16bb4af90?w=800",
        ],
        amenities: ["City views", "Gym", "Parking", "AC", "Dishwasher", "Balcony"],
        description: "Beautifully updated two-bedroom with stunning city views. Modern kitchen and spacious living area.",
        availableFrom: "2024-09-10",
    },
];



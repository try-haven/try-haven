export interface ApartmentListing {
    id: string;
    title: string;
    address: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    images: string[];
    amenities: string[];
    description: string;
    availableFrom: string;
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



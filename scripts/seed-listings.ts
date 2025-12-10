import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // We'll need this for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  console.log('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local');
  console.log(`Loaded URL: ${supabaseUrl ? 'Yes' : 'No'}`);
  console.log(`Loaded Service Key: ${supabaseServiceKey ? 'Yes' : 'No'}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Fake listings data - 20 diverse apartments across the US
const fakeListings = [
  {
    id: "1",
    title: "Manhattan Studio with City Views",
    address: "425 E 58th St, New York, NY 10022",
    price: 2850,
    bedrooms: 0,
    bathrooms: 1,
    sqft: 500,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    ],
    amenities: ["Doorman", "Gym", "Rooftop deck", "Pet-friendly"],
    description: "Sleek studio in Midtown East with stunning city views. Steps from Central Park and world-class dining.",
    available_from: "2025-02-01",
  },
  {
    id: "2",
    title: "Victorian 2BR in Pacific Heights",
    address: "2340 Pacific Ave, San Francisco, CA 94115",
    price: 4200,
    bedrooms: 2,
    bathrooms: 1.5,
    sqft: 1100,
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
      "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800",
    ],
    amenities: ["Hardwood floors", "Bay windows", "Parking", "In-unit laundry"],
    description: "Charming Victorian flat with original details. Walking distance to Fillmore Street shops.",
    available_from: "2025-01-15",
  },
  {
    id: "3",
    title: "Downtown Austin Loft",
    address: "501 West Ave, Austin, TX 78701",
    price: 2100,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 850,
    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
    ],
    amenities: ["Pool", "Gym", "Bike storage", "AC", "Balcony"],
    description: "Industrial-style loft in the heart of downtown. Walk to Rainey Street bars and Lady Bird Lake.",
    available_from: "2025-03-01",
  },
  {
    id: "4",
    title: "Capitol Hill Townhouse",
    address: "1234 E Pike St, Seattle, WA 98122",
    price: 3400,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1600,
    images: [
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800",
      "https://images.unsplash.com/photo-1560449752-7d2e0b0b0b0b?w=800",
    ],
    amenities: ["Backyard", "In-unit laundry", "Dishwasher", "Pet-friendly"],
    description: "Spacious townhouse with private yard. Minutes from vibrant Capitol Hill nightlife and cafes.",
    available_from: "2025-02-15",
  },
  {
    id: "5",
    title: "Lincoln Park Garden Apartment",
    address: "2156 N Clark St, Chicago, IL 60614",
    price: 1900,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 700,
    images: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    ],
    amenities: ["Hardwood floors", "Garden access", "Parking", "Heat included"],
    description: "Classic Chicago apartment with garden views. Near Lincoln Park Zoo and Lake Michigan.",
    available_from: "2025-01-01",
  },
  {
    id: "6",
    title: "Back Bay Brownstone Suite",
    address: "78 Commonwealth Ave, Boston, MA 02116",
    price: 2600,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 650,
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800",
    ],
    amenities: ["Historic building", "Fireplace", "High ceilings", "Near T"],
    description: "Historic brownstone apartment with period details. Walking distance to Newbury Street shopping.",
    available_from: "2025-02-01",
  },
  {
    id: "7",
    title: "RiNo District Modern 2BR",
    address: "3456 Larimer St, Denver, CO 80205",
    price: 2400,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1000,
    images: [
      "https://images.unsplash.com/photo-1560448075-cbc16bb4af90?w=800",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
    ],
    amenities: ["Mountain views", "Gym", "Bike storage", "AC", "Balcony"],
    description: "Contemporary apartment in trendy RiNo arts district. Near breweries and street art galleries.",
    available_from: "2025-03-15",
  },
  {
    id: "8",
    title: "South Beach Art Deco Studio",
    address: "1020 Ocean Dr, Miami Beach, FL 33139",
    price: 2200,
    bedrooms: 0,
    bathrooms: 1,
    sqft: 550,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
    ],
    amenities: ["Beach access", "Pool", "AC", "Ocean views"],
    description: "Iconic Art Deco building steps from the beach. Perfect South Beach lifestyle location.",
    available_from: "2025-01-10",
  },
  {
    id: "9",
    title: "Pearl District Warehouse Conversion",
    address: "412 NW 9th Ave, Portland, OR 97209",
    price: 2300,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 900,
    images: [
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
      "https://images.unsplash.com/photo-1560449752-7d2e0b0b0b0b?w=800",
    ],
    amenities: ["Exposed brick", "High ceilings", "Bike storage", "Gym"],
    description: "Industrial loft in converted warehouse. Walk to Powell's Books and Portland streetcar.",
    available_from: "2025-02-20",
  },
  {
    id: "10",
    title: "Georgetown Row House",
    address: "3245 P St NW, Washington, DC 20007",
    price: 3800,
    bedrooms: 2,
    bathrooms: 2.5,
    sqft: 1400,
    images: [
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800",
      "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800",
    ],
    amenities: ["Fireplace", "Patio", "Updated kitchen", "Parking"],
    description: "Historic Georgetown row house with modern updates. Cobblestone streets and waterfront nearby.",
    available_from: "2025-01-05",
  },
  {
    id: "11",
    title: "Santa Monica Beach Bungalow",
    address: "234 Ocean Park Blvd, Santa Monica, CA 90405",
    price: 3100,
    bedrooms: 2,
    bathrooms: 1,
    sqft: 950,
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    ],
    amenities: ["Backyard", "Near beach", "Parking", "Pet-friendly"],
    description: "Charming beach bungalow walking distance to Santa Monica Pier. Coastal living at its best.",
    available_from: "2025-03-01",
  },
  {
    id: "12",
    title: "Fishtown Industrial Loft",
    address: "1145 Frankford Ave, Philadelphia, PA 19125",
    price: 1800,
    bedrooms: 2,
    bathrooms: 1,
    sqft: 1100,
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
    ],
    amenities: ["Exposed brick", "High ceilings", "In-unit laundry", "Bike storage"],
    description: "Converted factory loft in hip Fishtown. Near breweries, music venues, and the El.",
    available_from: "2025-02-10",
  },
  {
    id: "13",
    title: "Music Row Modern Studio",
    address: "1702 Division St, Nashville, TN 37203",
    price: 1600,
    bedrooms: 0,
    bathrooms: 1,
    sqft: 600,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
    ],
    amenities: ["Pool", "Gym", "Parking", "AC"],
    description: "Contemporary studio near Music Row recording studios. Walk to honky tonks and live music.",
    available_from: "2025-01-20",
  },
  {
    id: "14",
    title: "Midtown Atlanta High-Rise",
    address: "855 Peachtree St NE, Atlanta, GA 30308",
    price: 2100,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 800,
    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
      "https://images.unsplash.com/photo-1560448075-cbc16bb4af90?w=800",
    ],
    amenities: ["Skyline views", "Concierge", "Gym", "Pool", "Parking"],
    description: "Modern high-rise living in Midtown. Near Piedmont Park, Beltline, and MARTA.",
    available_from: "2025-02-05",
  },
  {
    id: "15",
    title: "North Park Craftsman Duplex",
    address: "3789 30th St, San Diego, CA 92104",
    price: 2700,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1200,
    images: [
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800",
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800",
    ],
    amenities: ["Craftsman details", "Yard", "Parking", "In-unit laundry"],
    description: "Classic Craftsman duplex in vibrant North Park. Walk to cafes, breweries, and Balboa Park.",
    available_from: "2025-03-10",
  },
  {
    id: "16",
    title: "Wicker Park Vintage 3BR",
    address: "1456 N Milwaukee Ave, Chicago, IL 60622",
    price: 2500,
    bedrooms: 3,
    bathrooms: 1.5,
    sqft: 1400,
    images: [
      "https://images.unsplash.com/photo-1560449752-7d2e0b0b0b0b?w=800",
      "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800",
    ],
    amenities: ["Original woodwork", "Deck", "Parking", "Dishwasher"],
    description: "Spacious vintage apartment in trendy Wicker Park. Near Blue Line, boutiques, and nightlife.",
    available_from: "2025-01-25",
  },
  {
    id: "17",
    title: "Cambridge Tech Hub Studio",
    address: "234 Main St, Cambridge, MA 02142",
    price: 2400,
    bedrooms: 0,
    bathrooms: 1,
    sqft: 550,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    ],
    amenities: ["Gym", "Roof deck", "Package room", "Near T"],
    description: "Modern studio in Kendall Square tech hub. Steps from MIT and Red Line.",
    available_from: "2025-02-12",
  },
  {
    id: "18",
    title: "Fremont Houseboat",
    address: "2770 Westlake Ave N, Seattle, WA 98109",
    price: 2900,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 700,
    images: [
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
    ],
    amenities: ["Water views", "Deck", "Unique living", "Dock access"],
    description: "Charming houseboat on Lake Union. Quintessential Seattle floating home experience.",
    available_from: "2025-03-05",
  },
  {
    id: "19",
    title: "East Village Walk-Up",
    address: "128 Avenue A, New York, NY 10009",
    price: 2300,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 650,
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
    ],
    amenities: ["Exposed brick", "Vintage details", "Near L train", "Updated kitchen"],
    description: "Classic East Village charm with modern updates. Heart of downtown nightlife and culture.",
    available_from: "2025-01-18",
  },
  {
    id: "20",
    title: "Hayes Valley Designer 2BR",
    address: "567 Hayes St, San Francisco, CA 94102",
    price: 3900,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1150,
    images: [
      "https://images.unsplash.com/photo-1560448075-cbc16bb4af90?w=800",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
    ],
    amenities: ["Designer finishes", "In-unit laundry", "Parking", "Rooftop access"],
    description: "Beautifully designed apartment in chic Hayes Valley. Walk to shops, restaurants, and parks.",
    available_from: "2025-02-28",
  },
];

// Generate price history
function generatePriceHistory() {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  return [
    // Listing 1: Price decreased recently
    { listing_id: "1", field: "price", old_value: "1950", new_value: "1850", created_at: new Date(now - 5 * oneDay).toISOString() },

    // Listing 2: Price increased recently
    { listing_id: "2", field: "price", old_value: "2900", new_value: "3000", created_at: new Date(now - 45 * oneDay).toISOString() },
    { listing_id: "2", field: "price", old_value: "3000", new_value: "3200", created_at: new Date(now - 4 * oneDay).toISOString() },

    // Listing 3: Stable pricing, recent small decrease
    { listing_id: "3", field: "price", old_value: "2300", new_value: "2200", created_at: new Date(now - 6 * oneDay).toISOString() },

    // Listing 4: Luxury unit, price decreased
    { listing_id: "4", field: "price", old_value: "6200", new_value: "5800", created_at: new Date(now - 30 * oneDay).toISOString() },
    { listing_id: "4", field: "price", old_value: "5800", new_value: "5500", created_at: new Date(now - 10 * oneDay).toISOString() },

    // Listing 5: Budget option, recent increase
    { listing_id: "5", field: "price", old_value: "1550", new_value: "1600", created_at: new Date(now - 60 * oneDay).toISOString() },
    { listing_id: "5", field: "price", old_value: "1600", new_value: "1650", created_at: new Date(now - 15 * oneDay).toISOString() },
  ];
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Step 1: Create a demo manager account
    console.log('Creating demo manager account...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'demo-manager@haven.app',
      password: 'demo123456',
      email_confirm: true,
      user_metadata: {
        username: 'demo-manager',
        user_type: 'manager'
      }
    });

    if (authError && authError.message !== 'User already registered') {
      throw authError;
    }

    const managerId = authData?.user?.id;

    if (!managerId) {
      // User might already exist, try to get their ID
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const demoManager = existingUsers?.users.find(u => u.email === 'demo-manager@haven.app');

      if (!demoManager) {
        throw new Error('Could not create or find demo manager user');
      }

      console.log('✓ Demo manager already exists\n');
    } else {
      console.log('✓ Demo manager created\n');
    }

    const finalManagerId = managerId || existingUsers?.users.find(u => u.email === 'demo-manager@haven.app')?.id;

    // Step 2: Insert listings (let Supabase generate UUIDs)
    console.log('Inserting sample listings...');
    const listingsToInsert = fakeListings.map(listing => ({
      manager_id: finalManagerId,
      title: listing.title,
      address: listing.address,
      price: listing.price,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      sqft: listing.sqft,
      images: listing.images,
      amenities: listing.amenities,
      description: listing.description,
      available_from: listing.available_from,
    }));

    const { data: insertedListings, error: listingsError } = await supabase
      .from('listings')
      .insert(listingsToInsert)
      .select();

    if (listingsError) throw listingsError;
    console.log(`✓ Inserted ${fakeListings.length} listings\n`);

    // Map old IDs to new UUIDs for price history
    const idMapping: Record<string, string> = {};
    fakeListings.forEach((listing, index) => {
      if (insertedListings && insertedListings[index]) {
        idMapping[listing.id] = insertedListings[index].id;
      }
    });

    // Step 3: Insert price history with mapped UUIDs
    console.log('Inserting price history...');
    const priceHistory = generatePriceHistory();

    // Map old IDs to new UUIDs
    const mappedPriceHistory = priceHistory.map(change => ({
      ...change,
      listing_id: idMapping[change.listing_id] || change.listing_id
    }));

    const { error: historyError } = await supabase
      .from('listing_changes')
      .insert(mappedPriceHistory);

    if (historyError) throw historyError;
    console.log(`✓ Inserted ${priceHistory.length} price changes\n`);

    console.log('✅ Database seeding completed successfully!');
    console.log('\nDemo manager credentials:');
    console.log('Email: demo-manager@haven.app');
    console.log('Password: demo123456');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();

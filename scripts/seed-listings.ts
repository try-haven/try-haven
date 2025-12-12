import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import * as path from 'path';
import { geocodeAddress, delay } from '../lib/geocoding';

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

// Fake listings data - 42 diverse apartments across the US (22 in Bay Area)
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
  // Bay Area Expansion - San Francisco Neighborhoods
  {
    id: "21",
    title: "Mission District Loft",
    address: "3456 Mission St, San Francisco, CA 94110",
    price: 3200,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 850,
    images: [
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
      "https://images.unsplash.com/photo-1560448075-cbc16bb4af90?w=800",
    ],
    amenities: ["Exposed brick", "High ceilings", "Pet-friendly", "Bike storage", "Natural light"],
    description: "Vibrant loft in the heart of the Mission. Walk to Dolores Park, taquerias, and murals.",
    available_from: "2025-01-15",
  },
  {
    id: "22",
    title: "Marina District Studio with Bay Views",
    address: "2134 Lombard St, San Francisco, CA 94123",
    price: 2600,
    bedrooms: 0,
    bathrooms: 1,
    sqft: 550,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    ],
    amenities: ["Bay views", "Gym", "Doorman", "Package room"],
    description: "Modern studio with Golden Gate Bridge views. Steps from Chestnut Street shops and Marina Green.",
    available_from: "2025-02-01",
  },
  {
    id: "23",
    title: "SoMa Tech Hub 2BR",
    address: "789 Folsom St, San Francisco, CA 94107",
    price: 4100,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1100,
    images: [
      "https://images.unsplash.com/photo-1560448075-cbc16bb4af90?w=800",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
      "https://images.unsplash.com/photo-1560449752-7d2e0b0b0b0b?w=800",
    ],
    amenities: ["Rooftop deck", "Gym", "In-unit laundry", "Parking", "Pool", "Concierge"],
    description: "Luxury apartment in SoMa tech corridor. Walk to BART, Oracle Park, and startup scene.",
    available_from: "2025-03-01",
  },
  {
    id: "24",
    title: "Sunset District Family Home",
    address: "1523 Judah St, San Francisco, CA 94122",
    price: 3600,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1400,
    images: [
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800",
      "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800",
    ],
    amenities: ["Backyard", "In-unit laundry", "Parking", "Dishwasher", "Pet-friendly"],
    description: "Spacious home in quiet Sunset. Close to Ocean Beach and Golden Gate Park.",
    available_from: "2025-01-20",
  },
  {
    id: "25",
    title: "Nob Hill Classic 1BR",
    address: "1234 California St, San Francisco, CA 94108",
    price: 2900,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 750,
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800",
    ],
    amenities: ["Doorman", "Hardwood floors", "Cable car access", "Updated kitchen"],
    description: "Elegant apartment on historic Nob Hill. Walk to Grace Cathedral and cable cars.",
    available_from: "2025-02-15",
  },
  {
    id: "26",
    title: "Castro Sunny 2BR",
    address: "4567 18th St, San Francisco, CA 94114",
    price: 3400,
    bedrooms: 2,
    bathrooms: 1.5,
    sqft: 1000,
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
    ],
    amenities: ["Bay windows", "Hardwood floors", "In-unit laundry", "Deck"],
    description: "Bright apartment in vibrant Castro neighborhood. Near cafes, bars, and Dolores Park.",
    available_from: "2025-03-10",
  },
  {
    id: "27",
    title: "Richmond District Quiet Retreat",
    address: "2345 Clement St, San Francisco, CA 94121",
    price: 2400,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 700,
    images: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    ],
    amenities: ["Parking", "Dishwasher", "Updated kitchen", "Near park"],
    description: "Peaceful apartment in Inner Richmond. Close to Golden Gate Park and Clement Street eateries.",
    available_from: "2025-01-10",
  },
  {
    id: "28",
    title: "North Beach Italian Charm",
    address: "678 Columbus Ave, San Francisco, CA 94133",
    price: 2800,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 650,
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    ],
    amenities: ["Historic building", "Bay windows", "Hardwood floors", "Near transit"],
    description: "Charming apartment in Little Italy. Walk to Washington Square, cafes, and Italian bakeries.",
    available_from: "2025-02-20",
  },
  {
    id: "29",
    title: "Potrero Hill Urban Flat",
    address: "890 18th St, San Francisco, CA 94107",
    price: 3100,
    bedrooms: 2,
    bathrooms: 1,
    sqft: 950,
    images: [
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
      "https://images.unsplash.com/photo-1560448075-cbc16bb4af90?w=800",
    ],
    amenities: ["City views", "In-unit laundry", "Parking", "Balcony", "Pet-friendly"],
    description: "Modern flat on Potrero Hill with sweeping city views. Near cafes and Dogpatch breweries.",
    available_from: "2025-03-05",
  },
  {
    id: "30",
    title: "Haight-Ashbury Victorian",
    address: "1567 Haight St, San Francisco, CA 94117",
    price: 2700,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 800,
    images: [
      "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800",
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800",
    ],
    amenities: ["Victorian details", "Fireplace", "Hardwood floors", "Near park"],
    description: "Historic Victorian in iconic Haight. Walk to Golden Gate Park, vintage shops, and music venues.",
    available_from: "2025-01-25",
  },
  {
    id: "31",
    title: "Dogpatch Warehouse Loft",
    address: "2234 3rd St, San Francisco, CA 94107",
    price: 3500,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1200,
    images: [
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
      "https://images.unsplash.com/photo-1560448075-cbc16bb4af90?w=800",
    ],
    amenities: ["Exposed brick", "High ceilings", "In-unit laundry", "Parking", "Bike storage", "Gym"],
    description: "Industrial loft in artsy Dogpatch. Near breweries, Pier 70, and waterfront parks.",
    available_from: "2025-02-12",
  },
  {
    id: "32",
    title: "Cole Valley Cozy 1BR",
    address: "789 Cole St, San Francisco, CA 94117",
    price: 2500,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 650,
    images: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    ],
    amenities: ["Hardwood floors", "Updated kitchen", "Parking", "Pet-friendly"],
    description: "Quiet apartment in charming Cole Valley. Near N-Judah, cafes, and Golden Gate Park.",
    available_from: "2025-03-15",
  },
  {
    id: "33",
    title: "Embarcadero Luxury Studio",
    address: "345 Spear St, San Francisco, CA 94105",
    price: 3000,
    bedrooms: 0,
    bathrooms: 1,
    sqft: 600,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
      "https://images.unsplash.com/photo-1560448075-cbc16bb4af90?w=800",
    ],
    amenities: ["Bay views", "Concierge", "Gym", "Pool", "Rooftop deck", "Doorman"],
    description: "High-end studio with waterfront views. Walk to Ferry Building, restaurants, and BART.",
    available_from: "2025-01-05",
  },
  {
    id: "34",
    title: "Russian Hill Apartment",
    address: "1890 Hyde St, San Francisco, CA 94109",
    price: 3300,
    bedrooms: 2,
    bathrooms: 1,
    sqft: 900,
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800",
    ],
    amenities: ["City views", "Cable car access", "Hardwood floors", "Updated kitchen"],
    description: "Classic Russian Hill apartment with Alcatraz views. Near Lombard Street and cable cars.",
    available_from: "2025-02-25",
  },
  {
    id: "35",
    title: "Bernal Heights Hillside Home",
    address: "456 Cortland Ave, San Francisco, CA 94110",
    price: 2800,
    bedrooms: 2,
    bathrooms: 1,
    sqft: 900,
    images: [
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800",
      "https://images.unsplash.com/photo-1560449752-7d2e0b0b0b0b?w=800",
    ],
    amenities: ["Backyard", "Parking", "In-unit laundry", "Pet-friendly", "Views"],
    description: "Sunny home on Bernal Hill with panoramic views. Walk to village shops and hiking trails.",
    available_from: "2025-03-20",
  },
  // East Bay
  {
    id: "36",
    title: "Oakland Lake Merritt Condo",
    address: "567 Grand Ave, Oakland, CA 94610",
    price: 2300,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 750,
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
    ],
    amenities: ["Lake views", "Gym", "Parking", "In-unit laundry", "Balcony"],
    description: "Modern condo overlooking Lake Merritt. Walk to farmers market, restaurants, and BART.",
    available_from: "2025-01-12",
  },
  {
    id: "37",
    title: "Berkeley Student-Friendly 2BR",
    address: "2345 Telegraph Ave, Berkeley, CA 94704",
    price: 2600,
    bedrooms: 2,
    bathrooms: 1,
    sqft: 850,
    images: [
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
    ],
    amenities: ["Near campus", "Bike storage", "Dishwasher", "Hardwood floors"],
    description: "Convenient apartment near UC Berkeley. Walk to campus, bookstores, and Telegraph cafes.",
    available_from: "2025-02-08",
  },
  {
    id: "38",
    title: "Temescal Arts District Loft",
    address: "4567 Telegraph Ave, Oakland, CA 94609",
    price: 2400,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 800,
    images: [
      "https://images.unsplash.com/photo-1560448075-cbc16bb4af90?w=800",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
    ],
    amenities: ["Exposed brick", "High ceilings", "Parking", "Pet-friendly", "Bike storage"],
    description: "Creative loft in trendy Temescal. Near breweries, art galleries, and indie shops.",
    available_from: "2025-03-08",
  },
  // South Bay
  {
    id: "39",
    title: "Palo Alto Near Stanford",
    address: "890 University Ave, Palo Alto, CA 94301",
    price: 3800,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1100,
    images: [
      "https://images.unsplash.com/photo-1560448075-cbc16bb4af90?w=800",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
      "https://images.unsplash.com/photo-1560449752-7d2e0b0b0b0b?w=800",
    ],
    amenities: ["Gym", "Pool", "In-unit laundry", "Parking", "Balcony", "Bike storage"],
    description: "Modern apartment near Stanford campus and University Avenue. Walk to shops and Caltrain.",
    available_from: "2025-01-18",
  },
  {
    id: "40",
    title: "Mountain View Tech Hub Studio",
    address: "1234 Castro St, Mountain View, CA 94041",
    price: 2900,
    bedrooms: 0,
    bathrooms: 1,
    sqft: 550,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    ],
    amenities: ["Gym", "Pool", "Parking", "Near Caltrain", "Bike storage"],
    description: "Efficient studio near Google campus. Walk to downtown Mountain View and VTA light rail.",
    available_from: "2025-02-18",
  },
  {
    id: "41",
    title: "San Jose Downtown High-Rise",
    address: "345 S 1st St, San Jose, CA 95113",
    price: 2700,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 800,
    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
      "https://images.unsplash.com/photo-1560448075-cbc16bb4af90?w=800",
    ],
    amenities: ["City views", "Concierge", "Gym", "Pool", "Parking", "Rooftop deck"],
    description: "Urban living in downtown San Jose. Walk to SAP Center, restaurants, and VTA.",
    available_from: "2025-03-12",
  },
  {
    id: "42",
    title: "Sunnyvale Family Townhouse",
    address: "678 E El Camino Real, Sunnyvale, CA 94087",
    price: 3400,
    bedrooms: 3,
    bathrooms: 2.5,
    sqft: 1500,
    images: [
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800",
      "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800",
      "https://images.unsplash.com/photo-1560449752-7d2e0b0b0b0b?w=800",
    ],
    amenities: ["Backyard", "In-unit laundry", "Parking", "Dishwasher", "Pet-friendly", "Garage"],
    description: "Spacious townhouse in Sunnyvale tech corridor. Near Apple, parks, and excellent schools.",
    available_from: "2025-01-28",
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

    if (authError && authError.code !== 'email_exists' && authError.message !== 'User already registered') {
      throw authError;
    }

    let managerId = authData?.user?.id;
    let demoManager;

    if (!managerId) {
      // User might already exist, try to get their ID
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      demoManager = existingUsers?.users.find(u => u.email === 'demo-manager@haven.app');

      if (!demoManager) {
        throw new Error('Could not create or find demo manager user');
      }

      managerId = demoManager.id;
      console.log('✓ Demo manager already exists\n');
    } else {
      console.log('✓ Demo manager created\n');
    }

    const finalManagerId = managerId;

    // Step 2: Geocode addresses and insert listings
    console.log('Geocoding addresses and inserting sample listings...');
    console.log('(This may take a few minutes due to API rate limits)\n');

    const listingsToInsert = [];

    for (let i = 0; i < fakeListings.length; i++) {
      const listing = fakeListings[i];

      // Geocode the address
      console.log(`Geocoding ${i + 1}/${fakeListings.length}: ${listing.address}`);
      const coords = await geocodeAddress(listing.address);

      listingsToInsert.push({
        manager_id: finalManagerId,
        title: listing.title,
        address: listing.address,
        latitude: coords?.latitude || null,
        longitude: coords?.longitude || null,
        price: listing.price,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        sqft: listing.sqft,
        images: listing.images,
        amenities: listing.amenities,
        description: listing.description,
        available_from: listing.available_from,
      });

      // Rate limit: 1 request per second (Nominatim requirement)
      if (i < fakeListings.length - 1) {
        await delay(1100); // 1.1 seconds to be safe
      }
    }

    const { data: insertedListings, error: listingsError } = await supabase
      .from('listings')
      .insert(listingsToInsert)
      .select();

    if (listingsError) throw listingsError;

    const geocodedCount = listingsToInsert.filter(l => l.latitude && l.longitude).length;
    console.log(`✓ Inserted ${fakeListings.length} listings (22 in Bay Area)`);
    console.log(`✓ Geocoded ${geocodedCount}/${fakeListings.length} addresses\n`);

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

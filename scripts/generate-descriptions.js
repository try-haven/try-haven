/**
 * Script to generate apartment descriptions for NYC listings
 *
 * This script:
 * 1. Fetches all listings from the listings_nyc table
 * 2. Generates realistic descriptions based on listing features
 * 3. Updates the database with the descriptions
 *
 * Usage:
 *   node scripts/generate-descriptions.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    }
  });
}

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Description templates and components
const openings = [
  "Welcome to this",
  "Discover this",
  "Experience luxury in this",
  "Modern living awaits in this",
  "Beautifully designed",
  "Stylish and spacious",
  "Contemporary",
  "Charming",
  "Elegant",
  "Inviting"
];

const bedroomDescriptors = {
  0: ["studio apartment", "efficient studio", "cozy studio"],
  1: ["one-bedroom apartment", "spacious one-bedroom", "bright one-bedroom"],
  2: ["two-bedroom apartment", "generous two-bedroom", "open two-bedroom"],
  3: ["three-bedroom apartment", "sprawling three-bedroom", "spacious three-bedroom"],
  4: ["four-bedroom apartment", "expansive four-bedroom", "luxurious four-bedroom"]
};

const neighborhoodPhrases = [
  "in the heart of",
  "nestled in",
  "located in prime",
  "situated in vibrant",
  "in the desirable",
  "perfectly positioned in"
];

const amenityHighlights = {
  washerDryer: ["in-unit washer/dryer", "convenient laundry", "private laundry"],
  dishwasher: ["modern dishwasher", "full-size dishwasher"],
  ac: ["central air conditioning", "climate control", "AC throughout"],
  gym: ["building gym", "fitness center access", "state-of-the-art gym"],
  parking: ["parking available", "included parking", "garage parking"],
  pool: ["building pool", "rooftop pool", "swimming pool access"]
};

const closingPhrases = [
  "Don't miss this opportunity!",
  "Schedule your viewing today!",
  "Available for immediate move-in.",
  "Contact us to learn more!",
  "Perfect for discerning renters.",
  "Your new home awaits!"
];

/**
 * Generate a realistic description for a listing
 */
function generateDescription(listing) {
  const parts = [];

  // Opening
  const opening = openings[Math.floor(Math.random() * openings.length)];

  // Bedroom description
  const bedrooms = parseInt(listing["Bedrooms"]) || 0;
  const bedroomOptions = bedroomDescriptors[bedrooms] || bedroomDescriptors[2];
  const bedroomDesc = bedroomOptions[Math.floor(Math.random() * bedroomOptions.length)];

  // Neighborhood
  const neighborhoodPhrase = neighborhoodPhrases[Math.floor(Math.random() * neighborhoodPhrases.length)];
  const neighborhood = listing["Neighborhood"];

  // Build first sentence
  parts.push(`${opening} ${bedroomDesc} ${neighborhoodPhrase} ${neighborhood}.`);

  // Add square footage and bathrooms
  const sqft = listing["Sqft"];
  const bathrooms = listing["Bathrooms"];
  parts.push(`This ${sqft} sq ft home features ${bathrooms} ${bathrooms === 1 ? 'bathroom' : 'bathrooms'}.`);

  // Highlight key amenities
  const amenities = [];
  if (listing["Washer/Dryer in unit"] === 1 || listing["Washer/Dryer in unit"] === "1") {
    amenities.push("in-unit washer/dryer");
  }
  if (listing["Dishwasher"] === 1 || listing["Dishwasher"] === "1") {
    amenities.push("modern dishwasher");
  }
  if (listing["AC"] === 1 || listing["AC"] === "1") {
    amenities.push("central air");
  }
  if (listing["Gym"] === 1 || listing["Gym"] === "1") {
    amenities.push("building gym");
  }
  if (listing["Parking"] === 1 || listing["Parking"] === "1") {
    amenities.push("parking");
  }
  if (listing["Pool"] === 1 || listing["Pool"] === "1") {
    amenities.push("pool access");
  }

  if (amenities.length > 0) {
    if (amenities.length === 1) {
      parts.push(`Enjoy the convenience of ${amenities[0]}.`);
    } else if (amenities.length === 2) {
      parts.push(`Enjoy ${amenities[0]} and ${amenities[1]}.`);
    } else {
      const lastAmenity = amenities.pop();
      parts.push(`Enjoy ${amenities.join(', ')}, and ${lastAmenity}.`);
    }
  }

  // Add view if available
  if (listing["View"] && listing["View"].toLowerCase() !== 'none') {
    parts.push(`Take in stunning ${listing["View"].toLowerCase()} views from your windows.`);
  }

  // Add outdoor area if available
  const outdoorArea = listing["Outdoor Area"];
  if (outdoorArea && outdoorArea.toLowerCase() !== 'none') {
    parts.push(`Relax on your private ${outdoorArea.toLowerCase()}.`);
  }

  // Add year info if recently built or renovated
  const yearBuilt = listing["Year Built"];
  const renovationYear = listing["Renovation Year"];
  const currentYear = new Date().getFullYear();

  if (renovationYear && currentYear - renovationYear <= 5) {
    parts.push(`Recently renovated in ${renovationYear}.`);
  } else if (currentYear - yearBuilt <= 10) {
    parts.push(`Built in ${yearBuilt}, this modern apartment offers contemporary finishes.`);
  }

  // Closing
  const closing = closingPhrases[Math.floor(Math.random() * closingPhrases.length)];
  parts.push(closing);

  return parts.join(' ');
}

/**
 * Main function
 */
async function main() {
  console.log('📝 Starting description generation for NYC listings...\n');

  try {
    // Fetch all listings
    console.log('📥 Fetching listings from database...');
    const { data: listings, error: fetchError } = await supabase
      .from('listings_nyc')
      .select('*')
      .order('Unit ID', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching listings:', fetchError);
      process.exit(1);
    }

    if (!listings || listings.length === 0) {
      console.log('⚠️  No listings found in database');
      process.exit(0);
    }

    console.log(`✅ Found ${listings.length} listings\n`);

    // Process each listing
    let successCount = 0;
    let errorCount = 0;

    for (const listing of listings) {
      try {
        // Generate description
        const description = generateDescription(listing);

        // Update database
        const { error: updateError } = await supabase
          .from('listings_nyc')
          .update({ description })
          .eq('Unit ID', listing['Unit ID']);

        if (updateError) {
          console.error(`❌ Error updating listing ${listing['Unit ID']}:`, updateError.message);
          errorCount++;
        } else {
          successCount++;
          if (successCount <= 5) {
            // Show first 5 as examples
            console.log(`✅ Listing ${listing['Unit ID']} (${listing['Neighborhood']}):`);
            console.log(`   "${description.substring(0, 100)}..."\n`);
          } else if (successCount % 20 === 0) {
            console.log(`✅ Updated ${successCount} listings...`);
          }
        }
      } catch (err) {
        console.error(`❌ Error processing listing ${listing['Unit ID']}:`, err.message);
        errorCount++;
      }
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Total listings: ${listings.length}`);
    console.log(`   ✅ Successfully updated: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    if (successCount > 0) {
      console.log('\n🎉 Descriptions generated successfully!');
    }

  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  }
}

// Run the script
main();

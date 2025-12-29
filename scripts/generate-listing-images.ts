/**
 * Script to generate placeholder images for NYC listings
 *
 * This script:
 * 1. Fetches all listings from the listings_nyc table
 * 2. Generates 3-5 placeholder images per listing using Unsplash
 * 3. Updates the database with the image URLs
 *
 * Usage:
 *   npx ts-node scripts/generate-listing-images.ts
 *
 * Requirements:
 *   - Supabase credentials in environment variables
 *   - Internet connection to fetch Unsplash images
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin access

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Generate image URLs for a listing based on its attributes
 * Uses Unsplash Source API for high-quality apartment photos
 */
function generateListingImages(listing: any): string[] {
  const { Bedrooms, Neighborhood, City, "Outdoor Area": outdoorArea, View: view } = listing;
  const imageCount = Math.floor(Math.random() * 3) + 3; // 3-5 images
  const images: string[] = [];

  // Unsplash Source API categories based on listing features
  const categories = [
    'apartment/interior',
    'apartment/living-room',
    'apartment/bedroom',
    'apartment/kitchen',
  ];

  // Add bathroom if 2+ bathrooms
  if (listing.Bathrooms >= 2) {
    categories.push('apartment/bathroom');
  }

  // Add outdoor images if listing has outdoor area
  if (outdoorArea) {
    categories.push('apartment/balcony');
  }

  // Add view-specific images
  if (view) {
    if (view.toLowerCase().includes('city') || view.toLowerCase().includes('skyline')) {
      categories.push('cityscape/new-york');
    } else if (view.toLowerCase().includes('water')) {
      categories.push('waterfront');
    } else if (view.toLowerCase().includes('park') || view.toLowerCase().includes('garden')) {
      categories.push('park');
    }
  }

  // Shuffle categories and pick imageCount of them
  const shuffled = categories.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, imageCount);

  // Generate Unsplash URLs with consistent dimensions
  // Using seed based on Unit ID for consistency across runs
  for (let i = 0; i < imageCount; i++) {
    const category = selected[i] || 'apartment';
    const seed = `listing-${listing['Unit ID']}-${i}`;
    // Unsplash Source format: https://source.unsplash.com/random/800x600?apartment&sig=<seed>
    const url = `https://source.unsplash.com/800x600/?${category}&sig=${seed}`;
    images.push(url);
  }

  return images;
}

/**
 * Alternative: Generate placeholder images using Lorem Picsum
 * This is more reliable but less relevant to apartment listings
 */
function generatePlaceholderImages(listing: any): string[] {
  const imageCount = Math.floor(Math.random() * 3) + 3; // 3-5 images
  const images: string[] = [];

  for (let i = 0; i < imageCount; i++) {
    // Lorem Picsum format: https://picsum.photos/seed/<seed>/800/600
    const seed = `listing-${listing['Unit ID']}-${i}`;
    const url = `https://picsum.photos/seed/${seed}/800/600`;
    images.push(url);
  }

  return images;
}

/**
 * Main function to process all listings
 */
async function main() {
  console.log('🏠 Starting image generation for NYC listings...\n');

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
      console.log('⚠️ No listings found in database');
      process.exit(0);
    }

    console.log(`✅ Found ${listings.length} listings\n`);

    // Process each listing
    let successCount = 0;
    let errorCount = 0;

    for (const listing of listings) {
      try {
        // Generate images (using Unsplash - switch to generatePlaceholderImages for Lorem Picsum)
        const images = generateListingImages(listing);

        // Update database
        const { error: updateError } = await supabase
          .from('listings_nyc')
          .update({ images })
          .eq('Unit ID', listing['Unit ID']);

        if (updateError) {
          console.error(`❌ Error updating listing ${listing['Unit ID']}:`, updateError.message);
          errorCount++;
        } else {
          successCount++;
          console.log(`✅ Updated listing ${listing['Unit ID']} with ${images.length} images`);
        }
      } catch (err: any) {
        console.error(`❌ Error processing listing ${listing['Unit ID']}:`, err.message);
        errorCount++;
      }
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Total listings: ${listings.length}`);
    console.log(`   ✅ Successfully updated: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

  } catch (err: any) {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  }
}

// Run the script
main();

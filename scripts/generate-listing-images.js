/**
 * Script to generate placeholder images for NYC listings
 *
 * This script:
 * 1. Fetches all listings from the listings_nyc table
 * 2. Generates 3-5 placeholder images per listing using Unsplash
 * 3. Updates the database with the image URLs
 *
 * Usage:
 *   node scripts/generate-listing-images.js
 *
 * Requirements:
 *   - Supabase credentials in .env.local file
 *   - Internet connection to fetch Unsplash images
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

// Prefer service role key (bypasses RLS), fallback to anon key
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials.');
  console.error('   Please set NEXT_PUBLIC_SUPABASE_URL and either:');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY (recommended for scripts)');
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY (if RLS is disabled)');
  process.exit(1);
}

if (supabaseServiceKey) {
  console.log('🔑 Using service role key (bypasses RLS)\n');
} else {
  console.log('🔑 Using anon key (requires RLS to be disabled or permissive)\n');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Generate image URLs for a listing based on its attributes
 * Uses curated Unsplash apartment/interior photos
 */
function generateListingImages(listing) {
  const imageCount = Math.floor(Math.random() * 3) + 3; // 3-5 images
  const images = [];

  // Curated Unsplash photo IDs for apartment/interior images
  const apartmentPhotos = {
    livingRoom: [
      'JBwcenOuRCg', 'fIq0tET6llw', 'sGIhgBy5618', 'r01ZopTiEV8',
      'rDLBArZUl1c', 'KG3TyFi0iTU', 'IYfp2Ixe9nM', 'Nyvq2juw4_o',
      'MP0IUfwrn0A', 'zStGLKy0efY', 'oNr01AlqCwE', 'xQo8u66yKnY'
    ],
    bedroom: [
      'r-p-H_je-68', 'KMn4VEeEPR8', 'YI2YkyaREHk', 'xWiXi6wRLGo',
      'AJkEjYu9ZJk', 'tG35vBB89PE', 'SYTO3xs06fU', 'tsVrv14QkSI',
      'h5hJNi3Tdt8', 'SrUPLdVJ7-0', 'BqKccyJi-cU', 'oCrvTu0o42E'
    ],
    kitchen: [
      'uy5t-CJuIK4', '2d4lAQAlbDA', 'ZVprbBmT8QA', 'DU9QFx19u3c',
      '_0JpjeqtSyg', 'qOQGvMPbO4k', 'Yr4n8O_3UPc', 'hpTH5b6mo2s',
      'R-w5Q-4Mqm0', 'YVT5aF2QM7M', 'lHGeqh3XhRY', 'j33IYMnKJTQ'
    ],
    bathroom: [
      'tfNyTfILKK0', 'K-Iog-Bqd8E', 'c5roPJWfF9I', 'SrVU71nH07I',
      'tYIUb0hZAis', 'hWU9OFY4xjI', 'nOwh3tSiPwo', 'Z2bq4mFhNpU',
      'vJxJ9WVCJM4', 'h7FE-KRTyaA', 'rDM-mNz1Cro', 'QALL4jYB9GQ'
    ],
    exterior: [
      'QbH0g2kVhFU', 'f_f6mNa-8q0', '3MAmj1ZKSZA', 'JmuyB_LibRo',
      'DKix6Un55mw', 'n_IKQDCyrG0', 'y_GhtLbSgkY', 'nTTNZQ5Jqwg',
      'FHnnjk1Yj7Y', 'vbxyFn8fCfo', 'JMwCe3w7qKk', 'gts_Eh4g1lk'
    ],
    view: [
      'hgGplX3PFBg', 'VZp4nh0hFHs', 'yRdx_c0-q28', 'DuBNA1QMpPA',
      'l0I27urE8kI', 'R_RgVeep2SI', 'T_Qe4QlMIvQ', 'vbxyFn8fCfo'
    ]
  };

  // Flatten all photos into one array
  const allPhotos = [
    ...apartmentPhotos.livingRoom,
    ...apartmentPhotos.bedroom,
    ...apartmentPhotos.kitchen,
    ...apartmentPhotos.bathroom,
    ...apartmentPhotos.exterior,
    ...apartmentPhotos.view
  ];

  // Select category-appropriate photos based on listing features
  let selectedPhotos = [];

  // Always include living room and bedroom
  selectedPhotos.push(...apartmentPhotos.livingRoom.slice(0, 2));
  selectedPhotos.push(...apartmentPhotos.bedroom.slice(0, 1));

  // Add kitchen
  selectedPhotos.push(...apartmentPhotos.kitchen.slice(0, 1));

  // Add bathroom if 2+
  if (listing["Bathrooms"] >= 2) {
    selectedPhotos.push(...apartmentPhotos.bathroom.slice(0, 1));
  }

  // Add view if listing has view
  if (listing["View"]) {
    selectedPhotos.push(...apartmentPhotos.view.slice(0, 1));
  }

  // Add exterior/outdoor if has outdoor area
  if (listing["Outdoor Area"]) {
    selectedPhotos.push(...apartmentPhotos.exterior.slice(0, 1));
  }

  // Shuffle and pick imageCount photos
  const unitId = listing['Unit ID'];
  const seededRandom = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const shuffled = selectedPhotos
    .map((photo, i) => ({ photo, sort: seededRandom(unitId + i) }))
    .sort((a, b) => a.sort - b.sort)
    .map(item => item.photo);

  const selected = shuffled.slice(0, imageCount);

  // Generate Pexels URLs using curated apartment photo IDs
  // Pexels has thousands of free high-quality apartment photos
  const pexelsBaseIds = [
    1643383, 1457842, 1648776, 1648768, 1454804, 2635038, 2635039,
    271624, 276724, 271816, 534151, 1648771, 1571460, 1571463,
    1599791, 2462015, 2724748, 2587054, 3225531, 3288103,
    1350789, 1743229, 1080696, 1090638, 1329711, 1396132,
    1457847, 1743226, 1838554, 2029665, 2098405, 2251247,
    2343467, 2416653, 2635038, 2724749, 2747901, 2988860,
    3024360, 3044639, 3144580, 3209045, 3288104, 3373736,
    3555615, 3616767, 4050316, 4846095, 4857773, 5563472
  ];

  // unitId already declared above, reuse it
  for (let i = 0; i < selected.length && i < imageCount; i++) {
    const photoIndex = (unitId * 7 + i * 13) % pexelsBaseIds.length;
    const photoId = pexelsBaseIds[photoIndex];

    // Pexels photo URL format
    const url = `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop`;
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
      console.log('⚠️  No listings found in database');
      process.exit(0);
    }

    console.log(`✅ Found ${listings.length} listings\n`);

    // Process each listing
    let successCount = 0;
    let errorCount = 0;

    for (const listing of listings) {
      try {
        // Generate images
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
          console.log(`✅ Updated listing ${listing['Unit ID']} (${listing['Neighborhood']}) with ${images.length} images`);
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
      console.log('\n🎉 Images generated successfully!');
      console.log('   Next: The app will now display these images on listing cards');
    }

  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  }
}

// Run the script
main();

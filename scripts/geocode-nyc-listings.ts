/**
 * Geocoding Script for NYC Listings
 *
 * This script geocodes all NYC listings that don't have coordinates yet.
 * It uses the existing geocodeAddress function and updates the database.
 *
 * Usage: npx tsx scripts/geocode-nyc-listings.ts
 */

import { createClient } from '@supabase/supabase-js';
import { geocodeAddress } from '../lib/geocoding';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ListingToGeocode {
  "Unit ID": number;
  "Address": string;
  "City": string;
  "State": string;
}

// Sleep function for rate limiting
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function geocodeAllListings() {
  console.log('🚀 Starting geocoding process...\n');

  try {
    // Fetch all listings without coordinates
    console.log('📡 Fetching listings without coordinates...');
    const { data: listings, error } = await supabase
      .from('listings_nyc')
      .select('"Unit ID", "Address", "City", "State", latitude, longitude')
      .is('latitude', null);

    if (error) {
      console.error('❌ Error fetching listings:', error);
      return;
    }

    if (!listings || listings.length === 0) {
      console.log('✅ All listings already have coordinates!');
      return;
    }

    console.log(`📍 Found ${listings.length} listings to geocode\n`);

    let successCount = 0;
    let failCount = 0;
    const failedListings: Array<{ unitId: number; address: string; error: string }> = [];

    // Process each listing
    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i] as ListingToGeocode;
      const progress = `[${i + 1}/${listings.length}]`;
      const fullAddress = `${listing.Address}, ${listing.City}, ${listing.State}`;

      console.log(`${progress} Geocoding: ${fullAddress}`);

      try {
        // Geocode the address
        const coords = await geocodeAddress(fullAddress);

        if (coords) {
          // Update the database
          const { error: updateError } = await supabase
            .from('listings_nyc')
            .update({
              latitude: coords.latitude,
              longitude: coords.longitude,
            })
            .eq('Unit ID', listing['Unit ID']);

          if (updateError) {
            console.error(`  ❌ Failed to update: ${updateError.message}`);
            failCount++;
            failedListings.push({
              unitId: listing['Unit ID'],
              address: fullAddress,
              error: updateError.message,
            });
          } else {
            console.log(`  ✅ Updated: ${coords.latitude}, ${coords.longitude}`);
            successCount++;
          }
        } else {
          console.log(`  ⚠️  Could not geocode address`);
          failCount++;
          failedListings.push({
            unitId: listing['Unit ID'],
            address: fullAddress,
            error: 'Geocoding returned null',
          });
        }

        // Rate limiting: wait 200ms between requests to avoid hitting API limits
        // Adjust this based on your geocoding service's rate limits
        if (i < listings.length - 1) {
          await sleep(200);
        }

      } catch (error) {
        console.error(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failCount++;
        failedListings.push({
          unitId: listing['Unit ID'],
          address: fullAddress,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 GEOCODING SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully geocoded: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📈 Success rate: ${((successCount / listings.length) * 100).toFixed(1)}%`);

    if (failedListings.length > 0) {
      console.log('\n⚠️  Failed listings:');
      failedListings.forEach(({ unitId, address, error }) => {
        console.log(`  - Unit ID ${unitId}: ${address}`);
        console.log(`    Error: ${error}`);
      });
    }

    console.log('\n✨ Geocoding complete!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
geocodeAllListings()
  .then(() => {
    console.log('\n👋 Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkGeocoding() {
  console.log('🔍 Checking geocoding status...\n');

  try {
    // Get all listings
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, title, address, latitude, longitude')
      .order('title');

    if (error) throw error;

    if (!listings || listings.length === 0) {
      console.log('No listings found in database');
      return;
    }

    // Check which ones are missing coordinates
    const missingCoords = listings.filter(l => !l.latitude || !l.longitude);
    const hasCoords = listings.filter(l => l.latitude && l.longitude);

    console.log(`Total listings: ${listings.length}`);
    console.log(`✅ Geocoded: ${hasCoords.length}`);
    console.log(`❌ Missing coordinates: ${missingCoords.length}\n`);

    if (missingCoords.length > 0) {
      console.log('Listings with missing coordinates:');
      console.log('═══════════════════════════════════════\n');

      missingCoords.forEach((listing, index) => {
        console.log(`${index + 1}. ${listing.title}`);
        console.log(`   Address: ${listing.address}`);
        console.log(`   ID: ${listing.id}\n`);
      });

      console.log('\n💡 These addresses might be invalid or too vague for the geocoding API.');
      console.log('   Consider updating them to be more specific (e.g., add real street numbers).');
    } else {
      console.log('✅ All listings have coordinates!');
    }

  } catch (error) {
    console.error('Error checking geocoding:', error);
    process.exit(1);
  }
}

checkGeocoding();

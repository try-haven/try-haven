import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetUserPreferences() {
  console.log('🔄 Resetting test user preferences and learned personalization...\n');

  try {
    // Get the email from command line args or use default
    const email = process.argv[2] || 'test@haven.app';

    console.log(`Looking for user: ${email}`);

    // Find the user by email
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users.find(u => u.email === email);

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      console.log('\nAvailable users:');
      users?.users.forEach(u => console.log(`  - ${u.email}`));
      process.exit(1);
    }

    console.log(`✓ Found user: ${user.email} (${user.id})\n`);

    // Reset ALL preferences (explicit + learned personalization)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        // Location preferences
        address: null,
        latitude: null,
        longitude: null,
        commute_options: null,
        // Price preferences
        price_min: null,
        price_max: null,
        // Bedroom/bathroom selections (arrays)
        bedrooms: null,
        bathrooms: null,
        // Rating range
        rating_min: null,
        rating_max: null,
        // Required amenities (hard filter)
        required_amenities: null,
        // Scoring weights (reset to defaults)
        weight_distance: 30,
        weight_amenities: 30,
        weight_property_features: 20,
        weight_quality: 15,
        weight_rating: 5,
        // Learned personalization (automatically calculated from swipes)
        learned_preferred_amenities: {},
        learned_avg_image_count: null,
        learned_avg_description_length: null,
        learned_avg_sqft_by_bedrooms: null,
        learned_preferences_updated_at: null,
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    console.log('✓ Reset location preferences (address, coordinates, commute)');
    console.log('✓ Reset rating preferences');
    console.log('✓ Reset apartment preferences (price, bedrooms, bathrooms, sqft)');
    console.log('✓ Reset scoring weights to defaults (distance: 30%, amenities: 30%, property features: 20%, quality: 15%, rating: 5%)');
    console.log('✓ Reset learned personalization (amenities, quality signals)');

    // Delete swipe history (reviewed listings)
    const { error: reviewedError } = await supabase
      .from('reviewed_listings')
      .delete()
      .eq('user_id', user.id);

    if (reviewedError) throw reviewedError;

    console.log('✓ Cleared swipe history (reviewed_listings table)');

    // Delete liked listings
    const { error: likedError } = await supabase
      .from('liked_listings')
      .delete()
      .eq('user_id', user.id);

    if (likedError) throw likedError;

    console.log('✓ Cleared liked listings (liked_listings table)');

    console.log('\n✅ User completely reset - fresh start!');
    console.log('\n📝 Important: Also clear browser localStorage:');
    console.log('   Open browser console and run:');
    console.log('   localStorage.clear();');
    console.log('\n   Or specifically:');
    console.log('   localStorage.removeItem("haven_liked_listings");');
    console.log('   localStorage.removeItem("haven_reviewed_listings");');

  } catch (error) {
    console.error('❌ Error resetting preferences:', error);
    process.exit(1);
  }
}

resetUserPreferences();

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

async function clearListings() {
  console.log('🗑️  Clearing all listings from database...\n');

  try {
    // Delete all listings
    const { error } = await supabase
      .from('listings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (dummy condition to delete everything)

    if (error) throw error;

    console.log('✅ All listings deleted successfully!');
    console.log('\nNow run: npm run seed');

  } catch (error) {
    console.error('❌ Error clearing listings:', error);
    process.exit(1);
  }
}

clearListings();

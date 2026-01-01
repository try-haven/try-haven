/**
 * Script to update apartment complex names for managers
 *
 * Usage:
 *   npx tsx scripts/update_apartment_complex_names.ts
 *
 * Or with custom value:
 *   npx tsx scripts/update_apartment_complex_names.ts "Custom Apartment Name"
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateApartmentComplexNames(newName: string = 'test apartment') {
  console.log('🚀 Starting apartment complex name update...\n');

  try {
    // Step 1: Find all managers without apartment_complex_name
    console.log('📊 Fetching managers without apartment complex name...');
    const { data: managersToUpdate, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, username, apartment_complex_name')
      .eq('user_type', 'manager')
      .or('apartment_complex_name.is.null,apartment_complex_name.eq.');

    if (fetchError) {
      throw new Error(`Failed to fetch managers: ${fetchError.message}`);
    }

    if (!managersToUpdate || managersToUpdate.length === 0) {
      console.log('✅ All managers already have apartment complex names set!');
      return;
    }

    console.log(`\n📝 Found ${managersToUpdate.length} manager(s) without apartment complex name:`);
    managersToUpdate.forEach((manager, index) => {
      console.log(`   ${index + 1}. ${manager.username} (${manager.email})`);
    });

    // Step 2: Update all managers
    console.log(`\n🔧 Updating ${managersToUpdate.length} manager(s) to: "${newName}"...`);
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ apartment_complex_name: newName })
      .eq('user_type', 'manager')
      .or('apartment_complex_name.is.null,apartment_complex_name.eq.')
      .select();

    if (updateError) {
      throw new Error(`Failed to update managers: ${updateError.message}`);
    }

    console.log(`✅ Successfully updated ${updated?.length || 0} manager(s)!\n`);

    // Step 3: Verify the update
    console.log('🔍 Verifying update...');
    const { data: allManagers, error: verifyError } = await supabase
      .from('profiles')
      .select('id, email, username, apartment_complex_name')
      .eq('user_type', 'manager');

    if (verifyError) {
      throw new Error(`Failed to verify update: ${verifyError.message}`);
    }

    console.log(`\n📊 All managers (${allManagers?.length || 0} total):`);
    allManagers?.forEach((manager, index) => {
      const complexName = manager.apartment_complex_name || '(not set)';
      const indicator = manager.apartment_complex_name === newName ? '✅' : '⚠️';
      console.log(`   ${indicator} ${index + 1}. ${manager.username} - ${complexName}`);
    });

    console.log('\n✨ Update complete!');

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Get custom name from command line args, or use default
const customName = process.argv[2];
updateApartmentComplexNames(customName).then(() => {
  process.exit(0);
});

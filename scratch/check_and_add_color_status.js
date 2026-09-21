import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vqrpodmnzubpcsvqohwj.supabase.co';
const supabaseKey = 'sb_publishable_bISG70YeoKP4mu8BKlgsuQ_xPprjcc1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Test updating a color row with availability
  const { data: colors, error: fetchErr } = await supabase
    .from('accessory_product_colors')
    .select('*')
    .limit(1);

  if (fetchErr) {
    console.error('Fetch error:', fetchErr);
    return;
  }

  if (colors && colors.length > 0) {
    const testId = colors[0].id;
    console.log('Testing color row:', colors[0]);

    // Try updating availability field
    const { data: uData, error: uErr } = await supabase
      .from('accessory_product_colors')
      .update({ availability: 'available' })
      .eq('id', testId);

    if (uErr) {
      console.log('availability column check:', uErr.message);
    } else {
      console.log('Successfully updated availability column on accessory_product_colors');
    }
  }
}

main();

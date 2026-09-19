import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vqrpodmnzubpcsvqohwj.supabase.co';
const supabaseKey = 'sb_publishable_bISG70YeoKP4mu8BKlgsuQ_xPprjcc1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: products, error: pErr } = await supabase
    .from('accessory_products')
    .select('id, size, name_ar, name_en, colors:accessory_product_colors(*)');
  
  if (pErr) {
    console.error('Error fetching products:', pErr);
    return;
  }
  
  console.log(JSON.stringify(products, null, 2));
}

main();

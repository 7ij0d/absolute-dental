import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vqrpodmnzubpcsvqohwj.supabase.co';
const supabaseKey = 'sb_publishable_bISG70YeoKP4mu8BKlgsuQ_xPprjcc1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: colors, error } = await supabase
    .from('accessory_product_colors')
    .select('*, accessory_products(name_ar, size)');
    
  if (error) {
    console.error(error);
    return;
  }
  
  console.log('--- ALL PRODUCT COLORS ---');
  colors.forEach(c => {
    console.log(`Product: ${c.accessory_products?.name_ar} (${c.accessory_products?.size}) | ColorID: ${c.color_id} | Label: ${c.label_ar} | Hex: ${c.hex_code} | Img: ${c.image_url}`);
  });
}

main();

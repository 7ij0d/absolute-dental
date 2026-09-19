import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vqrpodmnzubpcsvqohwj.supabase.co';
const supabaseKey = 'sb_publishable_bISG70YeoKP4mu8BKlgsuQ_xPprjcc1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // 1. Fetch 17 inch product
  const { data: prods, error: pErr } = await supabase
    .from('accessory_products')
    .select('*, colors:accessory_product_colors(*)')
    .eq('size', '17 inch');

  if (pErr) {
    console.error('Error fetching 17" product:', pErr);
    return;
  }

  console.log('Current 17" Product:', JSON.stringify(prods, null, 2));

  if (!prods || prods.length === 0) return;

  const prod = prods[0];

  // 2. Update 17" price to 95 LYD
  const { error: priceErr } = await supabase
    .from('accessory_products')
    .update({ price: 95 })
    .eq('id', prod.id);

  if (priceErr) console.error('Error updating price:', priceErr);
  else console.log('Successfully updated 17" box price to 95 LYD in DB');

  // 3. Update or Upsert purple color
  const purpleColor = prod.colors.find(c => c.color_id === 'purple');
  if (purpleColor) {
    const { error: cErr } = await supabase
      .from('accessory_product_colors')
      .update({
        image_url: '/absolute-dental/accessories/box17-purple.jpg',
        label_ar: 'بنفسجي',
        label_en: 'Purple',
        hex_code: '#A880C8'
      })
      .eq('id', purpleColor.id);

    if (cErr) console.error('Error updating purple color:', cErr);
    else console.log('Updated existing purple color in DB');
  } else {
    const { error: cErr } = await supabase
      .from('accessory_product_colors')
      .insert({
        product_id: prod.id,
        color_id: 'purple',
        label_ar: 'بنفسجي',
        label_en: 'Purple',
        hex_code: '#A880C8',
        image_url: '/absolute-dental/accessories/box17-purple.jpg',
        sort_order: 1
      });

    if (cErr) console.error('Error inserting purple color:', cErr);
    else console.log('Inserted purple color into DB');
  }
}

main();

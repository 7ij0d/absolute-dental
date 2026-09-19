import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vqrpodmnzubpcsvqohwj.supabase.co';
const supabaseKey = 'sb_publishable_bISG70YeoKP4mu8BKlgsuQ_xPprjcc1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: prods, error: pErr } = await supabase
    .from('accessory_products')
    .select('*, colors:accessory_product_colors(*)')
    .eq('size', '17 inch');

  if (pErr) {
    console.error('Error fetching 17" product:', pErr);
    return;
  }

  if (!prods || prods.length === 0) return;
  const prod = prods[0];

  const maroonColor = prod.colors.find(c => c.color_id === 'maroon');
  if (maroonColor) {
    const { error: cErr } = await supabase
      .from('accessory_product_colors')
      .update({
        image_url: '/absolute-dental/accessories/box17-maroon.jpg',
        label_ar: 'عنابي / خمري',
        label_en: 'Maroon',
        hex_code: '#800020'
      })
      .eq('id', maroonColor.id);

    if (cErr) console.error('Error updating maroon color:', cErr);
    else console.log('Updated existing maroon color for 17" box in DB');
  } else {
    const { error: cErr } = await supabase
      .from('accessory_product_colors')
      .insert({
        product_id: prod.id,
        color_id: 'maroon',
        label_ar: 'عنابي / خمري',
        label_en: 'Maroon',
        hex_code: '#800020',
        image_url: '/absolute-dental/accessories/box17-maroon.jpg',
        sort_order: 5
      });

    if (cErr) console.error('Error inserting maroon color:', cErr);
    else console.log('Inserted maroon color for 17" box in DB');
  }
}

main();

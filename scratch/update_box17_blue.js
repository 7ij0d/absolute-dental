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

  const blueColor = prod.colors.find(c => c.color_id === 'blue');
  if (blueColor) {
    const { error: cErr } = await supabase
      .from('accessory_product_colors')
      .update({
        image_url: '/absolute-dental/accessories/box17-blue.jpg',
        label_ar: 'أزرق',
        label_en: 'Blue',
        hex_code: '#1565C0'
      })
      .eq('id', blueColor.id);

    if (cErr) console.error('Error updating blue color:', cErr);
    else console.log('Updated existing blue color for 17" box in DB');
  } else {
    const { error: cErr } = await supabase
      .from('accessory_product_colors')
      .insert({
        product_id: prod.id,
        color_id: 'blue',
        label_ar: 'أزرق',
        label_en: 'Blue',
        hex_code: '#1565C0',
        image_url: '/absolute-dental/accessories/box17-blue.jpg',
        sort_order: 2
      });

    if (cErr) console.error('Error inserting blue color:', cErr);
    else console.log('Inserted blue color for 17" box in DB');
  }
}

main();

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

  const redColor = prod.colors.find(c => c.color_id === 'red');
  if (redColor) {
    const { error: cErr } = await supabase
      .from('accessory_product_colors')
      .update({
        image_url: '/absolute-dental/accessories/box17-red.jpg',
        label_ar: 'أحمر',
        label_en: 'Red',
        hex_code: '#E02020'
      })
      .eq('id', redColor.id);

    if (cErr) console.error('Error updating red color:', cErr);
    else console.log('Updated existing red color for 17" box in DB');
  } else {
    const { error: cErr } = await supabase
      .from('accessory_product_colors')
      .insert({
        product_id: prod.id,
        color_id: 'red',
        label_ar: 'أحمر',
        label_en: 'Red',
        hex_code: '#E02020',
        image_url: '/absolute-dental/accessories/box17-red.jpg',
        sort_order: 3
      });

    if (cErr) console.error('Error inserting red color:', cErr);
    else console.log('Inserted red color for 17" box in DB');
  }
}

main();

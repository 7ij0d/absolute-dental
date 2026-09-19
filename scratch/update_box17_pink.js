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

  const pinkColor = prod.colors.find(c => c.color_id === 'pink');
  if (pinkColor) {
    const { error: cErr } = await supabase
      .from('accessory_product_colors')
      .update({
        image_url: '/absolute-dental/accessories/box17-pink.jpg',
        label_ar: 'وردي',
        label_en: 'Pink',
        hex_code: '#F48FB1'
      })
      .eq('id', pinkColor.id);

    if (cErr) console.error('Error updating pink color:', cErr);
    else console.log('Updated existing pink color for 17" box in DB');
  } else {
    const { error: cErr } = await supabase
      .from('accessory_product_colors')
      .insert({
        product_id: prod.id,
        color_id: 'pink',
        label_ar: 'وردي',
        label_en: 'Pink',
        hex_code: '#F48FB1',
        image_url: '/absolute-dental/accessories/box17-pink.jpg',
        sort_order: 5
      });

    if (cErr) console.error('Error inserting pink color:', cErr);
    else console.log('Inserted pink color for 17" box in DB');
  }
}

main();

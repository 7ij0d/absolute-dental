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

  const beigeColor = prod.colors.find(c => c.color_id === 'beige');
  if (beigeColor) {
    const { error: cErr } = await supabase
      .from('accessory_product_colors')
      .update({
        image_url: '/absolute-dental/accessories/box17-beige.jpg',
        label_ar: 'بيج',
        label_en: 'Beige',
        hex_code: '#C8A882'
      })
      .eq('id', beigeColor.id);

    if (cErr) console.error('Error updating beige color:', cErr);
    else console.log('Updated existing beige color for 17" box in DB');
  } else {
    const { error: cErr } = await supabase
      .from('accessory_product_colors')
      .insert({
        product_id: prod.id,
        color_id: 'beige',
        label_ar: 'بيج',
        label_en: 'Beige',
        hex_code: '#C8A882',
        image_url: '/absolute-dental/accessories/box17-beige.jpg',
        sort_order: 4
      });

    if (cErr) console.error('Error inserting beige color:', cErr);
    else console.log('Inserted beige color for 17" box in DB');
  }
}

main();

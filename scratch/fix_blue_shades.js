import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vqrpodmnzubpcsvqohwj.supabase.co';
const supabaseKey = 'sb_publishable_bISG70YeoKP4mu8BKlgsuQ_xPprjcc1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Update Navy Blue (Dark Navy Blue #0D47A1) -> box16_5-blue.jpg
  const { data: d1, error: e1 } = await supabase
    .from('accessory_product_colors')
    .update({
      image_url: '/absolute-dental/accessories/box16_5-blue.jpg',
      label_ar: 'أزرق داكن',
      label_en: 'Dark Navy Blue'
    })
    .eq('id', '3df3932e-6aaf-40be-b1d5-9d0469a9767f');

  if (e1) console.error('Error updating navy:', e1);
  else console.log('Updated Navy Blue in DB successfully');

  // Update Light Blue (Light Blue #2196F3) -> box16_5-blue.png
  const { data: d2, error: e2 } = await supabase
    .from('accessory_product_colors')
    .update({
      image_url: '/absolute-dental/accessories/box16_5-blue.png',
      label_ar: 'أزرق فاتح',
      label_en: 'Light Blue'
    })
    .eq('id', '9002b1a7-8086-43a7-955d-c56ecca4e09c');

  if (e2) console.error('Error updating light blue:', e2);
  else console.log('Updated Light Blue in DB successfully');
}

main();

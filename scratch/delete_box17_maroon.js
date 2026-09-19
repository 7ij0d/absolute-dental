import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://vqrpodmnzubpcsvqohwj.supabase.co';
const supabaseKey = 'sb_publishable_bISG70YeoKP4mu8BKlgsuQ_xPprjcc1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // 1. Delete maroon color row from Supabase DB for 17" box
  const { data: prods, error: pErr } = await supabase
    .from('accessory_products')
    .select('id')
    .eq('size', '17 inch');

  if (pErr) {
    console.error('Error fetching 17" product:', pErr);
    return;
  }

  if (prods && prods.length > 0) {
    const prodId = prods[0].id;
    const { error: dErr } = await supabase
      .from('accessory_product_colors')
      .delete()
      .eq('product_id', prodId)
      .eq('color_id', 'maroon');

    if (dErr) console.error('Error deleting maroon color from DB:', dErr);
    else console.log('Successfully deleted maroon color row from DB');
  }

  // 2. Delete local image files
  const file1 = path.join(process.cwd(), 'public/accessories/box17-maroon.jpg');
  const file2 = path.join(process.cwd(), 'public/accessories/box17-inside-maroon.jpg');

  if (fs.existsSync(file1)) {
    fs.unlinkSync(file1);
    console.log('Deleted public/accessories/box17-maroon.jpg');
  }
  if (fs.existsSync(file2)) {
    fs.unlinkSync(file2);
    console.log('Deleted public/accessories/box17-inside-maroon.jpg');
  }
}

main();

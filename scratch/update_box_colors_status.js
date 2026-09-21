import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vqrpodmnzubpcsvqohwj.supabase.co';
const supabaseKey = 'sb_publishable_bISG70YeoKP4mu8BKlgsuQ_xPprjcc1';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateBoxColors() {
  console.log('🔄 Syncing box colors to Supabase...');

  const { data: prods } = await supabase.from('accessory_products').select('*');
  const p17 = prods?.find(p => p.size?.includes('17')) || { id: 'ef85fc7a-c8bd-4fb3-9b5a-a2449bf891a2' };
  const p16_5 = prods?.find(p => p.size?.includes('16.5')) || { id: '6249dd01-8b62-4dfa-a043-b619c30df688' };
  const p16 = prods?.find(p => p.size?.includes('16') && !p.size?.includes('16.5')) || { id: 'd521fc29-f29c-472f-ad22-1a94cd985cd1' };

  // 17 inch Black color variant
  const black17 = {
    product_id: p17.id,
    color_id: 'black',
    label_ar: 'أسود',
    label_en: 'Black',
    hex_code: '#111111',
    image_url: '/absolute-dental/accessories/box17-black.jpg',
    sort_order: 1
  };

  const { data: existingBlack } = await supabase
    .from('accessory_product_colors')
    .select('*')
    .eq('product_id', p17.id)
    .eq('color_id', 'black');

  if (!existingBlack || existingBlack.length === 0) {
    const { error: insErr } = await supabase.from('accessory_product_colors').insert(black17);
    console.log('Inserted 17 inch Black variant:', insErr ? insErr.message : 'SUCCESS');
  } else {
    const { error: upErr } = await supabase.from('accessory_product_colors').update(black17).eq('id', existingBlack[0].id);
    console.log('Updated 17 inch Black variant:', upErr ? upErr.message : 'SUCCESS');
  }

  // Fetch all colors
  const { data: allColors } = await supabase.from('accessory_product_colors').select('*');

  if (allColors) {
    for (const c of allColors) {
      let isOutOfStock = false;
      let cleanAr = (c.label_ar || c.label_en || '').replace(/\[out_of_stock\]|\[coming_soon\]|\[in_stock\]/g, '').trim();
      let cleanEn = (c.label_en || c.label_ar || '').replace(/\[out_of_stock\]|\[coming_soon\]|\[in_stock\]/g, '').trim();

      if (c.product_id === p17.id) {
        // 17 inch: ONLY Black and Purple are IN STOCK, all others OUT OF STOCK
        const cid = (c.color_id || '').toLowerCase();
        if (cid === 'black' || cid === 'purple' || cleanEn.toLowerCase() === 'black' || cleanEn.toLowerCase() === 'purple') {
          isOutOfStock = false;
        } else {
          isOutOfStock = true;
        }
      } else if (c.product_id === p16_5.id) {
        // 16.5 inch: ALL colors OUT OF STOCK
        isOutOfStock = true;
      } else if (c.product_id === p16.id) {
        // 16 inch: Blue, Red, Purple are IN STOCK, others OUT OF STOCK
        const cid = (c.color_id || '').toLowerCase();
        if (cid === 'blue' || cid === 'red' || cid === 'purple' || cleanEn.toLowerCase().includes('blue') || cleanEn.toLowerCase().includes('red') || cleanEn.toLowerCase().includes('purple')) {
          isOutOfStock = false;
        } else {
          isOutOfStock = true;
        }
      }

      const statusTag = isOutOfStock ? ' [out_of_stock]' : '';
      await supabase.from('accessory_product_colors').update({
        label_ar: cleanAr + statusTag,
        label_en: cleanEn + statusTag
      }).eq('id', c.id);
    }
    console.log('✅ Successfully updated all 17", 16.5", 16" color labels & out-of-stock tags!');
  }
}

updateBoxColors();

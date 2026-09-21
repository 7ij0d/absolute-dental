import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vqrpodmnzubpcsvqohwj.supabase.co';
const supabaseKey = 'sb_publishable_bISG70YeoKP4mu8BKlgsuQ_xPprjcc1';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanOldProducts() {
  console.log('🔍 Fetching all products from Supabase...');
  const { data: products, error } = await supabase.from('products').select('*');
  
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`Found ${products.length} products total in Supabase:`);
  products.forEach(p => {
    console.log(`- ID: ${p.id} | Name: ${p.name_en} (${p.name_ar}) | Image: ${p.image_url?.substring(0, 60)}`);
  });

  // Delete dummy/seed products (ids p1 to p14 or unsplash images)
  const dummyIds = products
    .filter(p => p.id.startsWith('p') || (p.image_url && p.image_url.includes('unsplash.com')))
    .map(p => p.id);

  console.log('\nTargeting dummy/seed product IDs for deletion:', dummyIds);

  if (dummyIds.length > 0) {
    const { error: delErr } = await supabase.from('products').delete().in('id', dummyIds);
    if (delErr) {
      console.error('Failed to delete dummy products:', delErr);
    } else {
      console.log(`✅ Successfully deleted ${dummyIds.length} old dummy products from Supabase!`);
    }
  } else {
    console.log('No dummy products found in Supabase table.');
  }
}

cleanOldProducts();

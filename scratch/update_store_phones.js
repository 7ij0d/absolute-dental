import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vqrpodmnzubpcsvqohwj.supabase.co';
const supabaseKey = 'sb_publishable_bISG70YeoKP4mu8BKlgsuQ_xPprjcc1';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const contactLinks = {
    whatsapp: 'https://wa.me/218946859163',
    phone_primary: '0946859163',
    phone_secondary: '0925813109',
    telegram: 'https://t.me/smylodent_libya',
    instagram: 'https://instagram.com/smylodent',
    facebook: 'https://facebook.com/smylodent'
  };

  const { data, error } = await supabase
    .from('settings')
    .upsert({
      key: 'contact_links',
      value: contactLinks
    });

  if (error) {
    console.error('Error updating contact_links in DB:', error);
  } else {
    console.log('Successfully updated contact_links in Supabase DB:', contactLinks);
  }
}

main();

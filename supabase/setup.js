/**
 * Smylodent — Supabase Setup Script
 * 
 * This script reads your Supabase credentials from .env,
 * connects to your project, and verifies the connection.
 * 
 * Usage:
 *   node supabase/setup.js <SUPABASE_URL> <SUPABASE_SERVICE_KEY>
 * 
 * Or set them in .env first, then:
 *   node supabase/setup.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read args or .env
let SUPABASE_URL = process.argv[2];
let SERVICE_KEY  = process.argv[3];

if (!SUPABASE_URL || !SERVICE_KEY) {
  // Try reading from .env
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8');
    const urlMatch = env.match(/VITE_SUPABASE_URL=(.+)/);
    const keyMatch = env.match(/VITE_SUPABASE_SERVICE_KEY=(.+)/);
    if (urlMatch) SUPABASE_URL = urlMatch[1].trim();
    if (keyMatch) SERVICE_KEY  = keyMatch[1].trim();
  }
}

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(`
❌ Missing Supabase credentials!

Usage:
  node supabase/setup.js <URL> <SERVICE_ROLE_KEY>

Or add them to .env:
  VITE_SUPABASE_URL=https://xxxxx.supabase.co
  VITE_SUPABASE_SERVICE_KEY=eyJ...
`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function verifyConnection() {
  console.log('\n🔌 Testing Supabase connection...');
  const { data, error } = await supabase.from('years').select('count').limit(1);
  if (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n💡 Make sure you ran 01_schema.sql first in the Supabase SQL Editor!');
    return false;
  }
  console.log('✅ Connection successful!');
  return true;
}

async function checkTables() {
  console.log('\n📋 Checking tables...');
  const tables = ['years', 'subjects', 'products', 'orders', 'profiles', 'banners', 'announcements'];
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`  ❌ ${table}: ${error.message}`);
    } else {
      console.log(`  ✅ ${table}: ${count} rows`);
    }
  }
}

async function updateEnvFile() {
  console.log('\n📝 Updating .env file...');
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = `# Supabase Live Credentials
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SERVICE_KEY}
`;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env updated!');
}

async function main() {
  console.log('🦷 Smylodent Supabase Setup\n' + '='.repeat(40));
  console.log(`📡 URL: ${SUPABASE_URL}`);

  const connected = await verifyConnection();
  if (!connected) process.exit(1);

  await checkTables();
  await updateEnvFile();

  console.log('\n' + '='.repeat(40));
  console.log('🎉 Setup complete! Your Smylodent store is connected to Supabase.');
  console.log('   Run: npm run dev  to start the store\n');
}

main().catch(console.error);

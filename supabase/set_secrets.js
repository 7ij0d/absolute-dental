const sodium = require('tweetsodium');
const https = require('https');

const TOKEN = process.env.GITHUB_TOKEN || '';
const REPO  = '7ij0d/smylodent';
const KEY_ID = process.env.GH_KEY_ID || '';
const PUBLIC_KEY = process.env.GH_PUBLIC_KEY || '';

function encrypt(publicKeyB64, secretValue) {
  const key = Buffer.from(publicKeyB64, 'base64');
  const msg = Buffer.from(secretValue, 'utf8');
  const encrypted = sodium.seal(msg, key);
  return Buffer.from(encrypted).toString('base64');
}

function apiRequest(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'api.github.com',
      path,
      method: 'PUT',
      headers: {
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'smylodent-setup'
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function setSecret(name, value) {
  const encrypted = encrypt(PUBLIC_KEY, value);
  const res = await apiRequest(
    `/repos/${REPO}/actions/secrets/${name}`,
    { encrypted_value: encrypted, key_id: KEY_ID }
  );
  if (res.status === 201 || res.status === 204) {
    console.log(`✅ Secret '${name}' set successfully!`);
  } else {
    console.log(`❌ Failed '${name}': ${res.status} — ${res.body}`);
  }
}

(async () => {
  console.log('🔐 Setting GitHub Secrets for smylodent...\n');
  await setSecret('SUPABASE_URL',      'https://vqrpodmnzubpcsvqohwj.supabase.co');
  await setSecret('SUPABASE_ANON_KEY', 'sb_publishable_bISG70YeoKP4mu8BKlgsuQ_xPprjcc1');
  console.log('\n🎉 Done! GitHub Actions keep-alive workflow is ready.');
})().catch(console.error);

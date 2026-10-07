import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function createStaticServer(rootDirectory) {
  const server = http.createServer((req, res) => {
    let filePath = path.join(rootDirectory, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(rootDirectory, 'index.html');
    }
    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp'
    };
    try {
      const data = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    } catch (e) {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port });
    });
  });
}

const VIEWPORTS = [
  { name: 'Mobile (iPhone)', width: 375, height: 812 },
  { name: 'Mobile (Large)', width: 390, height: 844 },
  { name: 'iPad Portrait', width: 768, height: 1024 },
  { name: 'iPad Landscape', width: 1024, height: 768 },
  { name: 'Laptop (1280px)', width: 1280, height: 800 },
  { name: 'Laptop (1366px)', width: 1366, height: 768 },
  { name: 'Laptop (1440px)', width: 1440, height: 900 },
  { name: 'Desktop (1920px)', width: 1920, height: 1080 },
];

async function run() {
  console.log('--- STARTING COMPREHENSIVE VIEWPORT & CONTAINMENT AUDIT ---');

  // 1. Serve ERP
  const erpPath = path.resolve('..', 'absolute-dental-erp');
  const erpServer = await createStaticServer(erpPath);
  console.log(`ERP Server running on port ${erpServer.port}`);

  // 2. Serve Storefront & Admin (dist)
  const storefrontPath = path.resolve('.', 'dist');
  const sfServer = await createStaticServer(storefrontPath);
  console.log(`Storefront Server running on port ${sfServer.port}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let totalTests = 0;
  let passedTests = 0;
  let failures = [];

  const checkOverflow = async (page, url, label, vp) => {
    totalTests++;
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 600));

    const result = await page.evaluate((vpWidth) => {
      const docScrollWidth = document.documentElement.scrollWidth;
      const bodyScrollWidth = document.body.scrollWidth;
      const docClientWidth = document.documentElement.clientWidth;
      
      const overflowingElements = [];
      const allEls = document.querySelectorAll('*');
      for (const el of allEls) {
        // Skip script, style, head, hidden elements
        if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'HEAD') continue;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
        
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          // If right edge exceeds viewport width by more than 1px
          if (rect.right > vpWidth + 1.5) {
            overflowingElements.push({
              tag: el.tagName,
              id: el.id,
              className: el.className,
              right: Math.round(rect.right),
              width: Math.round(rect.width)
            });
          }
        }
      }

      return {
        docScrollWidth,
        bodyScrollWidth,
        docClientWidth,
        hasDocOverflow: docScrollWidth > vpWidth + 1,
        hasBodyOverflow: bodyScrollWidth > vpWidth + 1,
        overflowCount: overflowingElements.length,
        overflowingElements: overflowingElements.slice(0, 5)
      };
    }, vp.width);

    const isPassed = !result.hasDocOverflow && !result.hasBodyOverflow && result.overflowCount === 0;
    if (isPassed) {
      passedTests++;
      console.log(`  ✓ [PASS] ${label} @ ${vp.name} (${vp.width}px): doc=${result.docScrollWidth}px, client=${result.docClientWidth}px`);
    } else {
      const failInfo = {
        label,
        viewport: vp.name,
        width: vp.width,
        docScrollWidth: result.docScrollWidth,
        bodyScrollWidth: result.bodyScrollWidth,
        overflowingElements: result.overflowingElements
      };
      failures.push(failInfo);
      console.log(`  ✗ [FAIL] ${label} @ ${vp.name} (${vp.width}px): docScroll=${result.docScrollWidth}px, bodyScroll=${result.bodyScrollWidth}px, overflowEls=${result.overflowCount}`);
      if (result.overflowingElements.length > 0) {
        console.log(`    First overflow:`, JSON.stringify(result.overflowingElements[0]));
      }
    }
  };

  const page = await browser.newPage();

  // Test ERP Screens
  console.log('\n--- TESTING ABSOLUTE DENTAL ERP ---');
  for (const vp of VIEWPORTS) {
    await checkOverflow(page, `http://127.0.0.1:${erpServer.port}`, 'ERP Dashboard', vp);
  }

  // Test ERP Orders Screen
  for (const vp of VIEWPORTS) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto(`http://127.0.0.1:${erpServer.port}`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      if (window.navigateToScreen) window.navigateToScreen('orders');
    });
    await new Promise(r => setTimeout(r, 400));
    totalTests++;
    const res = await page.evaluate((vpWidth) => {
      const docScrollWidth = document.documentElement.scrollWidth;
      const docClientWidth = document.documentElement.clientWidth;
      return { docScrollWidth, docClientWidth, ok: docScrollWidth <= vpWidth + 1 };
    }, vp.width);
    if (res.ok) {
      passedTests++;
      console.log(`  ✓ [PASS] ERP Orders Screen @ ${vp.name} (${vp.width}px): doc=${res.docScrollWidth}px`);
    } else {
      failures.push({ label: 'ERP Orders Screen', viewport: vp.name, width: vp.width, docScrollWidth: res.docScrollWidth });
      console.log(`  ✗ [FAIL] ERP Orders Screen @ ${vp.name} (${vp.width}px): docScroll=${res.docScrollWidth}px`);
    }
  }

  // Test Storefront Public Pages
  console.log('\n--- TESTING ABSOLUTE DENTAL STOREFRONT ---');
  for (const vp of VIEWPORTS) {
    await checkOverflow(page, `http://127.0.0.1:${sfServer.port}/`, 'Storefront Home', vp);
  }

  // Test Storefront Admin
  console.log('\n--- TESTING STOREFRONT ADMIN PORTAL ---');
  for (const vp of VIEWPORTS) {
    await checkOverflow(page, `http://127.0.0.1:${sfServer.port}/admin`, 'Admin Layout / Dashboard', vp);
  }

  await browser.close();
  erpServer.server.close();
  sfServer.server.close();

  console.log('\n========================================');
  console.log(`AUDIT COMPLETE: ${passedTests}/${totalTests} TESTS PASSED (${failures.length} failures)`);
  console.log('========================================');

  if (failures.length > 0) {
    console.log('\nFAILURES SUMMARY:');
    console.log(JSON.stringify(failures, null, 2));
    process.exit(1);
  } else {
    console.log('\nALL VIEWPORTS & SCREENS PERFECTLY CONTAINED! ZERO OVERFLOW!');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});

const puppeteer = require('puppeteer');

const BASE_URL = 'https://profeesor-carl.vercel.app';
const results = { passed: [], failed: [], warnings: [] };

async function test(name, fn) {
  process.stdout.write('  ' + name + '... ');
  try {
    const result = await fn();
    results.passed.push({ name, result });
    console.log('✅', result || 'PASS');
    return true;
  } catch (error) {
    results.failed.push({ name, error: error.message });
    console.log('❌', error.message);
    return false;
  }
}

async function runAudit() {
  console.log('\n' + '='.repeat(70));
  console.log('    PROFESSOR CARL - COMPREHENSIVE SYSTEM AUDIT');
  console.log('='.repeat(70) + '\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  let pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('console', msg => {
    if (msg.type() === 'error') pageErrors.push(msg.text());
  });

  // ═══════════════════════════════════════════════════════════════
  // 1. PUBLIC PAGES
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📄 PUBLIC PAGES\n');

  await test('Homepage (/) loads', async () => {
    const res = await page.goto(BASE_URL + '/', { waitUntil: 'networkidle2', timeout: 30000 });
    if (!res.ok()) throw new Error('Status ' + res.status());
    return 'Status ' + res.status();
  });

  await test('Demo page (/demo) loads', async () => {
    const res = await page.goto(BASE_URL + '/demo', { waitUntil: 'networkidle2', timeout: 30000 });
    if (!res.ok()) throw new Error('Status ' + res.status());
    const buttons = await page.$$('button');
    return buttons.length + ' buttons found';
  });

  await test('Voice page (/voice) loads', async () => {
    const res = await page.goto(BASE_URL + '/voice', { waitUntil: 'networkidle2', timeout: 30000 });
    if (!res.ok()) throw new Error('Status ' + res.status());
    return 'Status ' + res.status();
  });

  await test('Login page (/login) loads', async () => {
    const res = await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle2', timeout: 30000 });
    if (!res.ok()) throw new Error('Status ' + res.status());
    const forms = await page.$$('form, input');
    return forms.length + ' form elements';
  });

  await test('Catalog page (/catalog) loads', async () => {
    const res = await page.goto(BASE_URL + '/catalog', { waitUntil: 'networkidle2', timeout: 30000 });
    if (!res.ok()) throw new Error('Status ' + res.status());
    return 'Status ' + res.status();
  });

  // ═══════════════════════════════════════════════════════════════
  // 2. AUTHENTICATED PAGES
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n🔐 AUTHENTICATED PAGES\n');

  await test('Dashboard (/dashboard)', async () => {
    const res = await page.goto(BASE_URL + '/dashboard', { waitUntil: 'networkidle2', timeout: 30000 });
    const url = page.url();
    if (url.includes('login')) return 'Redirects to login ✓';
    return 'Status ' + res.status();
  });

  await test('Chat page (/chat)', async () => {
    const res = await page.goto(BASE_URL + '/chat', { waitUntil: 'networkidle2', timeout: 30000 });
    const url = page.url();
    const content = await page.content();
    if (url.includes('login')) return 'Redirects to login ✓';
    if (res.status() === 200) {
      // Check if there's actual chat UI
      const hasChat = content.includes('chat') || content.includes('message') || content.includes('Chat');
      return hasChat ? 'Chat UI present' : 'Page loads but no chat UI';
    }
    return 'Status ' + res.status();
  });

  await test('Onboarding (/onboarding)', async () => {
    const res = await page.goto(BASE_URL + '/onboarding', { waitUntil: 'networkidle2', timeout: 30000 });
    if (!res.ok()) throw new Error('Status ' + res.status());
    return 'Status ' + res.status();
  });

  // ═══════════════════════════════════════════════════════════════
  // 3. PROFESSOR UPLOAD PAGES
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n👨‍🏫 PROFESSOR UPLOAD PAGES\n');

  await test('Professor upload (/professor/upload)', async () => {
    const res = await page.goto(BASE_URL + '/professor/upload', { waitUntil: 'networkidle2', timeout: 30000 });
    if (!res.ok()) throw new Error('Status ' + res.status());
    const content = await page.content();
    const hasUpload = content.toLowerCase().includes('upload');
    return hasUpload ? 'Has upload UI' : 'No upload UI found';
  });

  await test('Document-video upload', async () => {
    const res = await page.goto(BASE_URL + '/professor/upload/document-video', { waitUntil: 'networkidle2', timeout: 30000 });
    if (!res.ok()) throw new Error('Status ' + res.status());
    return 'Status ' + res.status();
  });

  await test('Topic-based upload', async () => {
    const res = await page.goto(BASE_URL + '/professor/upload/topic-based', { waitUntil: 'networkidle2', timeout: 30000 });
    if (!res.ok()) throw new Error('Status ' + res.status());
    return 'Status ' + res.status();
  });

  // ═══════════════════════════════════════════════════════════════
  // 4. API ENDPOINTS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n🔌 API ENDPOINTS\n');

  await test('Memory context API', async () => {
    const res = await page.evaluate(async (url) => {
      const r = await fetch(url + '/api/memory/context?user_id=brandon&depth=comprehensive');
      const data = await r.json();
      return { status: r.status, count: data.context?.userFacts?.length || 0 };
    }, BASE_URL);
    if (res.status !== 200) throw new Error('Status ' + res.status);
    return res.count + ' memories';
  });

  await test('Memory save API (POST)', async () => {
    const res = await page.evaluate(async (url) => {
      const r = await fetch(url + '/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'audit-test',
          type: 'user',
          content: 'System audit test memory',
          category: 'personal_fact',
          humeArousal: 0.7,
          humeValence: 0.5,
          humeDominantEmotion: 'interest'
        })
      });
      return { status: r.status, data: await r.json() };
    }, BASE_URL);
    if (res.status !== 200) throw new Error('Status ' + res.status);
    return 'Strength: ' + (res.data.memoryStrength?.toFixed(2) || 'N/A');
  });

  await test('Memory feedback API', async () => {
    const res = await page.evaluate(async (url) => {
      const r = await fetch(url + '/api/memory/feedback?user_id=brandon');
      return { status: r.status, data: await r.json() };
    }, BASE_URL);
    if (res.status !== 200) throw new Error('Status ' + res.status);
    return (res.data.stats?.length || 0) + ' stat tiers';
  });

  await test('Decay cron API', async () => {
    const res = await page.evaluate(async (url) => {
      const r = await fetch(url + '/api/cron/decay');
      return { status: r.status, data: await r.json() };
    }, BASE_URL);
    if (res.status !== 200) throw new Error('Status ' + res.status);
    return 'Updated: ' + (res.data.updated || 0);
  });

  await test('Hume config API', async () => {
    const res = await page.evaluate(async (url) => {
      const r = await fetch(url + '/api/hume-config');
      return { status: r.status, data: await r.json() };
    }, BASE_URL);
    if (res.status !== 200) throw new Error('Status ' + res.status);
    return (res.data.availableConfigs?.length || 0) + ' configs';
  });

  await test('Video search API', async () => {
    const res = await page.evaluate(async (url) => {
      const r = await fetch(url + '/api/videos/search?topic=consciousness&limit=3');
      return { status: r.status, data: await r.json() };
    }, BASE_URL);
    if (res.status !== 200) throw new Error('Status ' + res.status);
    const count = res.data.videos?.length || res.data.length || 0;
    return count + ' videos';
  });

  await test('Voice session API', async () => {
    const res = await page.evaluate(async (url) => {
      const r = await fetch(url + '/api/voice-session');
      return { status: r.status };
    }, BASE_URL);
    return 'Status ' + res.status;
  });

  await test('Auth check API', async () => {
    const res = await page.evaluate(async (url) => {
      const r = await fetch(url + '/api/auth/check');
      return { status: r.status };
    }, BASE_URL);
    return 'Status ' + res.status;
  });

  // ═══════════════════════════════════════════════════════════════
  // 5. CONSOLE ERRORS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n⚠️ CONSOLE ERRORS DETECTED\n');

  if (pageErrors.length > 0) {
    console.log('  Found ' + pageErrors.length + ' errors:');
    pageErrors.slice(0, 10).forEach((err, i) => {
      console.log('  ' + (i+1) + '. ' + err.substring(0, 100));
    });
  } else {
    console.log('  ✅ No console errors');
  }

  await browser.close();

  // ═══════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n' + '='.repeat(70));
  console.log('                         AUDIT SUMMARY');
  console.log('='.repeat(70));
  console.log('  ✅ Passed: ' + results.passed.length);
  console.log('  ❌ Failed: ' + results.failed.length);
  console.log('='.repeat(70));

  if (results.failed.length > 0) {
    console.log('\nFailed Tests:');
    results.failed.forEach(f => console.log('  ❌ ' + f.name + ': ' + f.error));
  }

  console.log('\n');
}

runAudit().catch(e => {
  console.error('Audit failed:', e);
  process.exit(1);
});

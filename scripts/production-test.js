#!/usr/bin/env node
/**
 * Production Readiness Test Suite for Professor Carl
 * Tests: Frontend, APIs, Memory System, Hume Integration
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.TEST_URL || 'https://profeesor-carl.vercel.app';
const TIMEOUT = 30000;

let browser;
let page;
let testResults = [];
let consoleErrors = [];

async function test(name, fn) {
  process.stdout.write(`  Testing: ${name}... `);
  try {
    await fn();
    testResults.push({ name, status: 'PASS' });
    console.log('✅ PASS');
    return true;
  } catch (error) {
    testResults.push({ name, status: 'FAIL', error: error.message });
    console.log('❌ FAIL:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('    PROFESSOR CARL - PRODUCTION READINESS TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Target: ${BASE_URL}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  page = await browser.newPage();

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    consoleErrors.push(error.message);
  });

  // ═══════════════════════════════════════════════════════════════
  // 1. FRONTEND TESTS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📱 FRONTEND TESTS\n');

  await test('Homepage loads', async () => {
    const response = await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    if (!response.ok()) throw new Error(`Status: ${response.status()}`);
  });

  await test('Demo page loads', async () => {
    const response = await page.goto(`${BASE_URL}/demo`, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    if (!response.ok()) throw new Error(`Status: ${response.status()}`);
  });

  await test('Demo page has voice UI elements', async () => {
    await page.waitForSelector('button', { timeout: 10000 });
    const buttons = await page.$$('button');
    if (buttons.length === 0) throw new Error('No buttons found');
  });

  await test('Voice page loads', async () => {
    const response = await page.goto(`${BASE_URL}/voice`, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    if (!response.ok()) throw new Error(`Status: ${response.status()}`);
  });

  await test('Login page loads', async () => {
    const response = await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    if (!response.ok()) throw new Error(`Status: ${response.status()}`);
  });

  // ═══════════════════════════════════════════════════════════════
  // 2. API TESTS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n🔌 API TESTS\n');

  await test('Memory context API works', async () => {
    const response = await page.evaluate(async (url) => {
      const res = await fetch(`${url}/api/memory/context?user_id=brandon&depth=standard`);
      return { status: res.status, data: await res.json() };
    }, BASE_URL);
    if (response.status !== 200) throw new Error(`Status: ${response.status}`);
    if (!response.data.success) throw new Error('API returned failure');
  });

  await test('Memory save API works', async () => {
    const response = await page.evaluate(async (url) => {
      const res = await fetch(`${url}/api/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-production',
          type: 'user',
          content: 'Production test memory - can be deleted',
          category: 'personal_fact',
          humeArousal: 0.5,
          humeValence: 0,
          humeDominantEmotion: 'neutral'
        })
      });
      return { status: res.status, data: await res.json() };
    }, BASE_URL);
    if (response.status !== 200) throw new Error(`Status: ${response.status}`);
    if (!response.data.success) throw new Error('API returned failure');
  });

  await test('Memory feedback API works', async () => {
    const response = await page.evaluate(async (url) => {
      const res = await fetch(`${url}/api/memory/feedback?user_id=brandon`);
      return { status: res.status, data: await res.json() };
    }, BASE_URL);
    if (response.status !== 200) throw new Error(`Status: ${response.status}`);
    if (!response.data.success) throw new Error('API returned failure');
  });

  await test('Decay cron API works', async () => {
    const response = await page.evaluate(async (url) => {
      const res = await fetch(`${url}/api/cron/decay`);
      return { status: res.status, data: await res.json() };
    }, BASE_URL);
    if (response.status !== 200) throw new Error(`Status: ${response.status}`);
    if (!response.data.success) throw new Error('API returned failure');
  });

  await test('Hume config API works', async () => {
    const response = await page.evaluate(async (url) => {
      const res = await fetch(`${url}/api/hume-config`);
      return { status: res.status, data: await res.json() };
    }, BASE_URL);
    if (response.status !== 200) throw new Error(`Status: ${response.status}`);
  });

  await test('Video search API works', async () => {
    const response = await page.evaluate(async (url) => {
      const res = await fetch(`${url}/api/videos/search?topic=consciousness&limit=1`);
      return { status: res.status, data: await res.json() };
    }, BASE_URL);
    if (response.status !== 200) throw new Error(`Status: ${response.status}`);
  });

  // ═══════════════════════════════════════════════════════════════
  // 3. MEMORY SYSTEM TESTS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n🧠 MEMORY SYSTEM TESTS\n');

  await test('Brandon has memories', async () => {
    const response = await page.evaluate(async (url) => {
      const res = await fetch(`${url}/api/memory/context?user_id=brandon&depth=comprehensive`);
      return await res.json();
    }, BASE_URL);
    if (!response.context?.userFacts?.length) throw new Error('No memories found');
    if (response.context.userFacts.length < 10) throw new Error(`Only ${response.context.userFacts.length} memories`);
  });

  await test('Memories have cognitive scores', async () => {
    const response = await page.evaluate(async (url) => {
      const res = await fetch(`${url}/api/memory/context?user_id=brandon&depth=standard`);
      return await res.json();
    }, BASE_URL);
    const fact = response.context?.userFacts?.[0];
    if (!fact) throw new Error('No memories');
    if (typeof fact.emotionalArousal !== 'number') throw new Error('Missing emotionalArousal');
    if (typeof fact.memoryStrength !== 'number') throw new Error('Missing memoryStrength');
    if (typeof fact.hybridScore !== 'number') throw new Error('Missing hybridScore');
  });

  await test('Memories are ranked by hybrid score', async () => {
    const response = await page.evaluate(async (url) => {
      const res = await fetch(`${url}/api/memory/context?user_id=brandon&depth=comprehensive`);
      return await res.json();
    }, BASE_URL);
    const facts = response.context?.userFacts || [];
    for (let i = 1; i < Math.min(facts.length, 5); i++) {
      if (facts[i].hybridScore > facts[i-1].hybridScore) {
        throw new Error('Memories not properly ranked');
      }
    }
  });

  await test('High-emotion memories rank higher', async () => {
    const response = await page.evaluate(async (url) => {
      const res = await fetch(`${url}/api/memory/context?user_id=brandon&depth=comprehensive`);
      return await res.json();
    }, BASE_URL);
    const facts = response.context?.userFacts || [];
    const topFacts = facts.slice(0, 5);
    const avgTopArousal = topFacts.reduce((sum, f) => sum + f.emotionalArousal, 0) / topFacts.length;
    if (avgTopArousal < 0.7) throw new Error(`Top memories have low arousal: ${avgTopArousal.toFixed(2)}`);
  });

  // ═══════════════════════════════════════════════════════════════
  // 4. HUME INTEGRATION TESTS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n🎙️ HUME INTEGRATION TESTS\n');

  await test('Hume API key is configured', async () => {
    const response = await page.evaluate(async (url) => {
      const res = await fetch(`${url}/api/hume-config`);
      return await res.json();
    }, BASE_URL);
    // Check for availableConfigs (Hume configs exist)
    if (!response.availableConfigs || response.availableConfigs.length === 0) {
      throw new Error('No Hume configs available');
    }
  });

  await test('Memory API accepts Hume scores', async () => {
    const response = await page.evaluate(async (url) => {
      const res = await fetch(`${url}/api/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-hume-integration',
          type: 'user',
          content: 'Hume integration test with full emotion scores',
          category: 'experience',
          humeArousal: 0.85,
          humeValence: 0.6,
          humeDominantEmotion: 'excitement',
          humeScores: {
            Excitement: 0.85,
            Joy: 0.6,
            Interest: 0.7,
            Determination: 0.5
          }
        })
      });
      return await res.json();
    }, BASE_URL);
    if (!response.success) throw new Error('Failed to save with Hume scores');
    if (response.memoryStrength < 2) throw new Error(`Low memory strength: ${response.memoryStrength}`);
  });

  await test('Hume scores are retrievable', async () => {
    const response = await page.evaluate(async (url) => {
      const res = await fetch(`${url}/api/memory/context?user_id=test-hume-integration`);
      return await res.json();
    }, BASE_URL);
    const fact = response.context?.userFacts?.[0];
    if (!fact) throw new Error('Memory not found');
    if (Object.keys(fact.humeScores || {}).length === 0) throw new Error('Hume scores not stored');
  });

  // ═══════════════════════════════════════════════════════════════
  // 5. ERROR CHECK
  // ═══════════════════════════════════════════════════════════════
  console.log('\n\n⚠️ CONSOLE ERRORS\n');

  if (consoleErrors.length > 0) {
    console.log('  Found', consoleErrors.length, 'console errors:');
    consoleErrors.slice(0, 5).forEach((err, i) => {
      console.log(`  ${i+1}. ${err.substring(0, 100)}...`);
    });
  } else {
    console.log('  ✅ No console errors detected');
  }

  // ═══════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════
  await browser.close();

  const passed = testResults.filter(t => t.status === 'PASS').length;
  const failed = testResults.filter(t => t.status === 'FAIL').length;

  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('                        TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Total:  ${testResults.length}`);
  console.log(`  Passed: ${passed} ✅`);
  console.log(`  Failed: ${failed} ❌`);
  console.log('═══════════════════════════════════════════════════════════════');

  if (failed > 0) {
    console.log('\nFailed tests:');
    testResults.filter(t => t.status === 'FAIL').forEach(t => {
      console.log(`  ❌ ${t.name}: ${t.error}`);
    });
  }

  console.log('\n');

  // Cleanup test data
  await fetch(`${BASE_URL}/api/memory`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'test-production' })
  }).catch(() => {});

  await fetch(`${BASE_URL}/api/memory`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'test-hume-integration' })
  }).catch(() => {});

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('Test suite failed:', error);
  if (browser) browser.close();
  process.exit(1);
});

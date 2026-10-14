import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

// Exercise the shipped page through its visible controls and public DOM state.
// No application globals, reward mutations, or debug hooks are used.
const root = path.resolve('dist');
const output = process.env.YACHA_CLOSING_SCREENSHOTS;
const report = [];
if (output) await fs.mkdir(output, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
  '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relative = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
    const file = path.resolve(root, `.${relative}`);
    if (!file.startsWith(root + path.sep)) throw Error('Invalid path');
    response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    response.end(await fs.readFile(file));
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = process.env.YACHA_CLOSING_URL
  || `http://127.0.0.1:${server.address().port}/closing.html`;

async function state(page) {
  return page.locator('#stage').evaluate(element => ({
    phase: element.dataset.phase,
    day: Number(element.dataset.day),
    actual: Number(element.dataset.actualFollowers),
    displayed: Number(element.dataset.displayedFollowers),
    stars: Number(element.dataset.stars),
  }));
}

async function phase(page, expected, day) {
  await page.waitForFunction(({ expected, day }) => {
    const stage = document.querySelector('#stage');
    return stage?.dataset.phase === expected
      && (day === undefined || Number(stage.dataset.day) === day);
  }, { expected, day });
}

async function reviewReady(page) {
  await phase(page, 'review');
  await page.locator('#nextReview:enabled').waitFor({ state: 'visible' });
}

async function start(page, { day = 1, manual = false, choices = {}, threshold } = {}) {
  await page.goto(url);
  await phase(page, 'salon');
  await page.locator('#settingsOpen').click();
  await page.locator('#settings[open]').waitFor();
  await page.locator('#startDay').selectOption(String(day));
  await page.locator('#speed').selectOption('2');
  for (const [guest, result] of Object.entries(choices)) {
    await page.locator(`#result-${guest}`).selectOption(result);
  }
  if (threshold !== undefined) {
    await page.locator('details').filter({ has: page.locator('#threshold') }).locator('summary').click();
    await page.locator('#threshold').fill(String(threshold));
  }
  await page.locator(manual ? '#manualStart' : '#settingsForm button[type="submit"]').click();
  await page.locator('#settings').waitFor({ state: 'hidden' });
  await phase(page, 'salon', day);
}

async function capture(page, engine, name) {
  if (output) await page.screenshot({ path: path.join(output, `${engine}-${name}.png`) });
}

async function checkKeyboardInSettings(page) {
  const before = await state(page);
  const reviewIndex = await page.locator('#reviewIndex').innerText();
  await page.locator('#settingsOpen').click();
  await page.locator('details').filter({ has: page.locator('#reviewSettings') }).locator('summary').click();
  const textarea = page.locator('#reviewSettings textarea').first();
  await textarea.focus();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  assert.equal(await page.locator('#settings').evaluate(element => element.open), true);
  assert.deepEqual(await state(page), before, 'typing in settings must not advance the scene');
  assert.equal(await page.locator('#reviewIndex').innerText(), reviewIndex);
  await page.locator('#settingsClose').click();
  await page.locator('#settings').waitFor({ state: 'hidden' });
}

async function checkUnappliedSettings(page, { emptyThreshold = false } = {}) {
  const before = await state(page);
  const reviewIndex = await page.locator('#reviewIndex').innerText();
  const percentage = await page.locator('#starPercent').innerText();
  const fields = () => page.locator('#settingsForm').evaluate(form =>
    Object.fromEntries([...form.querySelectorAll('input,select,textarea')]
      .map(element => [element.id, element.value])));
  await page.locator('#settingsOpen').click();
  const activeFields = await fields();
  if (emptyThreshold) {
    const details = page.locator('details').filter({ has: page.locator('#threshold') });
    if (!await details.evaluate(element => element.open)) await details.locator('summary').click();
    await page.locator('#threshold').fill('');
    await page.locator('#settingsForm button[type="submit"]').click();
    assert.equal(await page.locator('#settings').evaluate(element => element.open), true,
      'an empty required threshold must prevent form submission');
    assert.equal(await page.locator('#threshold').evaluate(element => element.validity.valueMissing), true);
    assert.deepEqual(await state(page), before);
    // The alternative entry point must honor the same form validity.
    await page.locator('#manualStart').click();
    assert.equal(await page.locator('#settings').evaluate(element => element.open), true);
    assert.deepEqual(await state(page), before);
  }
  await page.locator('#defaults').click();
  assert.equal(await page.locator('#threshold').inputValue(), '5000');
  assert.equal(await page.locator('#speed').inputValue(), '1');
  assert.deepEqual(await state(page), before, 'restoring the form defaults must not restart the scene');
  await page.locator('#settingsClose').click();
  await page.locator('#settings').waitFor({ state: 'hidden' });
  assert.deepEqual(await state(page), before);
  assert.equal(await page.locator('#reviewIndex').innerText(), reviewIndex);
  assert.equal(await page.locator('#starPercent').innerText(), percentage);
  await page.locator('#settingsOpen').click();
  assert.deepEqual(await fields(), activeFields,
    'closing the defaults draft must retain all active values, choices, and review text');
  await page.locator('#settingsClose').click();
  await page.locator('#settings').waitFor({ state: 'hidden' });
}

async function checkBlackout(page) {
  await page.waitForFunction(() => {
    const element = document.querySelector('#blackout');
    return element?.classList.contains('dark') && Number(getComputedStyle(element).opacity) >= 0.99;
  }, null, { timeout: 10000 });
  const blackout = await page.locator('#blackout').evaluate(element => ({
    active: element.classList.contains('dark'),
    opacity: Number(getComputedStyle(element).opacity),
  }));
  assert.equal(blackout.active, true);
  assert(blackout.opacity >= 0.99, 'the actual blackout CSS must become opaque before the next day');
}

async function fullSequence(page, engine) {
  await start(page, { choices: { zombie: 'beauty', sans: 'forcedWin', minion: 'offerWin' } });
  assert.equal((await state(page)).actual, 3000, 'quick completion pays the day-one rewards immediately');
  assert.equal(await page.locator('#hudTotal').innerText(), '3,000');
  assert.equal(await page.locator('#closeShop').isVisible(), true);
  await page.locator('#closeShop').click();
  await reviewReady(page);
  let current = await state(page);
  assert.equal(current.actual, 3000);
  assert.equal(current.displayed, 1500);
  assert.equal(current.stars, 0);
  const firstIndex = await page.locator('#reviewIndex').innerText();
  await page.waitForTimeout(500);
  assert.equal(await page.locator('#reviewIndex').innerText(), firstIndex,
    'a completed first review waits for the player instead of auto-scrolling');
  await checkKeyboardInSettings(page);
  await checkUnappliedSettings(page, { emptyThreshold: true });
  await capture(page, engine, 'day1-first-review');
  await page.locator('#nextReview').click();
  await page.waitForFunction(first => document.querySelector('#reviewIndex').innerText !== first, firstIndex);
  await reviewReady(page);
  current = await state(page);
  assert.equal(current.actual, 3000, 'replaying follower gains does not pay them twice');
  assert.equal(current.displayed, 3000);
  assert.equal(current.stars, 0);
  await capture(page, engine, 'day1-second-review');
  await page.locator('#nextReview').click();
  await checkBlackout(page);
  await phase(page, 'salon', 2);
  assert.equal((await state(page)).actual, 5200);
  assert.equal(await page.locator('#hudTotal').innerText(), '5,200');
  await page.locator('#closeShop').click();
  await reviewReady(page);
  current = await state(page);
  assert.equal(current.actual, 5200);
  assert.equal(current.displayed, 5200);
  await capture(page, engine, 'day2-bonus-review');
  await page.locator('#nextReview').click();
  await phase(page, 'ending', 3);
  await page.locator('#ending').waitFor({ state: 'visible' });
  current = await state(page);
  assert.equal(current.actual, 5200);
  assert.equal(current.stars, 1);
  assert.equal(await page.locator('#closeShop').isVisible(), false);
  assert.equal(await page.locator('#completeGuest').isVisible(), false);
  assert.equal(await page.locator('#nextReview').isVisible(), false);
  await page.locator('#stage').click({ position: { x: 24, y: 24 } });
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  assert.deepEqual(await state(page), current, 'the DAY 3 upgrade reveal is not playable');
  await capture(page, engine, 'day3-ending');
  return { scenario: 'two-day sequence', actual: current.actual, stars: current.stars };
}

async function retrySequence(page, engine) {
  await start(page, { manual: true, choices: { zombie: 'forcedLoss', sans: 'offerLoss' } });
  assert.equal((await state(page)).actual, 0);
  assert.equal(await page.locator('#closeShop').isVisible(), false);
  await page.locator('#completeGuest').click();
  await page.locator('#retryPanel').waitFor({ state: 'visible' });
  assert.equal((await state(page)).actual, 0, 'forced defeat pays nothing');
  assert.equal(await page.locator('#closeShop').isVisible(), false);
  await capture(page, engine, 'forced-retry');
  await page.locator('#retryBattle').click();
  await page.locator('#retryPanel').waitFor({ state: 'hidden' });
  assert.equal((await state(page)).actual, 1500);
  assert.match(await page.locator('#visitName').innerText(), /샌즈/);
  await page.locator('#completeGuest').click();
  await page.locator('#closeShop').waitFor({ state: 'visible' });
  assert.equal((await state(page)).actual, 3000, 'offer defeat still pays the beauty base reward');
  assert.equal(await page.locator('#retryPanel').isVisible(), false);
  return { scenario: 'forced retry then proposed defeat', actual: 3000 };
}

async function belowThreshold(page, engine) {
  await start(page, { day: 2, threshold: 999999,
    choices: { zombie: 'beauty', sans: 'beauty', minion: 'beauty' } });
  await page.locator('#closeShop').click();
  await reviewReady(page);
  assert.equal((await state(page)).actual, 5000);
  assert.equal((await state(page)).stars, 0);
  await checkUnappliedSettings(page);
  await page.locator('#nextReview').click();
  await phase(page, 'ending', 3);
  await page.locator('#ending').waitFor({ state: 'visible' });
  const current = await state(page);
  assert.equal(current.stars, 0, 'edited threshold must not grant an unearned star');
  assert.equal(current.actual, 5000);
  await capture(page, engine, 'below-threshold');
  return { scenario: 'threshold not reached', actual: current.actual, stars: current.stars };
}

try {
  for (const [name, engine] of Object.entries({ chromium, webkit })) {
    if (process.env.YACHA_CLOSING_ENGINE && process.env.YACHA_CLOSING_ENGINE !== name) continue;
    const browser = await engine.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
      page.setDefaultTimeout(45000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const scenario of [fullSequence, retrySequence, belowThreshold]) {
        try {
          const result = await scenario(page, name);
          report.push({ engine: name, ...result });
          console.log(`${name}: ${result.scenario} passed`);
        } catch (error) {
          await capture(page, name, 'failure');
          console.error('Closing state at failure:', await state(page).catch(() => null));
          throw error;
        }
      }
      assert.deepEqual(errors, [], `${name}: no unhandled page errors`);
    } finally {
      await browser.close();
    }
  }
} finally {
  await new Promise(resolve => server.close(resolve));
}
if (output) await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ url, checkedAt: new Date().toISOString(), report }, null, 2));

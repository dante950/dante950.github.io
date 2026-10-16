import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

// Drive the actual editor and pointer controls. Diagnostics are read-only: the
// test never writes a material cell, score, expression, or application state.
const root = path.resolve('dist');
const output = path.resolve(process.env.YACHA_MINION_SCREENSHOTS || '../minion-beauty-2026-10-16');
const report = [];
await fs.mkdir(output, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
  '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(root, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`);
    if (!file.startsWith(root + path.sep)) throw Error('Invalid path');
    response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    response.end(await fs.readFile(file));
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = process.env.YACHA_MINION_URL || `http://127.0.0.1:${server.address().port}`;

async function snapshot(salon) {
  return salon.evaluate(() => ({
    material: beautyDebug.material,
    original: beautyDebug.original,
    masks: Object.fromEntries(Object.entries(beautyDebug.masks).map(([name, mask]) => [name, Array.from(mask)])),
    scores: beautyDebug.scores,
    guest: JSON.parse(document.getElementById('guest-data').textContent),
  }));
}

async function readRequest(page) {
  const lines = new Set();
  for (let tries = 0; tries < 45; tries++) {
    if (await page.locator('#beautyChoices').isVisible()) return lines.size;
    const count = await page.locator('#talkCount').textContent();
    if (count) lines.add(count);
    const position = count?.match(/(\d+)\s*\/\s*(\d+)/);
    if (position && position[1] === position[2]) {
      // Let the last sentence finish naturally so its choices cannot replace
      // the next button during a click. This also preserves the whole request.
      await page.locator('#beautyChoices').waitFor({ state: 'visible' });
      return lines.size;
    }
    if (await page.locator('#talkNext').isVisible()) {
      const beforeText = await page.locator('#talkText').textContent();
      const beforeButton = await page.locator('#talkNext').textContent();
      // Keyboard progression is supported by the game. Explicit focus matters
      // after 네?, which otherwise keeps focus on the clarification button.
      await page.locator('#talkNext').focus();
      await page.keyboard.press('f');
      await page.waitForFunction(previous => {
        const choices = document.getElementById('beautyChoices');
        return !choices.hidden || document.getElementById('talkCount').textContent !== previous.count
          || document.getElementById('talkText').textContent !== previous.text
          || document.getElementById('talkNext').textContent !== previous.button;
      }, { count, text: beforeText, button: beforeButton });
    }
    await page.waitForTimeout(100);
  }
  throw Error('The beauty request did not reach its player choices');
}

async function workshopDialogue(page) {
  return page.evaluate(() => {
    const project = window.fullflow.project;
    const rows = name => project.combat.sheets.find(sheet => sheet.name === name)?.rows || [];
    const links = rows('미용 대사 연결').filter(row => row.MonsterID === 10004);
    const ids = new Set(links.flatMap(row => [row.RequestGroupID, row.DetailGroupID]));
    return { links, groups: rows('대화 그룹').filter(row => ids.has(row.GroupID)),
      lines: rows('대사').filter(row => ids.has(row.GroupID)) };
  });
}

async function checkEditorRoundtrip(page) {
  await page.locator('#beautyEnabled').uncheck();
  assert.equal(await page.locator('#beautyGuest').inputValue(), '10004');
  assert.equal(await page.locator('#beautyTry').count(), 0, 'disabled beauty cannot launch a preview');
  assert.match(await page.locator('#beautyEditor').innerText(), /미용 시험 대기/);
  await page.locator('#beautyEnabled').check();
  assert.equal(await page.locator('#beautyEnabled').isChecked(), true);
  assert.equal(await page.locator('#beautyGuest').inputValue(), '10004');
  await page.locator('#beautyTry').waitFor();

  const request = page.locator('[data-field="request"]');
  const originalText = await request.inputValue();
  const originalDialogue = await workshopDialogue(page);
  assert(originalDialogue.links.length > 0 && originalDialogue.lines.length > 1);
  await request.fill(`${originalText} (편집 유지 시험)`);
  await request.blur();
  const editedDialogue = await workshopDialogue(page);
  assert.notDeepEqual(editedDialogue.lines, originalDialogue.lines, 'the UI request field updates the workshop draft');
  await page.locator('#editorScreen [data-editor="combat"]').click();
  const combat = await page.locator('#combatEditor').elementHandle().then(handle => handle.contentFrame());
  await combat.waitForFunction(() => window.lab?.data?.sheets?.length > 0);
  const combatData = await combat.evaluate(() => ({
    host: JSON.parse(document.getElementById('host-data').textContent).data,
    active: window.lab.data,
  }));
  const groupIDs = new Set(editedDialogue.groups.map(group => group.GroupID));
  for (const data of Object.values(combatData)) {
    assert(!data.sheets.flatMap(sheet => sheet.rows).some(row => row.MonsterID === 10004),
      'workbook-bound combat data contains no unfinished minion references');
    for (const name of ['대화 그룹', '대사']) {
      assert(!data.sheets.find(sheet => sheet.name === name)?.rows.some(row => groupIDs.has(row.GroupID)),
        'exclusive workshop request groups stay out of the combat workbook editor');
    }
  }
  await page.locator('#editorScreen [data-editor="beauty"]').click();
  await page.locator('#beautyGuest').waitFor();
  assert.equal(await page.locator('#beautyGuest').inputValue(), '10004');
  assert.equal(await page.locator('[data-field="request"]').inputValue(), `${originalText} (편집 유지 시험)`);
  assert.deepEqual(await workshopDialogue(page), editedDialogue,
    'the combat snapshot roundtrip preserves edited minion request links, groups and lines');
  await page.locator('[data-field="request"]').fill(originalText);
  await page.locator('[data-field="request"]').blur();
  assert.deepEqual(await workshopDialogue(page), originalDialogue);
}

async function openPreview(page, engine) {
  await page.goto(base);
  await page.locator('#siteLoading').waitFor({ state: 'detached' });
  await page.locator('#play').click();
  assert.equal(await page.locator('[data-start-guest="10004"]').count(), 0,
    'the unfinished customer must stay out of public story starts');
  assert.equal(await page.locator('[data-start-guest]').count(), 3);
  await page.locator('#cancelStoryStart').click();
  await page.locator('#developer').click();
  if (await page.locator('#updateOK').isVisible()) await page.locator('#updateOK').click();
  await page.locator('[data-editor="beauty"]').first().click();
  const options = await page.locator('#beautyGuest option').evaluateAll(nodes => nodes.map(node => Number(node.value)));
  for (const id of [10001, 10003, 10004]) assert(options.includes(id), `beauty editor includes guest ${id}`);
  await page.locator('#beautyGuest').selectOption('10004');
  await checkEditorRoundtrip(page);
  assert.equal(await page.locator('#toolSelect').inputValue(), 'hammer');
  const clipping = await page.locator('#regionStage').evaluate(stage => ({
    bottom: stage.getBoundingClientRect().bottom,
    controlsTop: document.querySelector('.minionReference').getBoundingClientRect().top,
    overflow: getComputedStyle(stage).overflowY,
  }));
  assert(clipping.bottom <= clipping.controlsTop + 1, 'reference controls start below the portrait stage');
  assert.equal(clipping.overflow, 'hidden', 'the cape is clipped to its editor stage and cannot cover the reference buttons');
  const longSource = await page.locator('.layeredPortrait').getAttribute('src');
  await page.locator('#minionTarget').click();
  assert.equal(await page.locator('#minionTarget').getAttribute('aria-pressed'), 'true');
  assert.notEqual(await page.locator('.layeredPortrait').getAttribute('src'), longSource,
    'the target button shows the supplied small-horn reference');
  await page.locator('#minionWalk').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.getElementById('minionWalk')?.dataset.direction === 'front');
  const firstFrame = await page.locator('#minionWalk').getAttribute('data-frame');
  await page.waitForFunction(frame => document.getElementById('minionWalk').dataset.frame !== frame, firstFrame);
  await page.locator('#minionBack').click();
  await page.waitForFunction(() => document.getElementById('minionWalk').dataset.direction === 'back');
  await page.screenshot({ path: path.join(output, `${engine}-minion-target-reference.png`) });
  await page.locator('#minionFront').click();
  await page.waitForFunction(() => document.getElementById('minionWalk').dataset.direction === 'front');
  await page.locator('#minionLong').click();
  assert.equal(await page.locator('.layeredPortrait').getAttribute('src'), longSource);
  await page.locator('#beautyGuest').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(output, `${engine}-minion-editor.png`) });
  await page.locator('#beautyTry').click();
  await page.locator('#previewStart').click();
  const salon = await page.locator('#salon').elementHandle().then(handle => handle.contentFrame());
  await salon.waitForFunction(() => window.beautyDebug?.ready);
  await page.locator('#talkLayer').waitFor();
  assert.equal(await salon.locator('.beautyNext').isDisabled(), true);
  const before = await snapshot(salon);
  const lineCount = await readRequest(page);
  assert(lineCount > 1, 'the multi-line character request is played through its last line');
  await page.screenshot({ path: path.join(output, `${engine}-minion-request.png`) });
  assert.equal(await page.locator('#beautyAsk').isVisible(), true);
  const briefCount = await page.locator('#talkCount').textContent();
  await page.locator('#beautyAsk').click();
  await page.waitForFunction(previous => document.getElementById('talkCount').textContent !== previous, briefCount);
  await readRequest(page);
  assert.equal(await page.locator('#beautyAsk').isVisible(), false);
  await page.locator('#beautyAccept').click();
  await page.locator('#talkLayer').waitFor({ state: 'hidden' });
  await salon.waitForFunction(() => !beautyDebug.briefing);
  assert.deepEqual((await snapshot(salon)).material, before.material, 'dialogue does not edit the horns');
  assert.equal(await salon.locator('[data-tool="hammer"]').getAttribute('class'), 'sculptTool selected',
    'accepting a horn request keeps hammer/chisel selected');
  assert.equal(await salon.locator('[data-tool="scissors"]').count(), 0);
  assert.match(await salon.locator('[data-tool="grow"]').innerText(), /뿔/);
  return salon;
}

async function setSize(salon, value) {
  // Native keyboard input also verifies that the displayed tool control works.
  const control = salon.locator('#sculptSize');
  await control.focus();
  await control.press('Home');
  for (let n = 1; n < value; n++) await control.press('ArrowRight');
  assert.equal(await control.inputValue(), String(value));
}

function point(index) { return [(index % 160 + 0.5) * 2, (Math.floor(index / 160) + 0.5) * 2]; }

async function stroke(page, salon, from, to = from) {
  const box = await salon.locator('.sculptCanvas').boundingBox();
  const coords = ([x, y]) => [box.x + x / 320 * box.width, box.y + y / 350 * box.height];
  await page.mouse.move(...coords(from));
  await page.mouse.down();
  await page.mouse.move(...coords(to));
  await page.mouse.up();
}

function rowRuns(mask) {
  const runs = [];
  for (let y = 0; y < 175; y++) for (let x = 0; x < 160; x++) {
    if (!mask[y * 160 + x]) continue;
    const start = x;
    while (x + 1 < 160 && mask[y * 160 + x + 1]) x++;
    runs.push([point(y * 160 + start), point(y * 160 + x)]);
  }
  return runs;
}

async function checkSculpt(page, salon, engine) {
  const initial = await snapshot(salon);
  assert.equal(initial.guest.id, 10004);
  assert.equal(initial.guest.previewOnly, true);
  assert.equal(initial.guest.beauty.growth.material, 'horn');
  assert.equal(initial.guest.beauty.growth.mask, 'original');
  assert.equal(initial.original.length, 160 * 175);
  const { hornTrim, hornKeep, protectedFace } = initial.masks;
  assert(hornTrim.some(Boolean) && hornKeep.some(Boolean) && protectedFace.some(Boolean));
  assert(initial.original.every((v, n) => v === hornTrim[n] + hornKeep[n]),
    'the source horn silhouette is partitioned into trim and keep targets');
  const faceCell = protectedFace.findIndex(Boolean);
  const keepCell = hornKeep.findIndex(Boolean);
  const beforeFace = initial.material;
  await setSize(salon, 1);
  await stroke(page, salon, point(faceCell));
  assert.deepEqual((await snapshot(salon)).material, beforeFace, 'hammer cannot cut the separate face artwork');
  await salon.locator('[data-tool="grow"]').click();
  await setSize(salon, 30);
  await stroke(page, salon, [10, 260], [310, 260]);
  await setSize(salon, 1);
  await stroke(page, salon, point(faceCell));
  assert.deepEqual((await snapshot(salon)).material, beforeFace,
    'growth adds nothing to the background, clothes, or uneditable face');

  await salon.locator('[data-tool="hammer"]').click();
  await stroke(page, salon, point(keepCell));
  const cut = await snapshot(salon);
  assert.equal(cut.material[keepCell], 0, 'a real pointer tap cuts an editable target horn cell');
  // A single lost pixel may intentionally fall inside the request tolerance.
  assert(cut.material.every((v, n) => !v || initial.original[n]), 'hammer leaves only original material');
  await salon.locator('[data-tool="grow"]').click();
  // Restore every removed source cell through the actual brush, including any
  // piece detached by the physical cut. No direct material writes are used.
  for (const [from, to] of rowRuns(initial.original.map((v, n) => Number(v && !cut.material[n])))) {
    await stroke(page, salon, from, to);
  }
  const repaired = await snapshot(salon);
  assert.equal(repaired.material[keepCell], 1, 'growth restores an erased horn cell to its original material');
  assert.deepEqual(repaired.material, initial.material, 'the original horn silhouette can be repaired');
  assert.equal(repaired.scores.cut, initial.scores.cut, 'repair restores the preservation score');
  await salon.locator('[data-tool="hammer"]').click();
  for (const [from, to] of rowRuns(hornTrim)) await stroke(page, salon, from, to);
  const finished = await snapshot(salon);
  assert(finished.material.every((v, n) => v === hornKeep[n]),
    'precise pointer strokes remove the large horns and preserve both small target horns');
  assert.equal(finished.scores.cut, finished.guest.beauty.weights.cut);
  assert.equal(finished.scores.total, 100);
  assert(finished.material.every((v, n) => !protectedFace[n] || v === 0), 'no editable material is created on the face');
  await salon.locator('#showBeautyZones').click();
  assert.equal(await salon.locator('#showBeautyZones').getAttribute('aria-pressed'), 'true');
  await page.screenshot({ path: path.join(output, `${engine}-minion-trim-guide.png`) });
  await salon.locator('#showBeautyZones').click();
  await page.screenshot({ path: path.join(output, `${engine}-minion-finished.png`) });
  return finished;
}

async function checkResult(page, salon, finished, engine) {
  await salon.locator('.beautyNext').click();
  await salon.waitForFunction(() => beautyDebug.result.revealed);
  assert.equal(await salon.locator('#beautyScreen').getAttribute('data-result-mood'), 'satisfied');
  assert.deepEqual((await snapshot(salon)).material, finished.material,
    'the result reaction preserves the horns the player actually styled');
  await page.screenshot({ path: path.join(output, `${engine}-minion-result.png`) });
  await salon.locator('#beautyResultContinue').click();
  await page.locator('#returnBeauty').waitFor();
  await page.locator('#returnBeauty').click();
  await page.locator('#beautyGuest').waitFor();
  assert.equal(await page.locator('#beautyGuest').inputValue(), '10004');
  for (const [id, expected] of [[10001, 'scissors'], [10003, 'hammer']]) {
    await page.locator('#beautyGuest').selectOption(String(id));
    assert.equal(await page.locator('#toolSelect').inputValue(), expected, 'the existing customer settings remain selectable');
  }
}

try {
  for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
    if (process.env.YACHA_MINION_ENGINE && process.env.YACHA_MINION_ENGINE !== name) continue;
    const browser = await engine.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const salon = await openPreview(page, name);
      const finished = await checkSculpt(page, salon, name);
      await checkResult(page, salon, finished, name);
      assert.deepEqual(errors, []);
      report.push({ engine: name, guest: 10004, score: finished.scores.total,
        sourceCells: finished.original.reduce((sum, cell) => sum + cell, 0),
        remainingCells: finished.material.reduce((sum, cell) => sum + Number(!!cell), 0),
        checks: ['editor', 'beauty toggle', 'combat workbook boundary', 'edited request roundtrip',
          'cape clipping', 'story exclusion', 'multi-line request', 'hammer', 'face protection',
          'original-only growth', 'repair', 'precise target', 'result', 'editor return'] });
      console.log(`${name}: minion editor, horn-only sculpt/repair, target score, result and return passed`);
    } finally { await browser.close(); }
  }
} finally {
  await new Promise(resolve => server.close(resolve));
  await fs.writeFile(path.join(output, 'browser-results.json'), JSON.stringify({
    base, checkedAt: new Date().toISOString(), results: report,
  }, null, 2));
}

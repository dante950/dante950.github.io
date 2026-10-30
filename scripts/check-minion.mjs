import { chromium, webkit } from 'playwright';
import {rootedBeautyMaterial,inBeautyRegion} from '../src/beauty-shape.js';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

// Drive the actual editor and pointer controls. Diagnostics are read-only: the
// test never writes a material cell, score, expression, or application state.
const root = path.resolve('dist');
const output = path.resolve(process.env.YACHA_MINION_SCREENSHOTS || '../local-demo-2026-10-16');
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
    paint: beautyDebug.paint,
    original: beautyDebug.original,
    masks: Object.fromEntries(Object.entries(beautyDebug.masks).map(([name, mask]) => [name, Array.from(mask)])),
    scores: beautyDebug.scores,
    shape: beautyDebug.shape, expression: beautyDebug.expression, reaction: beautyDebug.reaction,
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
    assert(!data.sheets.find(sheet => sheet.name === '몬스터 페이즈').rows.some(row => row.MonsterID === 10004),
      'beauty-only minion does not invent combat phases');
    assert.deepEqual(data.sheets.find(sheet => sheet.name === '미용 대사 연결').rows.filter(row => row.MonsterID === 10004), editedDialogue.links);
    for (const name of ['대화 그룹', '대사']) {
      const expected = name === '대화 그룹' ? editedDialogue.groups : editedDialogue.lines;
      assert.deepEqual(data.sheets.find(sheet => sheet.name === name).rows.filter(row => groupIDs.has(row.GroupID)), expected,
        'published minion request groups and lines are included in the workbook editor');
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
  await page.locator('#playChapter').click();
  assert.equal(await page.locator('[data-start-guest="10004"]').count(), 1);
  assert.equal(await page.locator('[data-start-guest="10002"]').count(), 0);
  assert.equal(await page.locator('[data-start-guest]').count(), 3);
  await page.locator('#cancelStoryStart').click();
  await page.locator('#developer').click();
  if (await page.locator('#updateOK').isVisible()) await page.locator('#updateOK').click();
  await page.locator('[data-editor="beauty"]').first().click();
  const options = await page.locator('#beautyGuest option').evaluateAll(nodes => nodes.map(node => Number(node.value)));
  for (const id of [10001, 10003, 10004]) assert(options.includes(id), `beauty editor includes guest ${id}`);
  await page.locator('#beautyGuest').selectOption('10004');
  await checkEditorRoundtrip(page);
  await page.locator('[data-select-region="3"]').click();
  await page.locator('[data-rfield="maxRatio"]').fill('0.85');
  await page.locator('[data-rfield="maxRatio"]').blur();
  assert.equal(await page.evaluate(() => fullflow.project.guests.find(g=>g.id===10004).beauty.cutRegions.find(r=>r.rule==='area').maxRatio), .85);
  await page.locator('[data-rfield="maxRatio"]').fill('0.8');
  await page.locator('[data-rfield="maxRatio"]').blur();
  await page.locator('[data-select-region="0"]').click();
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
  const { roots, eyes, face } = initial.masks;
  assert(initial.guest.beauty.growth.connected && initial.guest.beauty.growth.allowFace);
  assert(roots.some(Boolean) && eyes.some(Boolean));
  for(const region of initial.guest.beauty.cutRegions.filter(r=>r.mask==='eyes')){
    for(let n=0;n<eyes.length;n++)if(inBeautyRegion(...point(n),region))assert.equal(eyes[n],1,`${region.key}: the entire eye zone detects contact`);
  }
  assert.equal(initial.shape.areaRatio, 1);
  assert.equal(initial.shape.eyeCoverCount, 0, 'arrival horns leave all three eyes clear');
  const nearest = (mask, xy) => mask.reduce((best, v, n) => !v ? best : best < 0 || distance(point(n), xy) < distance(point(best), xy) ? n : best, -1);
  const distance = (a, b) => (a[0]-b[0])**2+(a[1]-b[1])**2;
  const leftRoot = nearest(roots, [130, 120]), rightRoot = nearest(roots, [190, 120]);
  const faceCell = face.findIndex((v,n) => v && !initial.original[n]);
  await setSize(salon, 1);
  await stroke(page, salon, point(faceCell));
  assert.deepEqual((await snapshot(salon)).material, initial.material, 'cutting an empty face does not cut the underlying face');
  await salon.locator('[data-tool="grow"]').click();
  await setSize(salon, 5);
  await stroke(page, salon, [20, 174], [64, 194]);
  await stroke(page, salon, [20, 174], point(leftRoot));
  assert.deepEqual((await snapshot(salon)).material, initial.material, 'a stroke starting in air cannot grow, even if dragged onto a horn');
  for (const region of initial.guest.beauty.cutRegions.filter(r => r.mask === 'eyes')) {
    const eye = eyes.findIndex((v,n) => v && inBeautyRegion(...point(n), region));
    assert(eye >= 0, `${region.key} has an actual source eye mask`);
    const root = nearest(roots, point(eye));
    await salon.locator('[data-tool="grow"]').click();
    await setSize(salon, 3);
    await stroke(page, salon, point(root), point(eye));
    const touched = await snapshot(salon);
    assert.equal(touched.reaction.count, Math.min(2, initial.guest.beauty.cutRegions.filter(r=>r.mask==='eyes').indexOf(region)+1));
    assert.equal(touched.material[eye], 2, 'horn grows over the eye on the face');
    assert(touched.shape.eyeCoverCount > 0 && touched.shape.hardFailure);
    assert.equal(touched.scores.cut, 0);
    assert.equal(touched.expression, 'angry');
    if(region.key==='EyeLeft'){assert.equal(touched.reaction.text,initial.guest.beauty.eyeContactSecondLine);await page.screenshot({path:path.join(output,engine+'-minion-second-complaint.png')});}
    if(region.key==='EyeRight')assert.equal(touched.reaction.count,2,'third contact has no further complaint');
    if (region.key === 'EyeTop') {
      assert.equal(touched.reaction.visible, true);
      assert.equal(touched.reaction.text, initial.guest.beauty.eyeContactLine);
      assert(await salon.locator('.beautyEyeReaction').evaluate(node => Number(getComputedStyle(node).zIndex) > Number(getComputedStyle(document.querySelector('.beautyCustomer')).zIndex)), 'the complaint stays in front of the horns');
      await page.screenshot({path: path.join(output, `${engine}-minion-eye-contact.png`)});
      await stroke(page, salon, point(root), point(eye));
      assert.equal((await snapshot(salon)).reaction.count, touched.reaction.count, 'continuous contact does not repeat the line');
    }
    await salon.locator('[data-tool="hammer"]').click();
    await setSize(salon, 1);
    for (const [from,to] of rowRuns(touched.material.map((v,n) => Number(v && !initial.original[n])))) await stroke(page, salon, from, to);
    const clear = await snapshot(salon);
    assert.equal(clear.shape.eyeCoverCount, 0, 'removing the intrusive horn clears the eye condition');
    assert.deepEqual(clear.masks.face, face, 'the underlying face artwork is preserved');
  }
  // Broad cuts leave the small roots usable, even after removing every branch.
  await salon.locator('[data-tool="hammer"]').click();
  await setSize(salon, 30);
  for (const y of [25,75,125]) await stroke(page, salon, [1,y], [319,y]);
  const bare = await snapshot(salon);
  assert(bare.material.every((v,n) => !roots[n] || !!v), 'head-connected roots remain available to regrow');
  assert(bare.shape.areaRatio < .3);
  await salon.locator('[data-tool="grow"]').click();
  await setSize(salon, 4);
  await stroke(page, salon, point(leftRoot), [90,60]);
  await stroke(page, salon, [90,60], [60,40]);
  await stroke(page, salon, point(rightRoot), [230,60]);
  await stroke(page, salon, [230,60], [260,40]);
  const styled = await snapshot(salon);
  assert(styled.material.some((v,n) => v && !initial.original[n]), 'new branches are not constrained by the source silhouette');
  assert(styled.material.some((v,n) => v && initial.masks.hornTrim[n]), 'old trim locations are now allowed in a different shape');
  assert(styled.shape.areaRatio < .8);
  assert.equal(styled.scores.cut, 50, 'a different connected shape satisfies both requests');
  await page.screenshot({path: path.join(output, `${engine}-minion-connected-style.png`)});
  await salon.locator('[data-tool="hammer"]').click();
  await setSize(salon, 8);
  await stroke(page, salon, [75,50]);
  const severed = await snapshot(salon);
  assert.equal(severed.material[20*160+30], 0, 'the severed far tip falls away');
  const connected = rootedBeautyMaterial(severed.material, roots, 160,175);
  assert(severed.material.every((v,n) => !v || connected[n]), 'every remaining horn cell is attached to the head');
  // Oversize only above the face, so failure must be caused by area, not eyes.
  const start = nearest(severed.material, [100,60]);
  await salon.locator('[data-tool="grow"]').click();
  await setSize(salon, 30);
  await stroke(page, salon, point(start), [280,25]);
  await stroke(page, salon, [280,25], [280,85]);
  await stroke(page, salon, [280,85], [40,85]);
  const oversized = await snapshot(salon);
  assert.match(oversized.reaction.text,/왔을 때보다/);
  assert.equal(oversized.shape.eyeCoverCount, 0);
  assert(oversized.shape.areaRatio > 1 && oversized.shape.hardFailure);
  assert.equal(oversized.scores.cut, 0, 'more horn area than arrival fails even with clear eyes');
  await page.screenshot({path: path.join(output, `${engine}-minion-overgrown.png`)});
  await salon.locator('[data-tool="hammer"]').click();
  await setSize(salon, 1);
  for (const [from,to] of rowRuns(oversized.material.map((v,n) => Number(v && !severed.material[n])))) await stroke(page, salon, from, to);
  const finished = await snapshot(salon);
  assert.equal(finished.scores.cut, 50);
  assert.equal(finished.shape.hardFailure, false);
  await salon.locator('#showBeautyZones').click();
  await page.screenshot({path: path.join(output, `${engine}-minion-eye-guide.png`)});
  await salon.locator('#showBeautyZones').click();
  return finished;
}


async function checkDrawing(page, salon, engine) {
  await salon.locator('.beautyNext').click();
  await page.locator('#talkLayer').waitFor({ state: 'visible' });
  await readRequest(page);
  assert.match(await page.locator('#talkText').textContent(), /666年|666년/);
  assert.match(await page.locator('#talkText').textContent(), /반차/);
  await page.screenshot({ path: path.join(output, `${engine}-minion-dark-circle-request.png`) });
  await page.locator('#beautyAsk').click();
  await page.waitForFunction(() => document.getElementById('talkText').textContent.includes('이마의'));
  await readRequest(page);
  await page.locator('#beautyAccept').click();
  await salon.waitForFunction(() => !beautyDebug.briefing);
  const before = await snapshot(salon);
  await setSize(salon, 3);
  await salon.locator('[data-color="#FF3024"]').click();
  await stroke(page, salon, [152, 138], [168, 138]);
  assert.equal((await snapshot(salon)).scores.draw, 0, 'a bright color does not satisfy the darkest-circle request');
  await salon.locator('#undoBeauty').click();
  assert.deepEqual((await snapshot(salon)).paint, before.paint);
  await salon.locator('[data-color="#03051B"]').click();
  await stroke(page, salon, [152, 138], [168, 138]);
  assert((await snapshot(salon)).scores.draw<=10.01,'one eye alone cannot complete the three circles');
  await stroke(page,salon,[140,162],[152,162]);
  await stroke(page,salon,[170,162],[182,162]);
  const painted = await snapshot(salon);
  await fs.writeFile(path.join(output,engine+'-drawing-diagnostics.json'),JSON.stringify(painted));
  assert(painted.scores.draw >= 27, 'a thin horizontal brush stroke completes all three dark circles without stencil filling');
  assert(painted.scores.total >= before.scores.total+27);
  assert.deepEqual(painted.material, before.material, 'drawing does not change the horn silhouette');
  await salon.locator('#erasePaint').click();
  await stroke(page, salon, [152, 138], [168, 138]);
  assert((await snapshot(salon)).scores.draw < painted.scores.draw);
  await salon.locator('#undoBeauty').click();
  assert.deepEqual((await snapshot(salon)).paint, painted.paint, 'erased dark circles can be undone');
  // Painting the whole face cannot substitute for the specific under-eye request.
  await salon.locator('[data-color="#03051B"]').click();
  await setSize(salon, 30);
  await stroke(page, salon, [160, 118], [160, 190]);
  assert((await snapshot(salon)).scores.draw < 20, 'covering the eye and face loses the request points');
  await salon.locator('#undoBeauty').click();
  assert.deepEqual((await snapshot(salon)).paint, painted.paint);
  await setSize(salon, 4);
  await salon.locator('#showBeautyZones').click();
  await page.screenshot({path:path.join(output,engine+'-minion-draw-guide.png')});
  await salon.locator('#showBeautyZones').click();
  const controls = await salon.locator('.beautyPanel').evaluate(panel => ({
    bottom: panel.getBoundingClientRect().bottom,
    hintBottom: panel.querySelector('.sculptHint').getBoundingClientRect().bottom,
  }));
  assert(controls.hintBottom <= controls.bottom, 'the extra dark swatch and drawing controls fit inside their panel');
  await page.screenshot({ path: path.join(output, `${engine}-minion-dark-circle.png`) });
  return painted;
}

async function checkResult(page, salon, finished, engine) {
  await salon.locator('.beautyNext').click();
  await readRequest(page);
  assert.match(await page.locator('#talkText').innerText(),/빨간 코 장식/);
  await page.locator('#beautyAccept').click();await page.locator('#talkLayer').waitFor({state:'hidden'});
  await salon.waitForFunction(()=>!beautyDebug.briefing);
  await salon.locator('[data-sticker="ST-FUN-NOSE-RED"]').click();
  await stroke(page,salon,[200,180]);assert.equal((await snapshot(salon)).scores.attach,0,'off-nose placement does not count');
  await stroke(page,salon,[200,180]);assert.equal(await salon.evaluate(()=>beautyDebug.placements.length),0,'click removes misplaced sticker');
  for(const point of [[150,164],[170,164],[160,152],[160,176]]){
    await stroke(page,salon,point);assert.equal((await snapshot(salon)).scores.attach,20,'generous circle accepts nearby placement');
    await salon.locator('#undoBeauty').click();
  }
  await stroke(page,salon,[160,164]);assert.equal((await snapshot(salon)).scores.attach,20);
  await salon.locator('#undoBeauty').click();assert.equal((await snapshot(salon)).scores.attach,0);
  await stroke(page,salon,[160,164]);assert((await snapshot(salon)).scores.total>=97);
  await salon.locator('#showBeautyZones').click();
  await page.screenshot({path:path.join(output,engine+'-minion-nose-guide.png')});
  await salon.locator('#showBeautyZones').click();
  await page.screenshot({path:path.join(output,engine+'-minion-red-nose.png')});
  await salon.locator('.beautyNext').click();
  await salon.waitForFunction(() => beautyDebug.result.revealed);
  assert.equal(await salon.locator('#beautyScreen').getAttribute('data-result-mood'), 'satisfied');
  assert.deepEqual((await snapshot(salon)).material, finished.material,
    'the result reaction preserves the horns the player actually styled');
  await page.screenshot({ path: path.join(output, `${engine}-minion-result.png`) });
  // The result may automatically finish while a screenshot is being encoded.
  if(await salon.locator('#beautyResultContinue').isVisible()){
    const button=await salon.locator('#beautyResultContinue').boundingBox();
    if(button)await page.mouse.click(button.x+button.width/2,button.y+button.height/2);
  }
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
      await checkSculpt(page, salon, name);
      const finished = await checkDrawing(page, salon, name);
      await checkResult(page, salon, finished, name);
      assert.deepEqual(errors, []);
      report.push({ engine: name, guest: 10004, beforeAttachScore: finished.scores.total,
        sourceCells: finished.original.reduce((sum, cell) => sum + cell, 0),
        remainingCells: finished.material.reduce((sum, cell) => sum + Number(!!cell), 0),
        checks: ['editor', 'beauty toggle', 'combat workbook boundary', 'edited request roundtrip',
          'cape clipping', 'two-day story inclusion', 'multi-line request', 'hammer', 'face protection',
          'connected growth only', 'face overlay', 'three eyes contact', 'two complaints maximum', 'root recovery', 'free shape by area', 'severed branch removal', 'oversize failure', 'dark-circle request',
          'wrong color', 'small brush completion', 'erase and undo', 'face overpaint penalty', 'red nose request', 'off-nose failure', 'remove sticker', 'nose20 points', 'sticker undo', 'result', 'editor return'] });
      console.log(`${name}: minion free growth, new horn material, dark circles, result and return passed`);
    } finally { await browser.close(); }
  }
} finally {
  await new Promise(resolve => server.close(resolve));
  await fs.writeFile(path.join(output, `browser-results${process.env.YACHA_MINION_ENGINE ? '-'+process.env.YACHA_MINION_ENGINE : ''}.json`), JSON.stringify({
    base, checkedAt: new Date().toISOString(), results: report,
  }, null, 2));
}

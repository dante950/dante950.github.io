import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GUESTS, DEFAULT_SETTINGS, normalizeSettings, createRun, nextGuest, completeVisit,
  dayVisits, canClose, closingSummary, closeDay, nextDay, derivePreview,
} from '../src/closing/model.js';

function finishDayOne(settings, outcomes = ['beauty', 'beauty']) {
  let run = createRun(settings);
  run = completeVisit(run, 'zombie', outcomes[0]).run;
  return completeVisit(run, 'sans', outcomes[1]).run;
}

test('successful beauty retains its review and base reward on refusal or offer defeat', () => {
  for (const outcome of ['beauty', 'offerLoss']) {
    const initial = createRun();
    const { run, visit } = completeVisit(initial, 'zombie', outcome);
    assert.equal(run.total, 1500);
    assert.equal(visit.reviewKind, 'beauty');
    assert.equal(visit.bonus, 0);
    assert.equal(initial.total, 0);
    assert.equal(initial.visits.length, 0);
    assert.equal(nextGuest(run).id, 'sans');
  }
});

test('only proposed battle victory grants its bonus, while forced victory praises battle', () => {
  const offered = completeVisit(createRun(), 'zombie', 'offerWin');
  assert.equal(offered.visit.gain, 1700);
  assert.equal(offered.visit.bonus, 200);
  assert.equal(offered.visit.reviewKind, 'beauty');
  const forced = completeVisit(createRun(), 'zombie', 'forcedWin');
  assert.equal(forced.visit.gain, 1500);
  assert.equal(forced.visit.bonus, 0);
  assert.equal(forced.visit.reviewKind, 'battle');
});

test('forced losses allow unlimited retry of the same encounter without a reward', () => {
  const initial = createRun();
  let run = initial;
  for (let attempt = 0; attempt < 100; attempt++) {
    const failed = completeVisit(run, 'zombie', 'forcedLoss');
    assert.equal(failed.reason, 'retry');
    assert.equal(failed.visit, null);
    assert.equal(failed.run, initial);
    run = failed.run;
  }
  assert.equal(run.total, 0);
  assert.equal(run.visits.length, 0);
  assert.equal(canClose(run), false);
  assert.equal(nextGuest(run).id, 'zombie');
  const victory = completeVisit(run, 'zombie', 'forcedWin');
  assert.equal(victory.run.total, 1500);
  assert.equal(victory.run.visits.length, 1);
});

test('visit completion, summary replay and repeated close cannot duplicate rewards', () => {
  let run = completeVisit(createRun(), 'zombie', 'offerWin').run;
  const duplicate = completeVisit(run, 'zombie', 'offerWin');
  assert.equal(duplicate.reason, 'already-completed');
  assert.equal(duplicate.run, run);
  run = completeVisit(run, 'sans', 'beauty').run;
  const snapshot = structuredClone(run);
  for (let replay = 0; replay < 10; replay++) {
    assert.equal(closingSummary(run).gain, 3200);
  }
  assert.deepEqual(run, snapshot);
  const closed = closeDay(run);
  assert.equal(closeDay(closed), closed);
  assert.equal(closed.total, 3200);
});

test('visitors must finish in order and all scheduled visitors must finish before closing', () => {
  const initial = createRun();
  assert.equal(completeVisit(initial, 'sans', 'beauty').reason, 'out-of-order');
  assert.equal(completeVisit(initial, 'minion', 'beauty').reason, 'out-of-order');
  assert.equal(completeVisit(initial, 'unknown', 'beauty').reason, 'invalid-guest');
  assert.equal(completeVisit(initial, 'zombie', 'constructor').reason, 'invalid-outcome');
  assert.equal(closeDay(initial), initial);
  assert.equal(nextDay(initial), initial);
  let run = completeVisit(initial, 'zombie', 'beauty').run;
  assert.equal(canClose(run), false);
  run = completeVisit(run, 'sans', 'offerLoss').run;
  assert.equal(canClose(run), true);
  assert.equal(nextGuest(run), null);
});

test('day-two replay starts at the previous total and has only the day-two visitor', () => {
  const dayOne = finishDayOne(undefined, ['offerWin', 'beauty']);
  let dayTwo = nextDay(closeDay(dayOne));
  assert.equal(dayTwo.day, 2);
  assert.equal(dayTwo.status, 'salon');
  assert.equal(dayTwo.dayStart, 3200);
  assert.equal(dayTwo.total, 3200);
  assert.deepEqual(dayVisits(dayTwo), []);
  dayTwo = completeVisit(dayTwo, 'minion', 'forcedWin').run;
  const summary = closingSummary(dayTwo);
  assert.equal(summary.start, 3200);
  assert.equal(summary.gain, 2000);
  assert.equal(summary.total, 5200);
  assert.deepEqual(summary.visits.map(visit => visit.guestId), ['minion']);
  assert.equal(summary.visits[0].before, 3200);
  assert.equal(summary.visits[0].after, 5200);
});

test('one star requires both days and is awarded at day-two closing, never early', () => {
  const lowThreshold = { threshold: 1000 };
  let run = finishDayOne(lowThreshold);
  assert.equal(run.stars, 0);
  assert.equal(closingSummary(run).eligibleForStar, false);
  run = closeDay(run);
  assert.equal(run.stars, 0);
  run = nextDay(run);
  assert.equal(closingSummary(run).eligibleForStar, false);
  run = completeVisit(run, 'minion', 'beauty').run;
  assert.equal(run.stars, 0);
  assert.equal(closingSummary(run).eligibleForStar, true);
  assert.equal(closeDay(run).stars, 1);
  assert.equal(derivePreview({}, { threshold: 5001 }).stars, 0);
  assert.equal(derivePreview().stars, 1);
});

test('default rewards reach 5000 after both days even without offered-battle bonuses', () => {
  const preview = derivePreview({ zombie: 'offerLoss', sans: 'beauty', minion: 'forcedWin' });
  assert.equal(preview.total, 5000);
  assert.equal(preview.days[0].total, 3000);
  assert.equal(preview.days[0].eligibleForStar, false);
  assert.equal(preview.days[1].eligibleForStar, true);
  assert.equal(preview.complete, true);
  assert.equal(preview.canReachStar, true);
  const allBonus = derivePreview(Object.fromEntries(GUESTS.map(guest => [guest.id, 'offerWin'])));
  assert.equal(allBonus.total, 5600);
  assert.equal(allBonus.days[0].total, 3400);
});

test('DAY 3 is an inert ending reveal, and a pending retry cannot advance a preview', () => {
  const ended = derivePreview().run;
  assert.equal(ended.day, 3);
  assert.equal(ended.status, 'ending');
  assert.equal(nextGuest(ended), null);
  assert.equal(canClose(ended), false);
  assert.equal(nextDay(ended), ended);
  assert.equal(closeDay(ended), ended);
  assert.equal(completeVisit(ended, 'minion', 'offerWin').reason, 'not-playing');
  const pending = derivePreview({ zombie: 'forcedLoss' });
  assert.equal(pending.complete, false);
  assert.equal(pending.blockedGuestId, 'zombie');
  assert.equal(pending.run.day, 1);
  assert.equal(pending.total, 0);
});

test('editable follower values are copied and normalized to safe whole numbers', () => {
  assert.deepEqual(normalizeSettings(null), DEFAULT_SETTINGS);
  const input = { threshold: '0', bonus: -20, base: { zombie: '1600.9', sans: '', minion: NaN } };
  const run = createRun(input);
  assert.deepEqual(run.settings, { threshold: 1, bonus: 0, base: { zombie: 1600, sans: 1500, minion: 2000 } });
  input.base.zombie = 999;
  assert.equal(run.settings.base.zombie, 1600);
  assert.equal(normalizeSettings({ threshold: Infinity }).threshold, 5000);
  assert.equal(normalizeSettings({ bonus: true }).bonus, 200);
  assert.equal(normalizeSettings({ bonus: Number.MAX_VALUE }).bonus, 1_000_000_000);
  assert.equal(DEFAULT_SETTINGS.base.zombie, 1500);
});

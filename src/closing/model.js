/** Rules for the closing-screen experiment, separate from the public story data. */
export const GUESTS = Object.freeze([
  Object.freeze({ id: 'zombie', name: '취준좀비', day: 1, base: 1500 }),
  Object.freeze({ id: 'sans', name: '샌즈', day: 1, base: 1500 }),
  Object.freeze({ id: 'minion', name: '마왕 부하', day: 2, base: 2000 }),
]);

export const OUTCOMES = Object.freeze({
  beauty: '미용 성공 · 야차 거절',
  offerWin: '미용 성공 · 제안 야차 승리',
  offerLoss: '미용 성공 · 제안 야차 패배',
  forcedWin: '미용 실패 · 강제 야차 승리',
  forcedLoss: '미용 실패 · 강제 야차 패배',
});

export const DEFAULT_SETTINGS = Object.freeze({
  threshold: 5000,
  bonus: 200,
  base: Object.freeze({ zombie: 1500, sans: 1500, minion: 2000 }),
});

// Bound editable values so count-up animations and addition remain finite and safe.
const MAX_SETTING = 1_000_000_000;
function wholeNumber(value, fallback, minimum = 0) {
  if (value === null || value === undefined || typeof value === 'boolean'
      || (typeof value === 'string' && value.trim() === '')
      || !['string', 'number'].includes(typeof value)) return fallback;
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(MAX_SETTING, Math.max(minimum, Math.floor(number)));
}

export function normalizeSettings(input = {}) {
  const value = input && typeof input === 'object' ? input : {};
  const base = value.base && typeof value.base === 'object' ? value.base : {};
  return {
    threshold: wholeNumber(value.threshold, DEFAULT_SETTINGS.threshold, 1),
    bonus: wholeNumber(value.bonus, DEFAULT_SETTINGS.bonus),
    base: Object.fromEntries(GUESTS.map(guest => [
      guest.id, wholeNumber(base[guest.id], DEFAULT_SETTINGS.base[guest.id]),
    ])),
  };
}

export function createRun(settings = DEFAULT_SETTINGS) {
  return {
    day: 1,
    total: 0,
    dayStart: 0,
    visits: [],
    status: 'salon',
    stars: 0,
    settings: normalizeSettings(settings),
  };
}

// Adapt completed story visits only; jumping to a later customer never invents rewards.
export function runFromStory(records,day){
 const ids={10001:'zombie',10003:'sans',10004:'minion'};
 const visits=records.filter(r=>ids[r.id]&&r.day<=day).map(r=>({
  ...r,id:`day-${r.day}-${ids[r.id]}`,guestId:ids[r.id],
  reviewKind:r.forced?'battle':'beauty',
 }));
 const today=visits.filter(r=>r.day===day);
 const total=visits.at(-1)?.after||0;
 return {...createRun(),day,total,dayStart:today[0]?.before??total,visits};
}

export function dayVisits(run) {
  return run.visits.filter(visit => visit.day === run.day);
}

export function nextGuest(run) {
  if (run.status !== 'salon') return null;
  return GUESTS.find(guest => guest.day === run.day
    && !run.visits.some(visit => visit.guestId === guest.id)) ?? null;
}

export function completeVisit(run, guestId, outcome) {
  const blocked = reason => ({ run, visit: null, reason });
  if (run.status !== 'salon') return blocked('not-playing');
  const guest = GUESTS.find(item => item.id === guestId);
  if (!guest) return blocked('invalid-guest');
  if (!Object.hasOwn(OUTCOMES, outcome)) return blocked('invalid-outcome');
  if (run.visits.some(visit => visit.guestId === guestId)) return blocked('already-completed');
  if (nextGuest(run)?.id !== guestId) return blocked('out-of-order');
  // A forced loss stays at this encounter, with no completed visit or reward.
  if (outcome === 'forcedLoss') return blocked('retry');

  const settings = normalizeSettings(run.settings);
  const base = settings.base[guest.id];
  const bonus = outcome === 'offerWin' ? settings.bonus : 0;
  const gain = base + bonus;
  const visit = {
    id: `day-${guest.day}-${guest.id}`,
    guestId: guest.id,
    day: guest.day,
    name: guest.name,
    outcome,
    reviewKind: outcome === 'forcedWin' ? 'battle' : 'beauty',
    base,
    bonus,
    gain,
    before: run.total,
    after: run.total + gain,
  };
  return {
    run: { ...run, total: visit.after, visits: [...run.visits, visit] },
    visit,
  };
}

function allGuestsCompleted(run) {
  const guests = GUESTS.filter(guest => guest.day === run.day);
  return guests.length > 0 && guests.every(guest =>
    run.visits.some(visit => visit.guestId === guest.id && visit.day === guest.day));
}

export function canClose(run) {
  return run.status === 'salon' && allGuestsCompleted(run);
}

/** A display-only record: reading/replaying this never awards followers. */
export function closingSummary(run) {
  const visits = dayVisits(run);
  return {
    day: run.day,
    start: run.dayStart,
    total: run.total,
    gain: run.total - run.dayStart,
    visits,
    eligibleForStar: run.day === 2 && allGuestsCompleted(run)
      && run.total >= normalizeSettings(run.settings).threshold,
  };
}

export function closeDay(run) {
  if (!canClose(run)) return run;
  const { eligibleForStar } = closingSummary(run);
  return { ...run, status: 'closed', stars: eligibleForStar ? 1 : run.stars };
}

export function nextDay(run) {
  if (run.status !== 'closed') return run;
  if (run.day === 1) return { ...run, day: 2, dayStart: run.total, status: 'salon' };
  // DAY 3 is only the upgrade reveal; no visitors or playable salon are available.
  if (run.day === 2) return { ...run, day: 3, dayStart: run.total, status: 'ending' };
  return run;
}

/** choices = { zombie: 'beauty', sans: 'offerWin', minion: 'forcedWin' }. */
export function derivePreview(choices = {}, settings = DEFAULT_SETTINGS) {
  let run = createRun(settings);
  const days = [];
  for (const guest of GUESTS) {
    const result = completeVisit(run, guest.id, choices?.[guest.id] ?? 'beauty');
    run = result.run;
    if (!result.visit) {
      days.push(closingSummary(run));
      return { run, days, visits: run.visits, total: run.total, stars: run.stars,
        complete: false, canReachStar: false, blockedGuestId: guest.id, reason: result.reason };
    }
    if (canClose(run)) {
      days.push(closingSummary(run));
      run = nextDay(closeDay(run));
    }
  }
  return { run, days, visits: run.visits, total: run.total, stars: run.stars,
    complete: true, canReachStar: run.stars === 1 };
}

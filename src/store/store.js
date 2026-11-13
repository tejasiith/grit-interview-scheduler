import { useSyncExternalStore } from 'react';
import { RULES, MS, INTERVIEW_MS, H } from '../lib/rules.js';
import { fmtDate, tOnly, fmtWhen, d8 } from '../lib/time.js';
import { MOCK, BOOKER, SLOTS, WINDOWS } from '../data/mock.js';

export const DEFAULT_CLOCK = new Date('2026-11-13T09:00+05:30').getTime();
export const DEFAULT_SLOT_ID = 'i1-18-1600';

export const initialState = () => ({ journey: 'eligible', slots: SLOTS, windows: WINDOWS, overrides: {}, lastRead: 0, nudged: {}, cancelledAt: {}, lastWithdrawn: null, bookings: [], outcomes: [], notifications: [], clock: DEFAULT_CLOCK, lateCancelCount: 0 });
let S = initialState();
export const subs = new Set();
export const set = (p) => { S = { ...S, ...(typeof p === 'function' ? p(S) : p) }; subs.forEach((f) => f()); };
export const useStore = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => S);
export const activeBooking = (st) => st.bookings.find((b) => b.status === 'active');
export const ivName = (id) => MOCK.interviewers.find((i) => i.id === id).name;
export const note = (st, to, text) => [...st.notifications, { id: st.notifications.length + 1, to, text, at: st.clock }];
export const openSlots = (st) => st.slots.filter((x) => x.status === 'open' && new Date(x.start).getTime() - st.clock >= 12 * H);

export const RES_LABEL = { pass: 'Pass', fail: 'Fail', retake: 'Retake later', no_show: 'No-show' };
export const resState = (res, att) => res === 'pass' ? 'passed' : res === 'retake' ? 'retake_pending' : res === 'no_show' ? 'no_show' : att >= RULES.maxAttempts ? 'failed_final' : 'failed_cooldown';
export const COOL = (res, att) => res === 'retake' ? 7 * MS.day : res === 'no_show' ? 48 * H : (res === 'fail' && att < RULES.maxAttempts) ? 30 * MS.day : 0;
export const resultText = (res, att) => res === 'pass' ? 'Result: you passed. Your Full-Stack Track Badge is on your profile.'
  : res === 'retake' ? 'Result: the interviewer would like a retake. You can rebook after 7 days.'
  : res === 'no_show' ? 'You missed your interview. You can book again after 48 hours.'
  : att < RULES.maxAttempts ? 'Result: not cleared this time. You can make one more attempt after 30 days.' : 'Result: not cleared. This was your final attempt for this badge.';
export const slotStudent = (st, slot) => {
  const o = st.outcomes.find((x) => x.slotId === slot.id); if (o) return o.student;
  const ab = activeBooking(st); if (ab && ab.slotId === slot.id) return MOCK.student.name;
  return BOOKER[slot.id] || 'Booked student';
};
export const attemptOf = (st, name, slotId) => 1 + st.outcomes.filter((o) => o.student === name && o.slotId !== slotId && o.result !== 'no_show').length;
export const myOutcome = (st) => [...st.outcomes].reverse().find((o) => o.student === MOCK.student.name);
export const stateFor = (st, name, state) => name === MOCK.student.name ? { journey: state } : { overrides: { ...st.overrides, [name]: state } };

export const isNull = (st, name) => (name === MOCK.student.name ? st.journey : st.overrides[name]) === 'nullified';
export const NULL_REASON = 'After review, we confirmed a malpractice violation linked to this badge. The badge has been removed from your profile. This decision is final.';
export const notifCopy = (n) => {
  const u = n.at + COOL(n.result, n.attempt), first = MOCK.student.name.split(' ')[0];
  if (n.kind === 'booking') return { title: 'Your interview is booked', body: `${fmtWhen(n.start)}, with ${ivName(n.interviewerId)}` };
  if (n.kind === 'rebook') return { title: 'Your interviewer is unavailable. Please pick a new slot.' };
  if (n.kind === 'nudge') return { title: 'You\u2019re eligible for your interview. Book a slot soon.' };
  if (n.kind === 'nullified') return { title: 'Your Full-Stack Track Badge has been nullified', body: `${NULL_REASON} If you believe this is a mistake, contact [support email] within 7 days.` };
  if (n.result === 'pass') return { title: `You passed, ${first}!`, body: 'Your Full-Stack Track Badge is now on your profile.' };
  if (n.result === 'retake') return { title: 'Your interview needs a retake.', body: `You can rebook on ${d8(u)}.` };
  if (n.result === 'no_show') return { title: 'You missed your interview.', body: `You can book again after ${fmtDate(u)}, ${tOnly(u)} IST.` };
  if (n.attempt < RULES.maxAttempts) return { title: 'You didn\u2019t clear this interview.', body: `You have one more attempt, which opens on ${d8(u)}.` };
  return { title: 'You didn\u2019t clear this interview.', body: 'This was your final attempt, so no more bookings are available.' };
};

export const actions = {
  book(slotId) {
    const st = S, slot = st.slots.find((x) => x.id === slotId);
    if (!slot || slot.status !== 'open') return null;
    const old = activeBooking(st);
    const b = { id: 'b' + (st.bookings.length + 1), slotId, interviewerId: slot.interviewerId, start: slot.start, status: 'active' };
    set({
      slots: st.slots.map((x) => x.id === slotId ? { ...x, status: 'booked' } : (old && x.id === old.slotId) ? { ...x, status: 'open' } : x),
      bookings: [...st.bookings.map((x) => x === old ? { ...x, status: 'rescheduled' } : x), b],
      journey: 'booked',
      notifications: [...note(st, 'Interviewer', `${old ? 'Rescheduled' : 'New booking'}: ${MOCK.student.name}, ${fmtWhen(slot.start)} with ${ivName(slot.interviewerId)}`), { id: st.notifications.length + 2, to: MOCK.student.name, kind: 'booking', start: slot.start, interviewerId: slot.interviewerId, text: 'Your interview is booked', at: st.clock }],
    });
    return b;
  },
  takeSlot(slotId) { set((st) => ({ slots: st.slots.map((x) => x.id === slotId ? { ...x, status: 'booked' } : x) })); },
  cancel() {
    const st = S, old = activeBooking(st);
    if (!old) { set({ journey: 'eligible' }); return; }
    const late = new Date(old.start).getTime() - st.clock < 24 * H;
    set({
      slots: st.slots.map((x) => x.id === old.slotId ? { ...x, status: 'open' } : x),
      bookings: st.bookings.map((x) => x === old ? { ...x, status: late ? 'late_cancelled' : 'cancelled' } : x),
      journey: 'eligible',
      lateCancelCount: st.lateCancelCount + (late ? 1 : 0),
      notifications: note(st, 'Admin', `${late ? 'Late cancel' : 'Cancelled'}: ${MOCK.student.name}, ${fmtWhen(old.start)}`),
    });
  },
  setJourney(state) {
    const st = S, old = activeBooking(st);
    if (state === 'booked' && !old) {
      const slot = st.slots.find((x) => x.id === DEFAULT_SLOT_ID);
      if (slot && slot.status === 'open') { actions.book(DEFAULT_SLOT_ID); return; }
    }
    if (state !== 'booked' && old) {
      set({ slots: st.slots.map((x) => x.id === old.slotId ? { ...x, status: 'open' } : x), bookings: st.bookings.map((x) => x === old ? { ...x, status: 'voided' } : x), journey: state });
      return;
    }
    set({ journey: state });
  },
  setClock(ms) { set({ clock: ms }); },
  reset() { set(initialState()); },
  markRead() { set((st) => ({ lastRead: st.notifications.reduce((m, n) => Math.max(m, n.id), 0) })); },
  nudge(name) {
    set((st) => ({ nudged: { ...st.nudged, [name]: true }, notifications: [...st.notifications, { id: st.notifications.length + 1, to: name, kind: 'nudge', text: 'You\u2019re eligible for your interview. Book a slot before the slots fill up.', at: st.clock }] }));
  },
  nullify(name) {
    const st = S;
    set({ ...stateFor(st, name, 'nullified'), notifications: [...st.notifications, { id: st.notifications.length + 1, to: name, kind: 'nullified', text: 'Your Full-Stack Track Badge has been nullified', at: st.clock }] });
  },
  recordOutcome(slotId, result, feedback) {
    const st = S, slot = st.slots.find((x) => x.id === slotId);
    if (!slot || slot.status !== 'booked') return;
    const startMs = new Date(slot.start).getTime();
    if (result === 'no_show' ? st.clock < startMs + 10 * MS.minute : st.clock < startMs) return;
    const name = slotStudent(st, slot), att = attemptOf(st, name, slotId), ab = activeBooking(st);
    if (isNull(st, name)) return;
    const o = { id: 'o' + (st.outcomes.length + 1), slotId, student: name, result, feedback, attempt: att, at: st.clock, history: [] };
    const slotStatus = result === 'no_show' ? 'no_show' : 'completed';
    set({
      slots: st.slots.map((x) => x.id === slotId ? { ...x, status: slotStatus } : x),
      outcomes: [...st.outcomes, o],
      bookings: st.bookings.map((b) => (ab && b === ab && ab.slotId === slotId) ? { ...b, status: slotStatus } : b),
      ...stateFor(st, name, resState(result, att)),
      notifications: [...st.notifications, { id: st.notifications.length + 1, to: name, text: resultText(result, att), kind: 'result', result, attempt: att, at: st.clock }],
    });
  },
  editOutcome(id, result, feedback) {
    const st = S, o = st.outcomes.find((x) => x.id === id);
    if (!o || st.clock - o.at >= 24 * H || isNull(st, o.student)) return;
    const n = { ...o, result, feedback, history: [...o.history, { at: st.clock, from: { result: o.result, feedback: o.feedback }, to: { result, feedback } }] };
    set({
      outcomes: st.outcomes.map((x) => x.id === id ? n : x),
      ...stateFor(st, o.student, resState(result, o.attempt)),
      notifications: [...st.notifications, { id: st.notifications.length + 1, to: o.student, text: 'Updated. ' + resultText(result, o.attempt), kind: 'result', result, attempt: o.attempt, at: st.clock }],
    });
  },
  addWindow(ivId, date, start, end) {
    if (!date || !start || !end) return { error: 'Choose a date, start time and end time.' };
    const a = new Date(`${date}T${start}:00+05:30`).getTime(), b = new Date(`${date}T${end}:00+05:30`).getTime();
    if (!(b > a)) return { error: 'End time must be after start time.' };
    if (a < S.clock) return { error: 'This time is in the past. Pick a future time.' };
    const n = Math.floor((b - a) / INTERVIEW_MS);
    if (n < 1) return { error: 'The window must fit at least one 30-minute slot.' };
    if (S.windows.some((w) => w.interviewerId === ivId && w.status === 'active' && a < w.end && b > w.start)) return { error: 'This overlaps an existing window. Adjust the time or edit the existing one.' };
    const id = 'w' + (S.windows.length + 1) + '-' + ivId;
    const slots = Array.from({ length: n }, (_, k) => ({ id: `${id}-${k}`, windowId: id, interviewerId: ivId, start: new Date(a + k * INTERVIEW_MS).toISOString(), status: 'open' }));
    set({ windows: [...S.windows, { id, interviewerId: ivId, date, start: a, end: a + n * INTERVIEW_MS, status: 'active' }], slots: [...S.slots, ...slots] });
    return { count: n };
  },
  withdraw(ids) {
    const st = S; let bookings = st.bookings, notifications = st.notifications, journey = st.journey, lw = st.lastWithdrawn;
    const overrides = { ...st.overrides }, cancelledAt = { ...st.cancelledAt };
    st.slots.filter((x) => ids.includes(x.windowId) && x.status === 'booked').forEach((x) => {
      const ab = bookings.find((b) => b.status === 'active' && b.slotId === x.id);
      let who;
      if (ab) { bookings = bookings.map((b) => b === ab ? { ...b, status: 'withdrawn_by_interviewer' } : b); journey = 'needs_rebooking'; lw = x.start; who = MOCK.student.name; }
      else if (BOOKER[x.id]) { who = BOOKER[x.id]; overrides[who] = 'needs_rebooking'; cancelledAt[who] = x.start; }
      else return;
      notifications = [...notifications, { id: notifications.length + 1, to: who, text: `Your interview on ${fmtWhen(x.start)} was cancelled by the interviewer. Please pick a new slot (priority).`, kind: 'rebook', at: st.clock }];
    });
    set({
      windows: st.windows.map((w) => ids.includes(w.id) ? { ...w, status: 'withdrawn' } : w),
      slots: st.slots.map((x) => ids.includes(x.windowId) ? { ...x, status: 'withdrawn' } : x),
      bookings, notifications, overrides, journey, cancelledAt, lastWithdrawn: lw,
    });
  },
};

export const getState = () => S;

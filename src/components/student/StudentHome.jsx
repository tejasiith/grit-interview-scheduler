import { useState } from 'react';
import { MS, H } from '../../lib/rules.js';
import { fmtDate, tOnly, fmtWhen, d8 } from '../../lib/time.js';
import { MOCK } from '../../data/mock.js';
import { useStore, actions, activeBooking, ivName, resState, COOL, myOutcome } from '../../store/store.js';
import { STATES, TRACKER } from '../../data/studentStates.js';
import { Check, Lock, Dialog } from '../ui.jsx';
import { BookingScreen } from './BookingScreen.jsx';

export function Tracker({ current }) {
  return (
    <ol className="surface rounded-xl p-4 grid grid-cols-4 gap-2" aria-label="Journey">
      {TRACKER.map((label, i) => {
        const n = i + 1, done = n < current, active = n === current;
        return (
          <li key={label} className="flex flex-col items-center text-center gap-2" aria-current={active ? 'step' : undefined}>
            <span className="w-8 h-8 rounded-full grid place-items-center text-sm font-bold"
              style={{ background: done || active ? 'var(--accent)' : 'var(--soft)', color: done || active ? 'var(--accent-ink)' : 'var(--muted)', boxShadow: active ? '0 0 0 4px var(--soft), 0 0 0 6px var(--accent)' : 'none' }}>
              {done ? <Check /> : n}
            </span>
            <span className="text-xs sm:text-sm" style={{ fontWeight: active ? 700 : 500, color: active ? 'var(--ink)' : 'var(--muted)' }}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function StatusCard({ state, s, st, onBook, onReschedule, onCancel }) {
  const b = activeBooking(st), p = s.primary;
  let disabled = p && p.disabled, hint = p && p.hint, details = s.details, canResched = true, body = s.body;
  if (state === 'needs_rebooking' && st.lastWithdrawn) body = `We\u2019re sorry. Your interview on ${fmtDate(st.lastWithdrawn)}, ${tOnly(st.lastWithdrawn)} IST was cancelled by us. This doesn\u2019t count against you.`;
  if (p && p.until && st.clock >= new Date(p.until).getTime()) { disabled = false; hint = null; }
  const oc = myOutcome(st);
  if (oc && resState(oc.result, oc.attempt) === state) {
    const u = oc.at + COOL(oc.result, oc.attempt), fb = { k: 'Feedback', v: oc.feedback };
    if (state === 'no_show') details = [{ k: 'You can book again after', v: `${fmtDate(u)}, ${tOnly(u)} IST` }];
    else if (state === 'retake_pending') { details = [{ k: 'You can rebook on', v: d8(u) }, fb]; hint = `Opens ${d8(u)}`; }
    else if (state === 'failed_cooldown') { body = `You have one more attempt. It opens on ${d8(u)}.`; details = [fb]; hint = `Opens ${d8(u)}`; }
    else details = [fb];
    if (p && p.until) { disabled = st.clock < u; if (!disabled) hint = null; }
  }
  if (state === 'booked') {
    const startMs = new Date((b || { start: '2026-11-18T16:00+05:30' }).start).getTime();
    if (b) details = [{ k: 'When', v: fmtWhen(b.start) }, { k: 'Interviewer', v: ivName(b.interviewerId) }, { v: 'Join link opens 10 minutes before start' }];
    disabled = st.clock < startMs - 10 * MS.minute;
    hint = disabled ? 'Opens 10 minutes before start' : null;
    canResched = startMs - st.clock >= 24 * H;
  }
  const go = (e, fn) => { e.preventDefault(); fn(); };
  return (
    <section className={`surface tone-${s.tone} rounded-xl p-6 relative`} style={{ borderWidth: 2 }}>
      <span className="block mb-2 sm:mb-0 sm:absolute sm:top-3 sm:right-4 text-xs muted font-medium">State: {state}</span>
      <h2 className="text-xl font-bold sm:pr-32" style={{ maxWidth: '40ch' }}>{s.head}</h2>
      <p className="mt-2 leading-relaxed" style={{ maxWidth: '62ch' }}>{body}</p>
      {details && (
        <dl className="mt-4 grid gap-2 text-sm">
          {details.map((d, i) => (
            <div key={i} className="rounded-lg px-3 py-2" style={{ background: 'var(--soft)' }}>
              {d.k && <dt className="muted text-xs font-semibold">{d.k}</dt>}
              <dd className="font-medium">{d.v}</dd>
            </div>
          ))}
        </dl>
      )}
      {p && (
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
          <button className="btn" disabled={disabled} onClick={() => p.go && onBook()}>{p.label}</button>
          {hint && <span className="muted text-sm">{hint}</span>}
          {state === 'booked' && (<>
            {canResched ? <a href="#" className="link" onClick={(e) => go(e, onReschedule)}>Reschedule</a> : <span className="muted text-sm">Reschedule closed</span>}
            <a href="#" className="link" onClick={(e) => go(e, onCancel)}>Cancel</a>
          </>)}
        </div>
      )}
      {s.note && <p className="muted text-sm mt-2">{s.note}</p>}
    </section>
  );
}

export function BadgeCard({ kind }) {
  const L = {
    locked:  { label: 'Locked',  color: 'var(--t-grey)',  border: '2px solid var(--t-grey)', note: 'Pass the interview to earn it.' },
    pending: { label: 'Pending', color: 'var(--muted)',   border: '2px dashed var(--muted)', note: 'Awarded after you pass the interview.' },
    earned:  { label: 'Awarded', color: 'var(--t-green)', border: '2px solid var(--t-green)', note: 'On your profile.' },
    struck:  { label: 'Nullified', color: 'var(--t-red)', border: '2px solid var(--t-red)', note: 'Removed from your profile.' },
  }[kind];
  return (
    <section className="surface rounded-xl p-5 flex items-center gap-4">
      <div className="w-16 h-16 rounded-2xl grid place-items-center shrink-0" style={{ border: L.border, color: L.color }}>
        {kind === 'locked' ? <Lock /> : kind === 'earned' ? <Check /> : <span className="text-2xl font-bold">{kind === 'struck' ? '\u00d7' : '?'}</span>}
      </div>
      <div>
        <p className="font-bold" style={{ textDecoration: kind === 'struck' ? 'line-through' : 'none' }}>{MOCK.student.track}</p>
        <p className="text-sm font-semibold" style={{ color: L.color }}>{L.label}</p>
        <p className="text-sm muted">{L.note}</p>
      </div>
    </section>
  );
}

export function Skills({ cleared }) {
  return (
    <section className="surface rounded-xl p-5">
      <h3 className="font-semibold">Required skills</h3>
      <ul className="mt-3 grid gap-2">
        {MOCK.student.requiredSkills.map((sk) => {
          const ok = cleared.includes(sk);
          return (
            <li key={sk} className="flex items-center gap-3 text-sm">
              <span className="w-5 h-5 rounded-md grid place-items-center" style={{ background: ok ? 'var(--t-green)' : 'transparent', color: '#fff', border: ok ? 'none' : '2px solid var(--line)' }}>{ok && <Check />}</span>
              <span style={{ color: ok ? 'var(--ink)' : 'var(--muted)' }}>{sk}</span>
              <span className="sr-only">{ok ? 'cleared' : 'not cleared'}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function StudentHome({ screen, setScreen }) {
  const st = useStore();
  const [cancelOpen, setCancelOpen] = useState(false);
  const state = st.journey, s = STATES[state];
  const b = activeBooking(st);
  const late = b && new Date(b.start).getTime() - st.clock < 24 * H;
  const cleared = state === 'not_eligible' ? MOCK.student.requiredSkills.slice(0, 3) : MOCK.student.clearedSkills;
  if (screen !== 'home') return <div style={{ maxWidth: '44rem' }}><BookingScreen mode={screen} onBack={() => setScreen('home')} /></div>;
  return (
    <div className="grid gap-5" style={{ maxWidth: '44rem' }}>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Hi, {MOCK.student.name.split(' ')[0]}</h2>
        <p className="muted">{MOCK.student.track}</p>
      </div>
      <Tracker current={s.step} />
      <StatusCard key={state} state={state} s={s} st={st} onBook={() => setScreen('book')} onReschedule={() => setScreen('reschedule')} onCancel={() => setCancelOpen(true)} />
      <BadgeCard kind={s.badge} />
      <Skills cleared={cleared} />
      {cancelOpen && (
        <Dialog title="Cancel your interview?" buttons={<><button className="btn2" onClick={() => setCancelOpen(false)}>Keep booking</button><button className="btn" onClick={() => { actions.cancel(); setCancelOpen(false); }}>{late ? 'Cancel anyway' : 'Cancel interview'}</button></>}>
          {late
            ? <p role="alert" className="font-semibold rounded-lg px-3 py-2" style={{ border: '2px solid var(--t-amber)' }}>This counts as a late cancel. It starts in less than 24 hours.</p>
            : <p>Your slot will be freed and you can book another time.</p>}
        </Dialog>
      )}
    </div>
  );
}

import { useState } from 'react';
import { fmtDate, fmtRange, fmtWhen } from '../../lib/time.js';
import { MOCK } from '../../data/mock.js';
import { useStore, actions, activeBooking, ivName, openSlots } from '../../store/store.js';
import { Dialog } from '../ui.jsx';

export function BookingScreen({ mode, onBack }) {
  const st = useStore();
  const [pending, setPending] = useState(null);
  const [simulate, setSimulate] = useState(false);
  const [msg, setMsg] = useState(null);
  const [done, setDone] = useState(null);
  const active = activeBooking(st);
  const first = MOCK.student.name.split(' ')[0];
  const Back = ({ label }) => <button className="btn" onClick={onBack}>{label}</button>;

  if (done) return (
    <section className="surface tone-green rounded-xl p-6" style={{ borderWidth: 2 }}>
      <h2 className="text-xl font-bold">Your interview is booked</h2>
      <p className="mt-2">Hi {first}, your {MOCK.student.track} interview is confirmed.</p>
      <dl className="mt-4 grid gap-2 text-sm">
        <div className="rounded-lg px-3 py-2" style={{ background: 'var(--soft)' }}><dt className="muted text-xs font-semibold">When</dt><dd className="font-medium">{fmtWhen(done.start)}</dd></div>
        <div className="rounded-lg px-3 py-2" style={{ background: 'var(--soft)' }}><dt className="muted text-xs font-semibold">Interviewer</dt><dd className="font-medium">{ivName(done.interviewerId)}</dd></div>
        <div className="rounded-lg px-3 py-2" style={{ background: 'var(--soft)' }}><dt className="muted text-xs font-semibold">Join link</dt><dd className="font-medium">Opens 10 minutes before start</dd></div>
      </dl>
      <p className="mt-4 leading-relaxed" style={{ maxWidth: '62ch' }}>Please join on time. If you haven{'\u2019'}t joined within 10 minutes of the start, it counts as a no-show and you{'\u2019'}ll have to wait 48 hours before booking again. You can reschedule or cancel up to 24 hours before the start.</p>
      <div className="mt-5"><Back label="Back to home" /></div>
    </section>
  );

  if (active && mode !== 'reschedule') return (
    <section className="surface tone-blue rounded-xl p-6" style={{ borderWidth: 2 }}>
      <h2 className="text-xl font-bold">You already have an interview booked</h2>
      <p className="mt-2">{fmtWhen(active.start)} with {ivName(active.interviewerId)}.</p>
      <p className="muted text-sm mt-2">Reschedule or cancel from your home screen.</p>
      <div className="mt-5"><Back label="Back to home" /></div>
    </section>
  );

  const groups = {};
  openSlots(st).forEach((x) => { (groups[fmtDate(x.start)] = groups[fmtDate(x.start)] || []).push(x); });
  const confirm = () => {
    const slot = pending; setPending(null);
    if (simulate) { actions.takeSlot(slot.id); setMsg('That slot was just taken. Please pick another.'); return; }
    const b = actions.book(slot.id);
    if (!b) { setMsg('That slot was just taken. Please pick another.'); return; }
    setMsg(null); setDone(b);
  };
  return (
    <section className="surface rounded-xl p-6">
      <h2 className="text-xl font-bold">Pick your interview slot</h2>
      <p className="muted text-sm mt-1">All times in IST</p>
      {mode === 'reschedule' && <p className="text-sm mt-2">Confirming a new slot frees your current one.</p>}
      <label className="mt-4 flex items-center gap-2 text-sm rounded-lg px-3 py-2" style={{ background: 'var(--soft)' }}>
        <input type="checkbox" checked={simulate} onChange={(e) => setSimulate(e.target.checked)} />
        <span>Simulate: someone else takes this slot</span>
      </label>
      {msg && <p role="alert" className="mt-4 rounded-lg px-3 py-2 text-sm font-semibold tone-amber" style={{ border: '2px solid var(--t-amber)' }}>{msg}</p>}
      {Object.keys(groups).length === 0 && <p className="muted mt-5 text-sm">No open slots. Slots starting within 12 hours are hidden.</p>}
      {Object.entries(groups).map(([date, list]) => (
        <div key={date} className="mt-6">
          <h3 className="font-semibold">{date}</h3>
          {list.map((x) => (
            <div key={x.id} className="row">
              <div><p className="font-medium">{fmtRange(x.start)}</p><p className="muted text-sm">{ivName(x.interviewerId)}</p></div>
              <button className="btn" onClick={() => setPending(x)}>Book</button>
            </div>
          ))}
        </div>
      ))}
      <div className="mt-6"><button className="btn2" onClick={onBack}>Back</button></div>
      {pending && (
        <Dialog title="Confirm your slot" buttons={<><button className="btn2" onClick={() => setPending(null)}>Back</button><button className="btn" onClick={confirm}>Confirm</button></>}>
          <p><span className="muted">Date: </span><b>{fmtDate(pending.start)}</b></p>
          <p><span className="muted">Time: </span><b>{fmtRange(pending.start)}</b></p>
          <p><span className="muted">Interviewer: </span><b>{ivName(pending.interviewerId)}</b></p>
          <p className="muted">Reschedule or cancel up to 24 hours before. No-show = 48 hour wait.</p>
        </Dialog>
      )}
    </section>
  );
}

import { useState } from 'react';
import { MS, INTERVIEW_MS, H } from '../../lib/rules.js';
import { fmtTime, fmtWhen, d8 } from '../../lib/time.js';
import { MOCK, BOOKER } from '../../data/mock.js';
import { useStore, actions, activeBooking, ivName, slotStudent } from '../../store/store.js';
import { Dialog } from '../ui.jsx';

export function AdminView() {
  const st = useStore();
  const [filter, setFilter] = useState('all'), [confirm, setConfirm] = useState(null);
  const me = MOCK.student.name, ab = activeBooking(st);
  const eff = (name, base) => name === me ? st.journey : (st.overrides[name] || base);
  const sinceMs = (d) => new Date(d + 'T00:00+05:30').getTime();
  const people = MOCK.adminJourneys.map((j) => ({ name: j.student, state: eff(j.student, j.state), since: j.eligibleSince, slot: j.student === me ? (ab && ab.start) : j.slot }));
  const rows = people.filter((p) => p.state === 'eligible' || p.state === 'booked').map((p) => ({ ...p, booked: p.state === 'booked' }))
    .sort((a, b) => (a.booked - b.booked) || (a.booked ? new Date(a.slot || 0) - new Date(b.slot || 0) : sinceMs(a.since) - sinceMs(b.since)));
  const shown = rows.filter((r) => filter === 'all' || (filter === 'booked' ? r.booked : !r.booked));
  const pending = st.slots.filter((x) => x.status === 'booked' && new Date(x.start).getTime() + INTERVIEW_MS + 24 * H < st.clock).sort((a, b) => new Date(a.start) - new Date(b.start));
  const names = [...new Set([me, ...MOCK.adminJourneys.map((j) => j.student), ...Object.values(BOOKER)])];
  const base = (n) => (MOCK.adminJourneys.find((j) => j.student === n) || {}).state;
  const rebook = names.filter((n) => eff(n, base(n)) === 'needs_rebooking');
  const passed = names.filter((n) => eff(n, base(n)) === 'passed');
  const nb = rows.filter((r) => !r.booked).length;
  const tiles = [['Eligible not booked', nb], ['Booked', rows.length - nb], ['Pending outcome', pending.length], ['Needs rebooking', rebook.length]];
  const th = 'text-left text-xs muted font-semibold py-2 pr-4';
  return (
    <div className="grid gap-5" style={{ maxWidth: '56rem' }}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiles.map(([k, v]) => <div key={k} className="surface rounded-xl p-4"><p className="text-3xl font-bold">{v}</p><p className="muted text-sm">{k}</p></div>)}
      </div>
      <section className="surface rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Eligible students</h2>
          <div className="seg surface rounded-lg overflow-hidden flex" role="group" aria-label="Filter">
            {[['all', 'All'], ['booked', 'Booked'], ['not', 'Not booked']].map(([k, l]) => <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>)}
          </div>
        </div>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm" style={{ minWidth: '38rem' }}>
            <thead><tr><th className={th}>Student</th><th className={th}>State</th><th className={th}>Eligible since</th><th className={th}>Days waiting</th><th className={th}>Slot</th><th className={th}>Action</th></tr></thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan="6" className="muted py-4">No students match this filter.</td></tr>}
              {shown.map((r) => (
                <tr key={r.name} style={{ borderTop: '1px solid var(--line)' }}>
                  <td className="py-3 pr-4 font-medium">{r.name}</td>
                  <td className="pr-4">{r.booked ? 'Booked' : 'Eligible'}</td>
                  <td className="pr-4">{r.since ? d8(sinceMs(r.since)) : '\u2014'}</td>
                  <td className="pr-4">{!r.booked && r.since ? Math.max(0, Math.floor((st.clock - sinceMs(r.since)) / MS.day)) : '\u2014'}</td>
                  <td className="pr-4">{r.booked && r.slot ? fmtWhen(r.slot) : '\u2014'}</td>
                  <td>{r.booked ? '\u2014' : st.nudged[r.name] ? <span className="font-semibold" style={{ color: 'var(--t-green)' }}>Nudge sent</span> : <button className="chip" onClick={() => actions.nudge(r.name)}>Nudge</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="surface rounded-xl p-6">
        <h2 className="text-lg font-bold">Pending outcome</h2>
        <p className="muted text-sm">Interviews that ended over 24 hours ago with no outcome recorded.</p>
        {pending.length === 0 && <p className="muted text-sm mt-3">None.</p>}
        {pending.map((x) => <div key={x.id} className="row"><span className="font-medium">{slotStudent(st, x)}</span><span className="text-sm text-right">{fmtWhen(x.start)}, {ivName(x.interviewerId)}</span></div>)}
      </section>
      <section className="surface rounded-xl p-6">
        <h2 className="text-lg font-bold">Needs rebooking</h2>
        {rebook.length === 0 && <p className="muted text-sm mt-3">None.</p>}
        {rebook.map((n) => { const t = n === me ? st.lastWithdrawn : st.cancelledAt[n]; return (
          <div key={n} className="row"><span className="font-medium">{n} <span className="text-xs font-bold rounded-full px-2 py-0.5 ml-1" style={{ border: '2px solid var(--t-amber)', color: 'var(--t-amber)' }}>Priority</span></span>
            <span className="text-sm muted text-right">{t ? `Cancelled: ${fmtWhen(t)}` : 'Interviewer cancelled'}</span></div>); })}
      </section>
      <section className="surface rounded-xl p-6">
        <h2 className="text-lg font-bold">Passed students</h2>
        {passed.length === 0 && <p className="muted text-sm mt-3">None yet. Record a Pass or set the student Demo state to passed.</p>}
        {passed.map((n) => <div key={n} className="row"><span className="font-medium">{n}</span><button className="btn2" onClick={() => setConfirm(n)}>Simulate malpractice confirmed</button></div>)}
      </section>
      <section className="surface rounded-xl p-6">
        <h2 className="text-lg font-bold">Recent notifications</h2>
        {st.notifications.length === 0 && <p className="muted text-sm mt-3">None yet.</p>}
        {[...st.notifications].reverse().slice(0, 8).map((n) => <div key={n.id} className="row text-sm"><span>To {n.to}: {n.text}</span><span className="muted shrink-0">{fmtTime(n.at)}</span></div>)}
      </section>
      {confirm && (
        <Dialog title={`Nullify ${confirm}\u2019s badge?`} buttons={<><button className="btn2" onClick={() => setConfirm(null)}>Cancel</button><button className="btn" onClick={() => { actions.nullify(confirm); setConfirm(null); }}>Confirm</button></>}>
          <p role="alert" className="font-semibold rounded-lg px-3 py-2" style={{ border: '2px solid var(--t-red)' }}>This cannot be undone for this badge.</p>
        </Dialog>
      )}
    </div>
  );
}

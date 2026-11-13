import { useState } from 'react';
import { RULES } from '../../lib/rules.js';
import { fmtDate, tOnly } from '../../lib/time.js';
import { useStore, actions } from '../../store/store.js';
import { Dialog } from '../ui.jsx';

export function Availability({ iv }) {
  const st = useStore();
  const [date, setDate] = useState(''), [start, setStart] = useState('10:00'), [end, setEnd] = useState('12:00');
  const [err, setErr] = useState(null), [ok, setOk] = useState(null), [confirm, setConfirm] = useState(null);
  const dateKey = (ms) => new Date(ms + 19800000).toISOString().slice(0, 10);
  const wins = st.windows.filter((w) => w.interviewerId === iv).sort((a, b) => a.start - b.start);
  const slotsOf = (w) => st.slots.filter((x) => x.windowId === w.id);
  const mine = st.slots.filter((x) => x.interviewerId === iv);
  const bookedIn = (ids) => st.slots.filter((x) => ids.includes(x.windowId) && x.status === 'booked').length;
  const ask = (ids) => { setOk(null); const n = bookedIn(ids); if (n === 0) actions.withdraw(ids); else setConfirm({ ids, n }); };
  const today = dateKey(st.clock);
  const todayIds = wins.filter((w) => w.status === 'active' && w.date === today && w.end > st.clock).map((w) => w.id);
  const save = () => { const r = actions.addWindow(iv, date, start, end); if (r.error) { setErr(r.error); setOk(null); } else { setErr(null); setOk(`Added ${r.count} slot${r.count === 1 ? '' : 's'}.`); } };
  const inp = 'rounded-lg px-2.5 py-1.5 text-sm';
  const field = { background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line)' };
  return (
    <div className="grid gap-5">
      <section className="surface rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Availability windows</h2>
          <button className="btn2" onClick={() => todayIds.length ? ask(todayIds) : setOk('No open windows today.')}>I{'\u2019'}m unavailable today</button>
        </div>
        <p className="muted text-sm mt-1">All times in IST. Open slots: {mine.filter((x) => x.status === 'open').length}, Booked: {mine.filter((x) => x.status === 'booked').length}</p>
        {wins.length === 0 && <p className="muted text-sm mt-4">No windows yet.</p>}
        {wins.map((w) => {
          const sl = slotsOf(w), booked = sl.filter((x) => x.status === 'booked').length;
          const past = w.end <= st.clock;
          const status = w.status === 'withdrawn' ? 'Withdrawn' : past ? 'Past' : booked === sl.length ? 'Fully booked' : 'Open';
          return (
            <div key={w.id} className="row">
              <div>
                <p className="font-medium">{fmtDate(w.start)}</p>
                <p className="text-sm">{tOnly(w.start)} to {tOnly(w.end)} {RULES.tzLabel}</p>
                <p className="muted text-sm">{sl.length} slots, {booked} booked. <b style={{ color: 'var(--ink)' }}>{status}</b></p>
              </div>
              {status !== 'Withdrawn' && status !== 'Past' && <button className="btn2" onClick={() => ask([w.id])}>Withdraw</button>}
            </div>
          );
        })}
      </section>
      <section className="surface rounded-xl p-6">
        <h3 className="font-semibold">Add availability</h3>
        <div className="mt-3 flex flex-wrap items-end gap-3 text-sm">
          <label className="grid gap-1"><span className="muted font-medium">Date</span><input type="date" className={inp} style={field} value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label className="grid gap-1"><span className="muted font-medium">Start (IST)</span><input type="time" className={inp} style={field} value={start} onChange={(e) => setStart(e.target.value)} /></label>
          <label className="grid gap-1"><span className="muted font-medium">End (IST)</span><input type="time" className={inp} style={field} value={end} onChange={(e) => setEnd(e.target.value)} /></label>
          <button className="btn" onClick={save}>Save</button>
        </div>
        {err && <p role="alert" className="mt-3 text-sm font-semibold rounded-lg px-3 py-2" style={{ border: '2px solid var(--t-red)' }}>{err}</p>}
      </section>
      {ok && <p role="status" className="text-sm font-medium px-1">{ok}</p>}
      {confirm && (
        <Dialog title="Withdraw availability?" buttons={<><button className="btn2" onClick={() => setConfirm(null)}>Keep it</button><button className="btn" onClick={() => { actions.withdraw(confirm.ids); setConfirm(null); }}>Withdraw</button></>}>
          <p role="alert" className="font-semibold rounded-lg px-3 py-2" style={{ border: '2px solid var(--t-amber)' }}>{confirm.n} student{confirm.n === 1 ? ' has' : 's have'} booked this time. {confirm.n === 1 ? 'They' : 'They'} will be asked to pick a new slot and will get priority.</p>
        </Dialog>
      )}
    </div>
  );
}

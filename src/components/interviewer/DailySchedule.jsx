import { useState } from 'react';
import { RULES, MS, H } from '../../lib/rules.js';
import { fmtDate, fmtTime, tOnly, fmtRange } from '../../lib/time.js';
import { MOCK } from '../../data/mock.js';
import { useStore, actions, RES_LABEL, COOL, slotStudent, attemptOf } from '../../store/store.js';

export const previewFor = (res, att) => res === 'pass' ? 'Student gets the Full-Stack Track Badge.' : res === 'retake' ? 'Student can rebook after 7 days.' : res === 'fail' ? (att < RULES.maxAttempts ? 'Student can make one more attempt after 30 days.' : 'Final fail. No more attempts for this badge.') : '';

export function OutcomeForm({ slot, att, existing, canRecord, onClose }) {
  const [res, setRes] = useState(existing ? existing.result : null);
  const [fb, setFb] = useState(existing ? existing.feedback : '');
  const ok = res && fb.trim() && canRecord;
  const save = () => { existing ? actions.editOutcome(existing.id, res, fb.trim()) : actions.recordOutcome(slot.id, res, fb.trim()); onClose && onClose(); };
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Outcome">
        {['pass', 'fail', 'retake'].map((r) => (
          <button key={r} className="chip" aria-pressed={res === r} disabled={!canRecord} onClick={() => setRes(r)}
            style={res === r ? { background: 'var(--accent)', color: 'var(--accent-ink)', borderColor: 'var(--accent)' } : null}>{RES_LABEL[r]}</button>
        ))}
      </div>
      <label className="grid gap-1 text-sm"><span className="muted font-medium">Feedback (required)</span>
        <textarea rows="3" value={fb} disabled={!canRecord} onChange={(e) => setFb(e.target.value)} /></label>
      {res && <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'var(--soft)' }}><b>If you save: </b>{previewFor(res, att)}</p>}
      {!canRecord && <p className="muted text-sm">Outcomes can be recorded once the interview has started.</p>}
      <div className="flex gap-3"><button className="btn" disabled={!ok} onClick={save}>{existing ? 'Save changes' : 'Save outcome'}</button>
        {existing && <button className="btn2" onClick={onClose}>Cancel</button>}</div>
    </div>
  );
}

export function SlotPanel({ slot, st }) {
  const [editing, setEditing] = useState(false);
  const name = slotStudent(st, slot), att = attemptOf(st, name, slot.id);
  const past = st.outcomes.filter((o) => o.student === name && o.slotId !== slot.id);
  const o = st.outcomes.find((x) => x.slotId === slot.id);
  const startMs = new Date(slot.start).getTime();
  const started = st.clock >= startMs, noShowOk = st.clock >= startMs + 10 * MS.minute;
  const canEdit = o && st.clock - o.at < 24 * H;
  const row = (k, v) => <div className="flex justify-between gap-4"><dt className="muted">{k}</dt><dd className="font-medium text-right">{v}</dd></div>;
  return (
    <section className="surface rounded-xl p-6 grid gap-4">
      <div>
        <h3 className="font-semibold text-lg">{name}</h3>
        <dl className="mt-3 grid gap-2 text-sm">
          {row('Track', MOCK.student.track)}
          {row('Skills cleared', `${MOCK.student.clearedSkills.length} of ${MOCK.student.requiredSkills.length}`)}
          {row('Attempt', `${att} of ${RULES.maxAttempts}`)}
        </dl>
        <p className="muted text-xs font-semibold mt-3">Past feedback</p>
        {past.length === 0 ? <p className="text-sm">None yet.</p> : past.map((p) => <p key={p.id} className="text-sm">Attempt {p.attempt}, {RES_LABEL[p.result]}: {p.feedback}</p>)}
      </div>
      {slot.status === 'booked' && (<>
        <div><h4 className="font-semibold">Record outcome</h4><div className="mt-2"><OutcomeForm slot={slot} att={att} canRecord={started} /></div></div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn2" disabled={!noShowOk} style={{ opacity: noShowOk ? 1 : .5 }} onClick={() => actions.recordOutcome(slot.id, 'no_show', 'Did not join within 10 minutes of the start time.')}>Mark no-show</button>
          {!noShowOk && <span className="muted text-sm">Available 10 minutes after the start time.</span>}
        </div>
      </>)}
      {slot.status === 'completed' && o && (<div className="grid gap-3">
        <p className="text-sm"><b>Outcome: {RES_LABEL[o.result]}.</b> {o.feedback}</p>
        {editing ? <OutcomeForm slot={slot} att={o.attempt} existing={o} canRecord onClose={() => setEditing(false)} />
          : canEdit ? <div><button className="btn2" onClick={() => setEditing(true)}>Edit outcome (available for 24 hours)</button></div>
          : <p className="muted text-sm">The 24-hour edit window has closed.</p>}
        <div><h4 className="font-semibold text-sm">Change history</h4>
          {o.history.length === 0 ? <p className="muted text-sm">No changes yet.</p> : o.history.map((h, i) => (
            <p key={i} className="text-sm">{fmtDate(h.at)}, {fmtTime(h.at)}: {RES_LABEL[h.from.result]} to {RES_LABEL[h.to.result]}. Feedback: {h.to.feedback}</p>))}
        </div>
      </div>)}
      {slot.status === 'no_show' && o && <p className="text-sm"><b>Marked as no-show.</b> The student can book again after {fmtDate(o.at + COOL('no_show'))}, {tOnly(o.at + COOL('no_show'))} IST.</p>}
    </section>
  );
}

export const BADGE = { open: ['Open', 'var(--t-grey)'], booked: ['Booked', 'var(--t-blue)'], completed: ['Completed', 'var(--t-green)'], no_show: ['No-show', 'var(--t-amber)'] };

export function DailySchedule({ iv }) {
  const st = useStore();
  const [picked, setPicked] = useState(''), [selId, setSelId] = useState(null);
  const dKey = (ms) => new Date(ms + 19800000).toISOString().slice(0, 10);
  const date = picked || dKey(st.clock);
  const slots = st.slots.filter((x) => x.interviewerId === iv && x.status !== 'withdrawn' && dKey(new Date(x.start).getTime()) === date)
    .sort((a, b) => new Date(a.start) - new Date(b.start));
  const sel = slots.find((x) => x.id === selId && x.status !== 'open') || slots.find((x) => x.status === 'booked') || slots.find((x) => x.status !== 'open');
  return (
    <div className="grid gap-5">
      <section className="surface rounded-xl p-6">
        <div className="flex flex-wrap items-end gap-3 text-sm">
          <label className="grid gap-1"><span className="muted font-medium">Date</span>
            <input type="date" className="rounded-lg px-2.5 py-1.5 text-sm" style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line)' }} value={date} onChange={(e) => setPicked(e.target.value)} /></label>
          {picked && <button className="chip" onClick={() => setPicked('')}>Use demo clock date</button>}
          <span className="muted">All times in IST</span>
        </div>
        {slots.length === 0 && <p className="muted text-sm mt-4">No slots on this date.</p>}
        {slots.map((x) => {
          const isOpen = x.status === 'open', [label, color] = BADGE[x.status] || BADGE.open;
          return (
            <button key={x.id} className="row w-full text-left" disabled={isOpen} onClick={() => setSelId(x.id)} aria-current={sel && sel.id === x.id}
              style={{ background: sel && sel.id === x.id ? 'var(--soft)' : 'transparent', paddingLeft: '.5rem', paddingRight: '.5rem', cursor: isOpen ? 'default' : 'pointer' }}>
              <span><span className="block font-medium">{fmtRange(x.start)}</span><span className="block text-sm muted">{isOpen ? 'Open' : slotStudent(st, x)}</span></span>
              <span className="text-xs font-bold rounded-full px-2.5 py-1" style={{ border: `2px solid ${color}`, color }}>{label}</span>
            </button>
          );
        })}
      </section>
      {sel && <SlotPanel key={sel.id} slot={sel} st={st} />}
    </div>
  );
}

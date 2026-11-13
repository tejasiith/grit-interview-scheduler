import { useState } from 'react';
import { fmtDate, fmtTime } from '../lib/time.js';
import { MOCK } from '../data/mock.js';
import { useStore, actions, notifCopy } from '../store/store.js';

export function Bell() {
  const st = useStore();
  const [open, setOpen] = useState(false), [since, setSince] = useState(0);
  const mine = st.notifications.filter((n) => n.to === MOCK.student.name && n.kind).slice().reverse();
  const unread = mine.filter((n) => n.id > st.lastRead).length;
  const toggle = () => { if (!open) { setSince(st.lastRead); actions.markRead(); } setOpen(!open); };
  return (<>
    <button className="chip relative" onClick={toggle} aria-label={`Notifications, ${unread} unread`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9a6 6 0 0112 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z"/><path d="M10 20a2 2 0 004 0"/></svg>
      {unread > 0 && <span className="absolute -top-1.5 -right-1.5 text-xs font-bold rounded-full px-1.5" style={{ background: 'var(--t-red)', color: '#fff' }}>{unread}</span>}
    </button>
    {open && (
      <div className="overlay" style={{ alignItems: 'start' }} onClick={() => setOpen(false)}>
        <div className="surface rounded-xl p-5 w-full overflow-auto" style={{ maxWidth: '28rem', maxHeight: '80vh', marginTop: '4rem' }} role="dialog" aria-label="Notifications" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between"><h3 className="font-bold text-lg">Notifications</h3><button className="chip" onClick={() => setOpen(false)}>Close</button></div>
          {mine.length === 0 && <p className="muted text-sm mt-3">Nothing yet.</p>}
          {mine.map((n) => { const c = notifCopy(n); return (
            <div key={n.id} className="row items-start" style={{ alignItems: 'flex-start' }}>
              <div><p className="font-semibold text-sm">{c.title}</p>{c.body && <p className="text-sm mt-0.5">{c.body}</p>}<p className="muted text-xs mt-1">{fmtDate(n.at)}, {fmtTime(n.at)}</p></div>
              {n.id > since && <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-1" style={{ background: 'var(--accent)' }} aria-label="Unread" />}
            </div>); })}
        </div>
      </div>
    )}
  </>);
}

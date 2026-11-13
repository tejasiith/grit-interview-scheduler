import { useState } from 'react';
import { MS, INTERVIEW_MS, ROLES, JOURNEY_STATES } from './lib/rules.js';
import { fmtDate, fmtTime } from './lib/time.js';
import { useStore, actions, getState, activeBooking, DEFAULT_CLOCK } from './store/store.js';
import { StudentHome } from './components/student/StudentHome.jsx';
import { InterviewerView } from './components/interviewer/InterviewerView.jsx';
import { Bell } from './components/Bell.jsx';
import { AdminView } from './components/admin/AdminView.jsx';
import { PhaseBanner } from './components/PhaseBanner.jsx';

export default function App() {
  const st = useStore();
  const [role, setRole] = useState('Student');
  const [screen, setScreen] = useState('home');
  const [rk, setRk] = useState(0);
  const on = (a) => st.journey === a ? { background: 'var(--accent)', color: 'var(--accent-ink)', borderColor: 'var(--accent)' } : null;
  const jump = (v) => { actions.setJourney(v); setScreen('home'); };
  const bump = (ms) => actions.setClock(getState().clock + ms);
  const toIv = (off) => {
    const ab = activeBooking(getState());
    const t = ab ? new Date(ab.start).getTime() : getState().slots.filter((x) => x.status === 'booked').map((x) => new Date(x.start).getTime()).sort((a, b) => a - b)[0];
    if (t != null) actions.setClock(t + off);
  };
  return (
    <div className="min-h-screen flex flex-col">
      <header className="surface border-x-0 border-t-0 md:sticky z-10" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-3">
          <h1 className="text-lg font-bold tracking-tight mr-auto">GRIT Interview Scheduler</h1>
          <div className="seg surface rounded-lg overflow-hidden flex" role="group" aria-label="Role">
            {ROLES.map((r) => (<button key={r} aria-pressed={role === r} onClick={() => { setRole(r); setScreen('home'); }}>{r}</button>))}
          </div>
          {role === 'Student' && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <label className="flex items-center gap-2">
                <span className="muted font-medium">Demo state</span>
                <select className="rounded-lg px-2.5 py-1.5 text-sm" value={st.journey} onChange={(e) => jump(e.target.value)}>
                  {JOURNEY_STATES.map((x) => (<option key={x} value={x}>{x}</option>))}
                </select>
              </label>
              <button className="chip" style={on('booked')} onClick={() => jump('booked')}>Before result</button>
              <button className="chip" style={on('passed')} onClick={() => jump('passed')}>After result</button>
              <Bell />
            </div>
          )}
          <div className="w-full flex flex-wrap items-center gap-2 text-sm">
            <span className="muted font-medium">Demo clock</span>
            <span className="font-semibold">{fmtDate(st.clock)}, {fmtTime(st.clock)}</span>
            <button className="chip" onClick={() => bump(MS.day)}>+1 day</button>
            <button className="chip" onClick={() => bump(7 * MS.day)}>+7 days</button>
            <button className="chip" onClick={() => bump(30 * MS.day)}>+30 days</button>
            <button className="chip" onClick={() => actions.setClock(DEFAULT_CLOCK)}>Reset</button>
            <span className="muted font-medium ml-2">Jump to</span>
            <button className="chip" onClick={() => toIv(-60 * MS.minute)}>Before interview</button>
            <button className="chip" onClick={() => toIv(5 * MS.minute)}>5 min after start</button>
            <button className="chip" onClick={() => toIv(15 * MS.minute)}>15 min after start</button>
            <button className="chip" onClick={() => toIv(INTERVIEW_MS + MS.minute)}>After interview ends</button>
            <button className="chip ml-auto" onClick={() => { actions.reset(); setRk(rk + 1); setScreen('home'); }}>Reset demo</button>
          </div>
        </div>
      </header>
      <p className="max-w-5xl w-full mx-auto px-4 pt-3 text-xs sm:text-sm muted">{'Flow: Student books > Interviewer records outcome > Student sees result > Admin simulates malpractice'}</p>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 md:py-8">
        <div key={rk} className="mx-auto w-full" style={{ maxWidth: role === 'Admin' ? '56rem' : '44rem' }}>
          {role !== 'Student' && <PhaseBanner journey={st.journey} />}
          {role === 'Student' ? <StudentHome screen={screen} setScreen={setScreen} /> : role === 'Interviewer' ? <InterviewerView /> : <AdminView />}
        </div>
      </main>
    </div>
  );
}

import { useState } from 'react';
import { MOCK } from '../../data/mock.js';
import { Availability } from './Availability.jsx';
import { DailySchedule } from './DailySchedule.jsx';

export function InterviewerView() {
  const [iv, setIv] = useState(MOCK.interviewers[0].id);
  const [tab, setTab] = useState('availability');
  return (
    <div className="grid gap-5" style={{ maxWidth: '44rem' }}>
      <label className="flex items-center gap-2 text-sm">
        <span className="muted font-medium">Interviewer</span>
        <select className="rounded-lg px-2.5 py-1.5 text-sm" value={iv} onChange={(e) => setIv(e.target.value)}>
          {MOCK.interviewers.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </label>
      <div className="seg surface rounded-lg overflow-hidden flex w-fit" role="tablist">
        <button role="tab" aria-pressed={tab === 'availability'} onClick={() => setTab('availability')}>Availability</button>
        <button role="tab" aria-pressed={tab === 'daily'} onClick={() => setTab('daily')}>Daily schedule</button>
      </div>
      {tab === 'availability' ? <Availability key={iv} iv={iv} /> : <DailySchedule key={iv} iv={iv} />}
    </div>
  );
}

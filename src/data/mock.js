export const CONFIG = { retakeDays: 7, noShowHours: 48, failDays: 30, maxAttempts: 2 };
export const STUDENT = {
  id: "s1", name: "Aarav Sharma", college: "NIAT Hyderabad",
  track: "Full-Stack Track Badge",
  requiredSkills: ["HTML/CSS", "JavaScript", "React", "Node.js", "SQL"],
  clearedSkills:  ["HTML/CSS", "JavaScript", "React", "Node.js", "SQL"],
};
export const INTERVIEWERS = [
  { id: "i1", name: "Meera Nair" },
  { id: "i2", name: "Rohan Gupta" },
];
export const pad = (n) => String(n).padStart(2, '0');
export const PRE_BOOKED = new Set(['i1-18-1630', 'i2-19-1100', 'i1-19-1400', 'i2-20-1030']);
export const SLOTS = [];
[18, 19, 20].forEach((d) => INTERVIEWERS.forEach((iv) => {
  for (let m = 600; m <= 990; m += 30) {
    const hh = Math.floor(m / 60), mm = m % 60, key = `${iv.id}-${d}-${pad(hh)}${pad(mm)}`;
    SLOTS.push({ id: key, windowId: `w-${iv.id}-${d}`, interviewerId: iv.id, start: `2026-11-${d}T${pad(hh)}:${pad(mm)}+05:30`, status: PRE_BOOKED.has(key) ? 'booked' : 'open' });
  }
}));
export const WINDOWS = [];
[18, 19, 20].forEach((d) => INTERVIEWERS.forEach((iv) => WINDOWS.push({
  id: `w-${iv.id}-${d}`, interviewerId: iv.id, date: `2026-11-${d}`,
  start: new Date(`2026-11-${d}T10:00+05:30`).getTime(), end: new Date(`2026-11-${d}T17:00+05:30`).getTime(), status: 'active',
})));
export const BOOKER = { 'i1-18-1630': 'Priya Reddy', 'i2-19-1100': 'Vikram Rao', 'i1-19-1400': 'Ishaan Verma', 'i2-20-1030': 'Diya Kapoor' };
export const ADMIN_JOURNEYS = [
  { student: "Aarav Sharma",  state: "eligible",  eligibleSince: "2026-11-05" },
  { student: "Priya Reddy",   state: "booked",    slot: "2026-11-18T16:30+05:30" },
  { student: "Karan Mehta",   state: "eligible",  eligibleSince: "2026-11-10" },
  { student: "Sneha Iyer",    state: "retake_pending", nextEligible: "2026-11-25" },
  { student: "Vikram Rao",    state: "booked",    slot: "2026-11-19T11:00+05:30" },
];
export const MOCK = { config: CONFIG, student: STUDENT, interviewers: INTERVIEWERS, slots: SLOTS, adminJourneys: ADMIN_JOURNEYS };

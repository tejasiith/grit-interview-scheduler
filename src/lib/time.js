import { RULES, INTERVIEW_MS } from './rules.js';

export const dateFmt = new Intl.DateTimeFormat('en-IN', { timeZone: RULES.tz, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
export const timeFmt = new Intl.DateTimeFormat('en-IN', { timeZone: RULES.tz, hour: 'numeric', minute: '2-digit', hour12: true });
export const fmtDate = (d) => dateFmt.format(new Date(d));
export const fmtTime = (d) => `${timeFmt.format(new Date(d)).toUpperCase()} ${RULES.tzLabel}`;

export const tOnly = (d) => timeFmt.format(new Date(d)).toUpperCase().replace(/\s/g, ' ');
export const fmtRange = (st) => `${tOnly(st)} to ${tOnly(new Date(st).getTime() + INTERVIEW_MS)} ${RULES.tzLabel}`;
export const fmtWhen = (st) => `${fmtDate(st)}, ${fmtRange(st)}`;
export const d8 = (ms) => new Intl.DateTimeFormat('en-GB', { timeZone: RULES.tz, day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ms));

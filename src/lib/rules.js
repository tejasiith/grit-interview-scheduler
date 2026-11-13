export const RULES = {
  tz: 'Asia/Kolkata', tzLabel: 'IST', interviewMinutes: 30,
  retakeCooldownDays: 7, noShowCooldownHours: 48, failCooldownDays: 30, maxAttempts: 2,
};
export const MS = { minute: 60000, hour: 3600000, day: 86400000 };
export const INTERVIEW_MS = RULES.interviewMinutes * MS.minute;
export const ROLES = ['Student', 'Interviewer', 'Admin'];
export const JOURNEY_STATES = ['not_eligible','eligible','booked','needs_rebooking','no_show','retake_pending','failed_cooldown','failed_final','passed','nullified'];
export const H = MS.hour;

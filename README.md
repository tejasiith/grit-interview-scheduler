# GRIT Interview Scheduler

A front-end prototype of an interview scheduler with Student, Interviewer and Admin views.
Everything runs in the browser. All data lives in memory (no backend, no localStorage),
so a page refresh or the "Reset demo" button restores the mock data.

## Requirements

- Node.js 18 or newer
- npm 9 or newer

## Setup

```bash
npm install
npm run dev
```

Open the address Vite prints ( http://localhost:5173).

## Other scripts

```bash
npm run build     # production build into dist/
npm run preview   # serve the production build locally
```

## Demo guide

Flow: Student books > Interviewer records outcome > Student sees result > Admin simulates malpractice.

- Use the role switcher to move between Student, Interviewer and Admin.
- In the Student view, the "Demo state" dropdown jumps to any journey state. "Before result" and "After result" are shortcuts.
- The "Demo clock" controls move time forward so you can test cooldowns and the 12-hour and 24-hour rules. "Jump to" moves to just before, during and after an interview.
- "Reset demo" restores all mock data.
- All times are shown in IST (Asia/Kolkata).

## Project structure

- `src/lib/` rules constants and IST time formatting
- `src/data/` mock data and Student state content
- `src/store/store.js` the shared in-memory store and its actions
- `src/components/` screens and shared UI

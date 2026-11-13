

export const AFTER_STATES = ['no_show', 'retake_pending', 'failed_cooldown', 'failed_final', 'passed', 'nullified'];
export function PhaseBanner({ journey }) {
  const after = AFTER_STATES.includes(journey);
  return (
    <p className="rounded-lg px-3 py-2 text-sm font-semibold mb-5" role="status" style={{ background: 'var(--soft)', border: `2px solid ${after ? 'var(--t-green)' : 'var(--t-blue)'}` }}>
      Showing: {after ? 'after result' : 'before result'} <span className="muted font-medium">(student state: {journey})</span>
    </p>
  );
}

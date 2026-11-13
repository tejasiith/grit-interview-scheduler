export const Check = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>);
export const Lock = ({ size = 28 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 018 0v3"/></svg>);

export function Dialog({ title, children, buttons }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="surface rounded-xl p-6" style={{ maxWidth: '26rem', width: '100%' }}>
        <h3 className="text-lg font-bold">{title}</h3>
        <div className="mt-3 grid gap-2 text-sm">{children}</div>
        <div className="mt-5 flex gap-3 justify-end">{buttons}</div>
      </div>
    </div>
  );
}

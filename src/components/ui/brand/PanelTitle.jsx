export default function PanelTitle({ eyebrow, title, action, className = "" }) {
  return <div className={`mb-3 flex items-end justify-between gap-3 ${className}`}><div>{eyebrow && <p className="text-[9px] font-bold uppercase tracking-[.18em] text-transit-500">{eyebrow}</p>}<h2 className="mt-1 text-base font-semibold tracking-tight text-ink">{title}</h2></div>{action}</div>;
}

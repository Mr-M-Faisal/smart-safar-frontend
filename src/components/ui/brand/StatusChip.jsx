export default function StatusChip({ children, active = false, className = "" }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold ${active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"} ${className}`}><span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} aria-hidden="true"/>{children}</span>;
}

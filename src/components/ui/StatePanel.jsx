export default function StatePanel({ variant = "empty", title, description, action }) {
  const styles = {
    loading: "bg-slate-50 text-slate-700",
    empty: "bg-slate-50 text-slate-700",
    error: "bg-rose-50 text-rose-800",
  };
  const labels = { loading: "Loading", empty: "No data yet", error: "Unable to load" };

  return (
    <div className={`mt-5 rounded-2xl p-5 ${styles[variant] || styles.empty}`} role={variant === "error" ? "alert" : "status"}>
      <p className="text-xs font-bold uppercase tracking-[0.15em] opacity-70">{labels[variant] || labels.empty}</p>
      <p className="mt-2 font-semibold">{title}</p>
      {description ? <p className="mt-1 text-sm leading-6 opacity-80">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

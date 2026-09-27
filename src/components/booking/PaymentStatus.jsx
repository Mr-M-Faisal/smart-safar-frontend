const styles = {
  paid: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-800",
  failed: "bg-rose-50 text-rose-700",
  cancelled: "bg-slate-100 text-slate-600",
};

const labels = {
  paid: "Paid",
  pending: "Payment pending",
  failed: "Payment failed",
  cancelled: "Payment cancelled",
};

export default function PaymentStatus({ status, method }) {
  const normalizedStatus = styles[status] ? status : "pending";
  const methodLabel = method === "online" ? "Online" : "Cash";
  const statusLabel = normalizedStatus === "pending" && method !== "online" ? "Cash due on boarding" : labels[normalizedStatus];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles[normalizedStatus]}`}
      aria-label={`${statusLabel} via ${methodLabel}`}
      title={`${methodLabel} payment`}
    >
      <span aria-hidden="true">{normalizedStatus === "paid" ? "✓" : normalizedStatus === "pending" ? "◷" : "•"}</span>
      {statusLabel}
      <span className="font-normal opacity-75">· {methodLabel}</span>
    </span>
  );
}

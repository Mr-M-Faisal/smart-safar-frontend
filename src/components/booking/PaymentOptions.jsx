const methods = [
  { id: "cash", title: "Cash to driver", detail: "Pay the fare when you board.", icon: "₨", enabled: true },
  { id: "easypaisa", title: "EasyPaisa", detail: "Secure checkout is not connected yet.", icon: "E", enabled: false },
  { id: "jazzcash", title: "JazzCash", detail: "Secure checkout is not connected yet.", icon: "J", enabled: false },
];

export default function PaymentOptions({ value, onChange }) {
  return (
    <fieldset>
      <legend className="text-xs font-semibold text-[#596681]">How would you like to pay?</legend>
      <p className="mt-1 text-[11px] leading-5 text-[#8992a8]">Choose a payment method before reserving your seat.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {methods.map((method) => {
          const selected = value === method.id;
          return (
            <button
              key={method.id}
              type="button"
              disabled={!method.enabled}
              aria-pressed={selected}
              aria-label={`${method.title}${method.enabled ? "" : ", not available yet"}`}
              onClick={() => method.enabled && onChange(method.id)}
              className={`flex min-h-[94px] items-start gap-3 rounded-2xl border p-3 text-left transition ${!method.enabled ? "cursor-not-allowed border-[#e9ecf5] bg-[#f7f8fb] opacity-70" : selected ? "border-[#536bb7] bg-[#f4f6fc] ring-2 ring-[#536bb7]/10" : "border-[#dfe3f1] bg-white hover:border-[#9eaddf]"}`}
            >
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold ${selected ? "bg-[#536bb7] text-white" : "bg-[#eef1fa] text-[#536bb7]"}`} aria-hidden="true">{method.icon}</span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-[#34405d]">{method.title}</span>
                <span className="mt-1 block text-[10px] leading-4 text-[#7b859c]">{method.detail}</span>
                {!method.enabled && <span className="mt-1 block text-[9px] font-semibold uppercase tracking-wide text-[#a16a35]">Coming soon</span>}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 rounded-xl border border-[#dce2f1] bg-[#f4f6fc] px-3.5 py-3 text-xs leading-5 text-[#596681]">For now, reserve your seat and pay the driver in cash when boarding. The exact fare comes from the transit server and appears in your booking confirmation. EasyPaisa and JazzCash will become selectable after secure checkout is connected.</p>
    </fieldset>
  );
}

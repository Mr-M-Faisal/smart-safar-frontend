"use client";

import { useEffect } from "react";

function dateLabel(value) {
  return value ? new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Karachi" }).format(new Date(value)) : "Just now";
}

function routeDetails(route) {
  if (!route || typeof route !== "object") return { name: typeof route === "string" ? route : "Selected route", journey: "" };
  return {
    name: route.routeName || "Selected route",
    journey: route.startPoint && route.endPoint ? `${route.startPoint} → ${route.endPoint}` : "",
  };
}

export default function BookingConfirmationModal({ booking, onClose, onViewBookings, onBookAnother }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  if (!booking) return null;
  const route = routeDetails(booking.route);
  const bus = booking.bus && typeof booking.bus === "object" ? booking.bus.busNumber : booking.bus || "—";
  const payment = booking.paymentMethod === "cash" ? "Cash to driver" : booking.paymentMethod || "Cash to driver";
  const details = [
    ["Route", route.name],
    ["Journey", route.journey || "—"],
    ["Bus", bus],
    ["Seat", booking.seatNumber || "—"],
    ["Payment", payment],
    ["Fare", `${booking.currency || "PKR"} ${booking.fare ?? "—"}`],
    ["Reserved", dateLabel(booking.createdAt)],
  ];

  return (
    <div
      className="bottom-sheet-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-confirmation-title"
        className="bottom-sheet-content p-5 text-[#111d3d]"
      >
        <div className="bottom-sheet-handle" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m5 12 4.5 4.5L19 7"/>
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#536bb7]">Confirmed</p>
              <h2 id="booking-confirmation-title" className="text-base font-bold text-[#111d3d]">Seat Reserved</h2>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-500 active:bg-slate-200"
          >
            ×
          </button>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
          {details.map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-50 p-2.5">
              <dt className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
              <dd className="mt-0.5 truncate font-semibold text-[#111d3d]">{value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-3 rounded-xl bg-blue-50/70 px-3 py-2 text-[11px] leading-4 text-[#536bb7]">
          Pay the fare in cash when boarding. Your seat reservation is confirmed.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={onViewBookings}
            className="h-11 w-full rounded-xl bg-[#536bb7] text-xs font-bold text-white shadow-xs active:bg-[#43599f]"
          >
            View my bookings
          </button>
          <button
            type="button"
            onClick={onBookAnother}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#111d3d] active:bg-slate-50"
          >
            Book another ride
          </button>
        </div>
      </section>
    </div>
  );
}

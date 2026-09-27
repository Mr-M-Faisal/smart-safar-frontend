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

  return <div className="safar-modal-backdrop fixed inset-0 z-[2000] grid place-items-center overflow-y-auto bg-[#101a34]/55 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="booking-confirmation-title" className="safar-modal-card relative my-auto w-full max-w-lg overflow-hidden rounded-3xl border border-white/80 bg-white p-5 text-[#293553] shadow-[0_28px_90px_rgba(13,24,55,.35)] sm:p-7">
      <button type="button" aria-label="Close booking confirmation" onClick={onClose} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-[#f2f4fa] text-lg text-[#69758f] transition hover:bg-[#e8ecf8] hover:text-[#293553]">×</button>
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#e4f8f0] text-[#16866f] shadow-sm"><svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7"/></svg></div>
      <p className="mt-5 text-[10px] font-bold uppercase tracking-[.2em] text-[#536bb7]">Reservation confirmed</p>
      <h2 id="booking-confirmation-title" className="mt-1 text-2xl font-semibold tracking-tight text-[#293553]">Seat reserved!</h2>
      <p className="mt-2 text-sm leading-5 text-[#74809a]">Your booking was confirmed by the transit server.</p>
      <dl className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">{details.map(([label, value]) => <div key={label} className="min-w-0 rounded-xl bg-[#f5f6fb] px-3.5 py-3"><dt className="text-[9px] font-bold uppercase tracking-[.14em] text-[#8992a8]">{label}</dt><dd className="mt-1 break-words text-xs font-semibold text-[#34405d]">{value}</dd></div>)}</dl>
      <p className="mt-4 rounded-xl border border-[#dce2f1] bg-[#f4f6fc] px-4 py-3 text-xs leading-5 text-[#596681]">Pay the fare in cash when boarding. Your seat is confirmed by the server.</p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2"><button type="button" onClick={onViewBookings} className="min-h-11 rounded-xl bg-[#536bb7] px-4 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(83,107,183,.18)] transition hover:-translate-y-0.5 hover:bg-[#43599f]">View my bookings</button><button type="button" onClick={onBookAnother} className="min-h-11 rounded-xl border border-[#dfe3f1] bg-white px-4 text-sm font-semibold text-[#53617e] transition hover:-translate-y-0.5 hover:bg-[#f7f8fc]">Book another seat</button></div>
    </section>
  </div>;
}

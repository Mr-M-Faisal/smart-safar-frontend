"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import BottomSheet from "@/components/app/BottomSheet";

function seatNumberValue(seat) { return Number.parseInt(seat?.seatNumber, 10) || 0; }

const SeatTile = memo(function SeatTile({ seat, selected, highlighted, busy, onToggle, onReservedDetails }) {
  const status = seat?.status || "available";
  const label = `Seat ${seat?.seatNumber}, ${status}${selected ? ", selected" : ", not selected"}`;
  const colors = status === "available" ? "border-emerald-500 bg-white text-emerald-800" : status === "reserved" ? "border-amber-500 bg-amber-50 text-amber-900" : "border-rose-600 bg-rose-600 text-white";
  return <button type="button" aria-pressed={selected} aria-label={label} disabled={busy || !seat} onClick={() => {
    if (status === "reserved" && !selected) onReservedDetails(seat);
    onToggle(seatNumberValue(seat));
  }} className={`relative grid h-11 w-11 place-items-center rounded-xl border-2 text-xs font-bold transition-[transform,box-shadow,background-color] duration-[120ms] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none ${colors} ${selected ? "z-[1] scale-105 ring-2 ring-indigo-600 ring-offset-2" : ""} ${highlighted ? "animate-pulse ring-2 ring-emerald-500" : ""}`}>
    <span>{seat?.seatNumber}</span>
    {selected ? <span aria-hidden="true" className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-indigo-600 text-[10px] text-white">✓</span> : status === "reserved" ? <span aria-hidden="true" className="absolute -right-1 -top-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-amber-500 text-[9px] text-white">◷</span> : status === "occupied" ? <span aria-hidden="true" className="absolute -right-1 -top-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-rose-700 text-white"><svg viewBox="0 0 24 24" width="9" height="9" fill="currentColor"><circle cx="12" cy="7" r="3.2"/><path d="M5.5 20v-2.2a6.5 6.5 0 0 1 13 0V20z"/></svg></span> : null}
  </button>;
});

export default function DriverSeatMap({ seats = [], capacity = 0, occupied = 0, busy = false, error = null, notice = "", highlightedSeat = null, undoLabel = "", onAction, onWalkIn, onRetry, onUndo }) {
  const sortedSeats = useMemo(() => [...seats].sort((a, b) => seatNumberValue(a) - seatNumberValue(b)), [seats]);
  const [selected, setSelected] = useState(() => new Set());
  const [reservedSeat, setReservedSeat] = useState(null);
  const byNumber = useMemo(() => new Map(sortedSeats.map((seat) => [seatNumberValue(seat), seat])), [sortedSeats]);
  const seatCount = Math.max(0, Number(capacity) || sortedSeats.length);
  const rows = Math.ceil(seatCount / 4);
  const counts = useMemo(() => sortedSeats.reduce((result, seat) => { result[seat.status] = (result[seat.status] || 0) + 1; return result; }, { available: 0, reserved: 0, occupied: 0 }), [sortedSeats]);

  useEffect(() => {
    const current = new Set(sortedSeats.map(seatNumberValue));
    setSelected((previous) => {
      const present = [...previous].filter((number) => current.has(number));
      const firstStatus = byNumber.get(present[0])?.status;
      const statuses = new Set(present.map((number) => byNumber.get(number)?.status));
      const compatible = statuses.size > 1 ? present.filter((number) => byNumber.get(number)?.status === firstStatus) : present;
      const next = new Set(compatible);
      return next.size === previous.size ? previous : next;
    });
  }, [sortedSeats, byNumber]);

  const selectedSeats = [...selected].map((number) => byNumber.get(number)).filter(Boolean);
  const selectedStatuses = new Set(selectedSeats.map((seat) => seat.status));
  const homogeneous = selectedStatuses.size === 1;
  const selectedStatus = homogeneous ? selectedSeats[0]?.status : null;
  const actions = selectedStatus === "available" ? [["occupy", `Mark occupied (${selected.size})`]] : selectedStatus === "occupied" ? [["release", `Passenger got off (${selected.size})`]] : selectedStatus === "reserved" ? [["board", `Mark boarded (${selected.size})`], ["no_show", `No-show (${selected.size})`]] : [];

  const toggle = useCallback((number) => {
    if (!number) return;
    setSelected((previous) => { const next = new Set(previous); next.has(number) ? next.delete(number) : next.add(number); return next; });
  }, []);

  async function applyAction(action) {
    const failed = await onAction?.([...selected].sort((a, b) => a - b), action);
    const failedSet = new Set(failed || []);
    setSelected(failedSet);
  }

  return <section className="rounded-2xl border border-[#dfe6f8] bg-gradient-to-br from-[#f5f7ff] to-white p-4 sm:p-5" aria-label="Driver seat status">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="text-sm font-bold text-[#293553]">Live seat map</h2><p className="mt-1 text-lg font-bold text-[#293553]">{occupied} / {capacity} occupied</p></div><button type="button" disabled={busy} onClick={onWalkIn} className="min-h-11 shrink-0 rounded-xl bg-gradient-to-r from-[#263a70] to-[#536bb7] px-3 text-xs font-bold text-white shadow-md disabled:opacity-50">＋ Walk-in</button></div>
    <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Seat counts"><span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800">Available {counts.available}</span><span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-900">Reserved {counts.reserved}</span><span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-800">Occupied {counts.occupied}</span></div>
    {error && <div role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error.message || "Seat map could not load."}{error.code && <small className="ml-1 text-[9px]">{error.code}</small>}<button type="button" onClick={onRetry} className="ml-2 font-bold underline">Retry</button></div>}
    {notice && <p role="status" className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">{notice}</p>}
    {seatCount > 0 && sortedSeats.length === 0 && !error && <p role="status" className="mt-5 text-center text-xs text-[#77829a]">Loading seat map…</p>}
    {seatCount > 0 && sortedSeats.length > 0 && <div role="group" aria-label="Seat map" className="mx-auto mt-4 w-fit max-w-full overflow-x-auto rounded-[28px] border border-[#dfe3f1] bg-white px-3 py-4 shadow-inner">
      <div className="mb-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#77829a]"><svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="m5.6 5.6 5 5m7.8-5-5 5M12 14v6"/></svg>Front</div>
      <div className="mb-2 grid grid-cols-[44px_44px_22px_44px_44px] gap-[6px] text-center text-[9px] font-medium text-[#a0a8bb]"><span>Driver</span><span/><span/><span/><span/></div>
      <div className="flex flex-col gap-[6px]">
        {Array.from({ length: rows }, (_, row) => <div key={row} className="col-span-5 grid grid-cols-[44px_44px_22px_44px_44px] items-center gap-[6px]">
          {[0, 1, null, 2, 3].map((position, column) => {
            if (position == null) return <span key="aisle" aria-hidden="true" className="h-11 border-x border-dashed border-slate-200"/>;
            const number = row * 4 + position + 1;
            if (number > seatCount) return <span key={`empty-${column}`} className="h-11 w-11"/>;
            const seat = byNumber.get(number);
            const viewSeat = seat || { seatNumber: number, status: "available" };
            return <SeatTile key={number} seat={viewSeat} selected={selected.has(number)} highlighted={Number(highlightedSeat) === number} busy={busy || !seat} onToggle={toggle} onReservedDetails={setReservedSeat}/>;
          })}
        </div>)}
      </div>
      <div className="mt-3 text-center text-[9px] font-bold uppercase tracking-[.16em] text-[#77829a]">Rear</div>
    </div>}
    <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[9px] text-[#68738e]" aria-label="Seat map legend"><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded border border-emerald-600"/>Available</span><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded bg-amber-400"/>Reserved ◷</span><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded bg-rose-600"/>Occupied ♟</span><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded border-2 border-indigo-600"/>Selected ✓</span></div>
    <p className="mt-2 text-center text-[10px] text-[#8992a8]">Seat totals are calculated from the seat map.</p>
    {undoLabel && <div className="driver-seat-actions sticky bottom-0 z-10 -mx-4 mt-3 flex items-center gap-2 border-t border-[#e5e9f3] bg-white/95 px-4 py-3 shadow-[0_-8px_20px_rgba(35,49,87,.08)] sm:-mx-5 sm:px-5" role="status"><span className="mr-auto text-xs text-[#34405d]">Seats updated</span><button type="button" disabled={busy} onClick={onUndo} className="min-h-10 rounded-lg border border-[#dfe3f1] px-3 text-xs font-bold text-[#536bb7]">Undo {undoLabel}</button></div>}
    {selected.size > 0 && <div className="driver-seat-actions sticky bottom-0 z-10 -mx-4 mt-3 flex flex-wrap items-center gap-2 border-t border-[#e5e9f3] bg-white/95 px-4 py-3 shadow-[0_-8px_20px_rgba(35,49,87,.08)] sm:-mx-5 sm:px-5" role="region" aria-live="polite" aria-label="Selected seat actions">
      <span className="mr-auto text-xs font-semibold text-[#34405d]">{selected.size} selected</span><button type="button" disabled={busy} onClick={() => setSelected(new Set())} className="min-h-10 px-2 text-xs font-semibold text-[#68738e]">Clear</button>
      {!homogeneous ? <span className="w-full text-center text-xs text-amber-800">Select seats with the same status</span> : actions.map(([action, label]) => <button key={action} type="button" disabled={busy} onClick={() => void applyAction(action)} className="min-h-11 rounded-xl bg-[#536bb7] px-3 text-[11px] font-bold text-white disabled:opacity-50">{label}</button>)}
    </div>}
    <BottomSheet open={Boolean(reservedSeat)} title={`Seat ${reservedSeat?.seatNumber} reservation`} onClose={() => setReservedSeat(null)}><div className="space-y-3 text-sm text-[#596681]"><p><strong>Passenger:</strong> {reservedSeat?.passengerName || "Name unavailable"}</p><p><strong>Location sharing:</strong> {reservedSeat?.shareLocation ? "On · pickup location shared" : "Off"}</p><button type="button" className="app-secondary w-full" onClick={() => setReservedSeat(null)}>Close</button></div></BottomSheet>
  </section>;
}

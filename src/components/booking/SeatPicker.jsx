"use client";

import { useEffect, useState } from "react";

export default function SeatPicker({ capacity = 30, seats: actualSeats, value, onChange }) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const seatCount = Math.max(1, Math.min(Number(capacity) || 30, 60));
  const seats = actualSeats || Array.from({ length: seatCount }, (_, index) => ({ seatNumber: String(index + 1), status: "available" }));

  return (
    <fieldset>
      <legend className="text-xs font-semibold text-[#596681]">Choose your seat number</legend>
      <p className="mt-1 text-[11px] leading-5 text-[#8992a8]">
        {!online
          ? "Needs internet connection to view and select live seats."
          : "Seat availability is confirmed when you reserve. If someone else has taken your choice, you can select another."}
      </p>
      <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
        {seats.map((item) => {
          const seat = String(item.seatNumber);
          const selected = value === seat;
          const taken = !online || item.status === "reserved" || item.status === "occupied";
          return (
            <button
              key={seat}
              type="button"
              aria-pressed={selected}
              disabled={taken}
              aria-label={!online ? `Seat ${seat}, offline` : `Seat ${seat}${selected ? ", selected" : ""}`}
              onClick={() => { if (online) onChange(seat); }}
              className={`min-h-11 rounded-xl border text-sm font-semibold transition ${selected ? "border-[#536bb7] bg-[#536bb7] text-white shadow-[0_5px_14px_rgba(83,107,183,.2)]" : taken ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400" : "border-[#dfe3f1] bg-white text-[#53617e] hover:border-[#9eaddf] hover:bg-[#f4f6fc]"}`}
            >
              {seat}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-[#8992a8]">
        {!online ? "Offline mode · seats disabled" : "Available · Selected · Taken"}
      </p>
      {value && online && <p className="mt-2 text-xs font-semibold text-[#536bb7]">Seat {value} selected</p>}
    </fieldset>
  );
}

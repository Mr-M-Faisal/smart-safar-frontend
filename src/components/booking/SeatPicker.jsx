export default function SeatPicker({ capacity = 30, value, onChange }) {
  const seatCount = Math.max(1, Math.min(Number(capacity) || 30, 60));
  const seats = Array.from({ length: seatCount }, (_, index) => String(index + 1));

  return (
    <fieldset>
      <legend className="text-xs font-semibold text-[#596681]">Choose your seat number</legend>
      <p className="mt-1 text-[11px] leading-5 text-[#8992a8]">Seat availability is confirmed when you reserve. If someone else has taken your choice, you can select another.</p>
      <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
        {seats.map((seat) => {
          const selected = value === seat;
          return (
            <button
              key={seat}
              type="button"
              aria-pressed={selected}
              aria-label={`Seat ${seat}${selected ? ", selected" : ""}`}
              onClick={() => onChange(seat)}
              className={`min-h-11 rounded-xl border text-sm font-semibold transition ${selected ? "border-[#536bb7] bg-[#536bb7] text-white shadow-[0_5px_14px_rgba(83,107,183,.2)]" : "border-[#dfe3f1] bg-white text-[#53617e] hover:border-[#9eaddf] hover:bg-[#f4f6fc]"}`}
            >
              {seat}
            </button>
          );
        })}
      </div>
      {value && <p className="mt-2 text-xs font-semibold text-[#536bb7]">Seat {value} selected</p>}
    </fieldset>
  );
}

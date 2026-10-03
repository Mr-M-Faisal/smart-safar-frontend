"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { readBookingSelection, saveBookingSelection } from "@/lib/bookingSelection";

function displayBus(bus) { return bus?.busNumber || `Bus ${String(bus?._id || "").slice(-5)}`; }

export default function BookingPreviewPage() {
  const [routes, setRoutes] = useState([]);
  const [routeId, setRouteId] = useState("");
  const [routesState, setRoutesState] = useState("loading");
  const [routesError, setRoutesError] = useState("");
  const [buses, setBuses] = useState([]);
  const [busId, setBusId] = useState("");
  const [busesState, setBusesState] = useState("idle");
  const [busReload, setBusReload] = useState(0);
  const [busesError, setBusesError] = useState("");
  const [seats, setSeats] = useState([]);
  const [capacity, setCapacity] = useState(0);
  const [seatState, setSeatState] = useState("idle");
  const [seatReload, setSeatReload] = useState(0);
  const [seatError, setSeatError] = useState("");
  const [selectedSeat, setSelectedSeat] = useState("");
  const selectedRoute = useMemo(() => routes.find((route) => String(route._id) === String(routeId)), [routes, routeId]);
  const selectedBus = useMemo(() => buses.find((bus) => String(bus._id) === String(busId)), [buses, busId]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const saved = readBookingSelection();
    const requestedRoute = params.get("route") || saved.routeId || "";
    const requestedBus = params.get("bus") || saved.busId || "";
    const requestedSeat = params.get("seat") || "";
    apiRequest("/routes").then((result) => {
      if (!active) return;
      const items = Array.isArray(result) ? result : [];
      setRoutes(items);
      setRoutesState("ready");
      setRouteId(items.some((route) => String(route._id) === String(requestedRoute)) ? requestedRoute : "");
      setBusId(requestedBus);
      setSelectedSeat(requestedSeat);
    }).catch((error) => {
      if (!active) return;
      setRoutesError(error.message || "Could not load routes. Check your connection and retry.");
      setRoutesState("error");
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!routeId) { setBuses([]); setBusId(""); setBusesState("idle"); return undefined; }
    let active = true;
    setBusesState("loading");
    setBusesError("");
    const refresh = async () => {
      try {
        const result = await apiRequest(`/buses/route/${encodeURIComponent(routeId)}/active`);
        if (!active) return;
        const operatingBuses = Array.isArray(result) ? result : [];
        setBuses(operatingBuses);
        setBusId((current) => operatingBuses.some((bus) => String(bus._id) === String(current)) ? current : operatingBuses.length === 1 ? operatingBuses[0]._id : "");
        setBusesState("ready");
        setBusesError("");
      } catch (error) {
        if (!active) return;
        setBusesError(error.message || "Could not load active buses. Check your connection and retry.");
        setBusesState("error");
      }
    };
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [routeId, busReload]);

  useEffect(() => {
    if (!busId) { setSeats([]); setSeatState("idle"); return undefined; }
    let active = true;
    setSeatState("loading");
    setSeatError("");
    const refresh = async () => {
      try {
        const result = await apiRequest(`/buses/${encodeURIComponent(busId)}/seats`);
        if (!active) return;
        setSeats(Array.isArray(result.seats) ? result.seats : []);
        setCapacity(Number(result.capacity) || 0);
        setSelectedSeat((current) => current && !result.seats?.some((seat) => String(seat.seatNumber) === String(current) && seat.status === "available") ? "" : current);
        setSeatState("ready");
        setSeatError("");
      } catch (error) {
        if (!active) return;
        setSeatError(error.message || "Could not load this seat map. Retry when your connection is stable.");
        setSeatState("error");
      }
    };
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [busId, seatReload]);

  function chooseRoute(nextRouteId) {
    setRouteId(nextRouteId);
    setBusId("");
    setSelectedSeat("");
    saveBookingSelection({ routeId: nextRouteId, busId: "" });
  }
  function chooseBus(nextBusId) {
    setBusId(nextBusId);
    setSelectedSeat("");
    saveBookingSelection({ routeId, busId: nextBusId });
  }

  const signInHref = selectedRoute ? `/login?bookingRoute=${encodeURIComponent(routeId)}${busId ? `&bookingBus=${encodeURIComponent(busId)}` : ""}${selectedSeat ? `&bookingSeat=${encodeURIComponent(selectedSeat)}` : ""}` : "/login?booking=1";
  const seatCount = Math.min(capacity || seats.length, 80);
  const seatByNumber = new Map(seats.map((seat) => [String(seat.seatNumber), seat]));

  return <main className="min-h-[70vh] bg-[#f4f5fb] px-4 py-7 text-[#293553] sm:px-8 sm:py-10 lg:px-12">
    <div className="mx-auto max-w-3xl">
      <section className="rounded-[1.75rem] bg-gradient-to-br from-[#26386e] via-[#354b8d] to-[#4560a8] p-5 text-white shadow-[0_18px_45px_rgba(47,66,126,.18)] sm:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#a8efdf]">Guest preview</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Check your journey before signing in.</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">See operating buses, arrival estimates, fares when available, and live seat availability. Sign in only when you’re ready to reserve.</p>
      </section>

      <section className="mt-5 space-y-5 rounded-3xl border border-white bg-white p-5 shadow-[0_14px_38px_rgba(53,67,112,.07)] sm:p-7">
        <label className="block"><span className="text-xs font-semibold text-[#596681]">1 · Choose a route</span>
          {routesState === "error" ? <div role="alert" className="mt-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{routesError}<button type="button" onClick={() => { setRoutesState("loading"); setRoutesError(""); apiRequest("/routes").then((result) => { setRoutes(Array.isArray(result) ? result : []); setRoutesState("ready"); }).catch((error) => { setRoutesError(error.message || "Could not load routes."); setRoutesState("error"); }); }} className="ml-2 font-semibold underline">Retry</button></div> : <select disabled={routesState !== "ready"} value={routeId} onChange={(event) => chooseRoute(event.target.value)} className="mt-1.5 min-h-12 w-full rounded-xl border border-[#dfe3f1] bg-[#fbfcff] px-3 text-sm text-[#34405d] outline-none focus:border-[#8093d1]"><option value="">{routesState === "loading" ? "Loading routes…" : "Select a route"}</option>{routes.map((route) => <option key={route._id} value={route._id}>{route.routeName} · {route.startPoint} to {route.endPoint}</option>)}</select>}
        </label>

        {routeId && <div><p className="text-xs font-semibold text-[#596681]">2 · Choose an active bus</p>
          {busesState === "error" ? <p role="alert" className="mt-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{busesError}<button type="button" onClick={() => setBusReload((value) => value + 1)} className="ml-2 font-semibold underline">Retry</button></p> : busesState === "loading" ? <p className="mt-2 rounded-xl bg-[#f6f7fb] p-3 text-xs text-[#74809a]">Checking for buses currently on shift…</p> : !buses.length ? <p className="mt-2 rounded-xl bg-[#f6f7fb] p-4 text-sm text-[#74809a]">No buses running on this route right now.</p> : <div className="mt-2 grid gap-2 sm:grid-cols-2">{buses.map((bus) => <button key={bus._id} type="button" aria-pressed={String(busId) === String(bus._id)} onClick={() => chooseBus(bus._id)} className={`min-h-16 rounded-xl border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7185c6] ${String(busId) === String(bus._id) ? "border-[#536bb7] bg-[#eef1fc] shadow-sm" : "border-[#e3e7f1] bg-white hover:border-[#9eaddf]"}`}><span className="block text-sm font-semibold">{displayBus(bus)}</span><span className="mt-1 block text-xs text-[#74809a]">{bus.availableSeats ?? "—"} seats free{bus.etaMinutes != null ? ` · ETA ${Math.round(bus.etaMinutes)} min` : ""}{bus.fare != null ? ` · PKR ${bus.fare}` : ""}</span></button>)}</div>}
        </div>}

        {selectedBus && <div><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold text-[#596681]">3 · Seat availability</p><span className="rounded-full bg-[#e8faf4] px-3 py-1 text-[10px] font-semibold text-[#167b6e]">Refreshes every 5 seconds</span></div>
          {seatState === "error" ? <p role="alert" className="mt-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{seatError}<button type="button" onClick={() => setSeatReload((value) => value + 1)} className="ml-2 font-semibold underline">Retry</button></p> : seatState === "loading" ? <p className="mt-2 rounded-xl bg-[#f6f7fb] p-3 text-xs text-[#74809a]">Loading the bus seat map…</p> : <><div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-8">{Array.from({ length: seatCount }, (_, index) => {
            const number = String(index + 1);
            const seat = seatByNumber.get(number);
            const available = seat?.status === "available";
            const selected = selectedSeat === number;
            const unavailable = !available && !selected;
            return <button key={number} type="button" disabled={!available} aria-pressed={selected} aria-label={`Seat ${number}${selected ? ", selected" : unavailable ? ", taken" : ", available"}`} onClick={() => setSelectedSeat(number)} className={`min-h-11 rounded-xl border text-sm font-semibold transition ${selected ? "border-[#536bb7] bg-[#536bb7] text-white" : available ? "border-[#dfe3f1] bg-white text-[#53617e] hover:border-[#9eaddf] hover:bg-[#f4f6fc]" : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"}`}>{number}</button>;
          })}</div><p className="mt-2 text-[10px] text-[#8992a8]">Available · Selected · Taken</p></>}
          {selectedRoute?.fare != null && <p className="mt-3 rounded-xl bg-[#f6f7fb] p-3 text-xs text-[#68738e]">Indicative fare: PKR {selectedRoute.fare}. Confirmed fare is shown before booking.</p>}
        </div>}

        <div className="border-t border-[#e9ecf5] pt-4"><p className="text-xs leading-5 text-[#7b859c]">Seat availability is a live preview and can change before reservation. No seat is held until you sign in and confirm.</p>{selectedRoute && selectedBus && selectedSeat && seatState === "ready" ? <Link href={signInHref} className="mt-3 flex min-h-12 items-center justify-center rounded-xl bg-[#536bb7] px-5 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(83,107,183,.18)] transition hover:bg-[#43599f]">Sign in to reserve seat {selectedSeat}<span className="ml-2" aria-hidden="true">→</span></Link> : <p className="mt-3 rounded-xl bg-[#f6f7fb] px-4 py-3 text-xs text-[#74809a]">Choose a route, active bus, and available seat to continue to sign-in.</p>}<Link href="/routes" className="mt-3 inline-flex min-h-11 items-center text-xs font-semibold text-[#536bb7] underline">Browse all routes</Link></div>
      </section>
    </div>
  </main>;
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useRoutes } from "@/lib/data/hooks";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthProvider";
import { readBookingSelection, saveBookingSelection } from "@/lib/bookingSelection";
import PaymentOptions from "@/components/booking/PaymentOptions";
import SeatPicker from "@/components/booking/SeatPicker";

const steps = ["Route", "Bus", "Seat", "Payment", "Confirm"];

export default function MobileBookingPage() {
  const auth = useAuth();
  const router = useRouter();
  const routesResource = useRoutes();
  const routes = Array.isArray(routesResource.data) ? routesResource.data : [];
  const [step, setStep] = useState(0);
  const [routeId, setRouteId] = useState("");
  const [busId, setBusId] = useState("");
  const [seat, setSeat] = useState("");
  const [payment, setPayment] = useState("cash");
  const [buses, setBuses] = useState([]);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [locationPrimer, setLocationPrimer] = useState(false);
  const [shareLocation, setShareLocation] = useState(false);
  const route = routes.find((item) => String(item._id) === routeId);
  const selectedBus = buses.find((item) => String(item._id) === busId);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const saved = readBookingSelection();
    setRouteId(params.get("route") || saved.routeId || "");
    setBusId(params.get("bus") || saved.busId || "");
  }, []);
  useEffect(() => {
    if (auth.status === "guest") {
      const requested = `/m/book${window.location.search}`;
      window.location.replace(`/m/login?returnTo=${encodeURIComponent(requested)}`);
    } else if (auth.status === "authenticated" && auth.role !== "commuter") setError("Sign in with a passenger account to book a seat.");
  }, [auth.status, auth.role, router]);
  useEffect(() => {
    if (!routeId) { setBuses([]); return; }
    let active = true;
    setLoading(true); setError("");
    apiRequest(`/buses/route/${encodeURIComponent(routeId)}/active`).then((result) => {
      if (active) { const list = Array.isArray(result) ? result : []; setBuses(list); if (!list.some((item) => String(item._id) === busId)) setBusId(""); }
    }).catch((requestError) => { if (active) { setBuses([]); setError(requestError.message || "Could not load buses for this route."); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [routeId]);
  useEffect(() => {
    if (!busId) { setSeats([]); return; }
    let active = true;
    setLoading(true); setError("");
    apiRequest(`/buses/${encodeURIComponent(busId)}/seats`).then((result) => { if (active) setSeats(result.seats || []); }).catch((requestError) => { if (active) { setSeats([]); setError(requestError.message || "Could not load seat availability."); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [busId]);

  const currentSelection = useMemo(() => ({ routeId, busId }), [routeId, busId]);
  useEffect(() => { if (routeId) saveBookingSelection(currentSelection); }, [currentSelection, routeId]);

  function next() {
    setError("");
    if (step === 0 && !routeId) { setError("Choose a route to continue."); return; }
    if (step === 1 && !busId) { setError("Choose an operating bus to continue."); return; }
    if (step === 2 && !seat) { setError("Choose an available seat to continue."); return; }
    if (step === 3 && !payment) { setError("Choose a payment method."); return; }
    setStep((value) => Math.min(4, value + 1));
  }

  async function reserve() {
    if (!auth.token || !routeId || !busId || !seat) return;
    if (shareLocation) {
      let primerSeen = false;
      try { primerSeen = localStorage.getItem("ss-location-primer-seen") === "1"; } catch (_error) {}
      if (!primerSeen) { setLocationPrimer(true); return; }
    }
    setBusy(true); setError("");
    try {
      let pickupLocation;
      if (shareLocation) {
        pickupLocation = await new Promise((resolve, reject) => {
          if (!navigator.geolocation) { reject(new Error("Location is not available on this device.")); return; }
          navigator.geolocation.getCurrentPosition(({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy, timestamp: new Date().toISOString() }), () => reject(new Error("Allow location access to share your pickup location, then try again.")), { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
        });
      }
      const result = await apiRequest("/bookings", { method: "POST", token: auth.token, body: JSON.stringify({ routeId, bus: busId, paymentMethod: payment, shareLocation, seatNumber: seat, ...(pickupLocation ? { pickupLocation } : {}) }) });
      if (result === false || result?.success === false || result?.status === "failed") throw new Error(result?.message || "The seat could not be reserved.");
      setConfirmation(result.booking || result.reservation || result.data || result);
    } catch (requestError) { setError(requestError.message || "Could not reserve your seat. Please try again."); }
    finally { setBusy(false); }
  }

  if (auth.status === "loading") return <div className="app-screen"><div className="app-empty">Checking your passenger account…</div></div>;
  if (auth.status !== "authenticated" || auth.role !== "commuter") return <div className="app-screen"><div className="app-card p-5"><h2 className="text-lg font-bold text-[#293553]">Passenger account required</h2><p className="app-muted mt-2">Sign in with a passenger account to reserve a seat.</p><Link href={`/m/login?returnTo=${encodeURIComponent(`/m/book${typeof window === "undefined" ? "" : window.location.search}`)}`} className="app-primary mt-4 w-full">Sign in</Link></div></div>;

  return <div className="app-screen">
    <div className="app-stepper" aria-label={`Step ${step + 1} of ${steps.length}`}>{steps.map((label, index) => <span key={label} className={index <= step ? "active" : ""}>{label}</span>)}</div>
    {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-800">{error}</p>}
    <section className="app-card mt-4 p-4">
      <p className="app-eyebrow">Step {step + 1} of 5</p>
      <h2 className="mt-1 text-lg font-bold text-[#293553]">{["Choose a route", "Choose an operating bus", "Pick a seat", "Payment method", "Review your booking"][step]}</h2>
      <p className="app-muted mt-1">{["Select where you are travelling.", "Only buses with a driver on an active shift can be booked.", "Availability is confirmed again when you reserve.", "Cash payment is available when boarding.", "Check the details before you confirm."][step]}</p>
      {step === 0 && <div className="mt-4 grid gap-2">{routes.map((item) => <button type="button" key={item._id} aria-pressed={routeId === String(item._id)} onClick={() => { setRouteId(String(item._id)); setBusId(""); setSeat(""); }} className={`min-h-[58px] rounded-xl border p-3 text-left ${routeId === String(item._id) ? "border-[#536bb7] bg-[#eef1fc]" : "border-[#e4e8f3] bg-white"}`}><span className="block text-sm font-bold text-[#34405d]">{item.routeName}</span><span className="mt-1 block text-xs text-[#77829a]">{item.startPoint} → {item.endPoint} · {item.fare != null ? `Rs. ${item.fare}` : "Fare unavailable"}</span></button>)}{routesResource.error && <div role="alert" className="app-empty">Routes couldn’t load. <button className="font-bold text-[#536bb7]" onClick={() => void routesResource.refresh()}>Retry</button></div>}{!routes.length && !routesResource.isLoading && <div className="app-empty">No routes are currently available.</div>}</div>}
      {step === 1 && <div className="mt-4 grid gap-2">{loading && <p className="app-empty">Loading operating buses…</p>}{!loading && !error && buses.length === 0 && <p className="app-empty">No operating buses are available on this route yet.</p>}{buses.map((bus) => <button key={bus._id} type="button" aria-pressed={busId === String(bus._id)} onClick={() => { setBusId(String(bus._id)); setSeat(""); }} className={`min-h-[62px] rounded-xl border p-3 text-left ${busId === String(bus._id) ? "border-[#536bb7] bg-[#eef1fc]" : "border-[#e4e8f3] bg-white"}`}><span className="block text-sm font-bold text-[#34405d]">{bus.busNumber || "Bus"}</span><span className="mt-1 block text-xs text-[#77829a]">{bus.availableSeats ?? "—"} free seats{bus.etaMinutes != null ? ` · ETA ${Math.round(bus.etaMinutes)} min` : ""}</span></button>)}</div>}
      {step === 2 && <div className="mt-4"><SeatPicker capacity={selectedBus?.capacity || 30} seats={seats} value={seat} onChange={setSeat}/>{loading && <p className="mt-3 text-xs text-[#77829a]">Refreshing seat availability…</p>}</div>}
      {step === 3 && <div className="mt-4"><PaymentOptions value={payment} onChange={setPayment}/><label className="mt-4 flex min-h-[56px] items-start gap-3 rounded-xl bg-[#f6f7fb] p-3"><input type="checkbox" className="mt-1 h-4 w-4 accent-[#536bb7]" checked={shareLocation} onChange={(event) => setShareLocation(event.target.checked)} /><span className="text-xs leading-5 text-[#596681]"><strong>Share pickup location</strong><span className="block text-[#8992a8]">Optional. Location is shared only for this confirmed booking.</span></span></label></div>}
      {step === 4 && <div className="mt-4 rounded-xl bg-[#f7f8fc] p-4 text-sm text-[#46516d]"><p><strong>Route:</strong> {route?.routeName || "—"}</p><p className="mt-2"><strong>Bus:</strong> {selectedBus?.busNumber || "—"}</p><p className="mt-2"><strong>Seat:</strong> {seat || "—"}</p><p className="mt-2"><strong>Payment:</strong> {payment === "cash" ? "Cash on boarding" : "Online"}</p><p className="mt-2"><strong>Fare:</strong> {selectedBus?.fare ?? route?.fare ?? "To be confirmed"}</p></div>}
      <div className="mt-5 flex gap-2">{step > 0 && <button type="button" className="app-secondary flex-1" onClick={() => { setError(""); setStep((value) => value - 1); }}>Back</button>}{step < 4 ? <button type="button" className="app-primary flex-1" onClick={next} disabled={loading}>{loading ? "Loading…" : "Continue"}</button> : <button type="button" className="app-primary flex-1" onClick={reserve} disabled={busy}>{busy ? "Reserving…" : "Reserve seat"}</button>}</div>
    </section>
    {locationPrimer && <div className="fixed inset-0 z-[1750] flex items-end justify-center bg-[#101a35]/45 p-3 sm:items-center"><section role="dialog" aria-modal="true" aria-labelledby="location-primer-title" className="w-full max-w-md rounded-[24px] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl"><p className="app-eyebrow">Optional location sharing</p><h2 id="location-primer-title" className="mt-2 text-lg font-bold text-[#293553]">Share your pickup point?</h2><p className="app-muted mt-2">Your browser will ask for location access. The pickup point is sent only with this booking and is shared with the assigned driver. You can leave sharing off.</p><button className="app-primary mt-5 w-full" onClick={() => { try { localStorage.setItem("ss-location-primer-seen", "1"); } catch (_error) {} setLocationPrimer(false); void reserve(); }}>Continue and reserve</button><button className="mt-2 min-h-11 w-full text-xs font-bold text-[#536bb7]" onClick={() => setLocationPrimer(false)}>Go back</button></section></div>}
    {confirmation && <div className="fixed inset-0 z-[1800] flex items-end justify-center bg-[#101a35]/45 p-3 sm:items-center"><section role="dialog" aria-modal="true" aria-labelledby="booking-confirm-title" className="w-full max-w-md rounded-[24px] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl"><p className="app-eyebrow">Booking complete</p><h2 id="booking-confirm-title" className="mt-2 text-xl font-bold text-[#293553]">Your seat is reserved</h2><p className="app-muted mt-2">{route?.routeName} · {selectedBus?.busNumber} · Seat {confirmation.seatNumber || seat}</p><p className="mt-3 text-xs text-[#68738e]">Payment is recorded by the transit server. Cash is due when boarding.</p><Link href="/m/trips" className="app-primary mt-5 w-full">View my trips</Link><button className="mt-3 min-h-11 w-full text-xs font-bold text-[#536bb7]" onClick={() => { setConfirmation(null); setStep(0); setBusId(""); setSeat(""); }}>Book another trip</button></section></div>}
  </div>;
}

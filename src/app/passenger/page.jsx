"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { clearSessionToken, readSessionToken } from "@/lib/session";
import PaymentStatus from "@/components/booking/PaymentStatus";
import SeatPicker from "@/components/booking/SeatPicker";
import PaymentOptions from "@/components/booking/PaymentOptions";
import { createTransitSocket } from "@/lib/socket";
import ProfileMenu from "@/components/layout/ProfileMenu";

function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("Location is not available in this browser.")); return; }
    navigator.geolocation.getCurrentPosition(({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy, timestamp: new Date().toISOString() }), () => reject(new Error("Allow location access to share your pickup location, then try again.")), { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
  });
}

function dateLabel(value) { return value ? new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Karachi" }).format(new Date(value)) : "—"; }
function busName(value) { return typeof value === "object" && value ? value.busNumber : "Bus"; }
function routeIdForBus(bus) { return typeof bus?.route === "object" && bus.route ? bus.route._id : bus?.route; }

function PanelTitle({ eyebrow, title, note }) {
  return <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#536bb7]">{eyebrow}</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-[#293553]">{title}</h2></div>{note && <p className="text-xs text-[#8992a8]">{note}</p>}</div>;
}

export default function PassengerPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sessionState, setSessionState] = useState("loading");
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [safetySessions, setSafetySessions] = useState([]);
  const [routeAlerts, setRouteAlerts] = useState([]);
  const [routeAlertsState, setRouteAlertsState] = useState("idle");
  const [routeAlertsRefresh, setRouteAlertsRefresh] = useState(0);
  const [routeId, setRouteId] = useState("");
  const [bookingForm, setBookingForm] = useState({ routeId: "", seatNumber: "", paymentMethod: "cash", shareLocation: false });
  const [safetyBusId, setSafetyBusId] = useState("");
  const [reportForm, setReportForm] = useState({ bus: "", reportType: "condition", description: "" });
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [shareUrl, setShareUrl] = useState("");
  const [activeTab, setActiveTab] = useState("book");
  const selectedRouteBuses = buses.filter((bus) => String(routeIdForBus(bus)) === String(bookingForm.routeId));
  const seatCapacity = selectedRouteBuses.reduce((capacity, bus) => Math.max(capacity, Number(bus.capacity) || 0), 0) || 30;
  const freeSeatsOnRoute = selectedRouteBuses.filter((bus) => bus.status === "active").reduce((sum, bus) => sum + Math.max(0, Number(bus.availableSeats) || 0), 0);

  useEffect(() => {
    const busIds = buses.map((bus) => bus._id).filter(Boolean);
    if (sessionState !== "ready" || !busIds.length) return undefined;
    const socket = createTransitSocket();
    socket.on("connect", () => busIds.forEach((id) => socket.emit("watchBus", id)));
    socket.on("seatAvailabilityUpdate", (update) => {
      if (!update?.busId) return;
      setBuses((current) => current.map((bus) => String(bus._id) === String(update.busId) ? { ...bus, availableSeats: update.availableSeats, ...(update.capacity != null ? { capacity: update.capacity } : {}) } : bus));
    });
    socket.connect();
    return () => socket.disconnect();
  }, [buses.map((bus) => bus._id).filter(Boolean).join(","), sessionState]);

  useEffect(() => {
    const requestedRouteId = new URLSearchParams(window.location.search).get("routeId");
    if (requestedRouteId && routes.some((route) => route._id === requestedRouteId)) {
      setBookingForm((current) => current.routeId === requestedRouteId ? current : { ...current, routeId: requestedRouteId });
    }
  }, [routes]);

  const reload = useCallback(async (sessionToken, isActive = () => true) => {
    const currentProfile = await apiRequest("/auth/profile", { token: sessionToken });
    if (!isActive()) return;
    if (currentProfile.role !== "commuter") {
      clearSessionToken(); setToken(null); setProfile(null); setSessionState("denied"); return;
    }
    setProfile(currentProfile);
    const paths = ["/routes", "/buses", "/bookings/me", "/safety/sessions/me"];
    const results = await Promise.all(paths.map((path) => apiRequest(path, { token: sessionToken }).catch((error) => ({ error }))));
    if (!isActive()) return;
    if (results.some((result) => result?.error?.status === 401)) throw Object.assign(new Error("Your session expired. Sign in again."), { status: 401 });
    const [routeResult, busResult, bookingResult, safetyResult] = results;
    const requestErrors = results.map((result, index) => result?.error ? paths[index].replace(/\//g, "") : null).filter(Boolean);
    setRoutes(Array.isArray(routeResult) ? routeResult : []);
    setBuses(Array.isArray(busResult) ? busResult : []);
    setBookings(Array.isArray(bookingResult) ? bookingResult : []);
    setSafetySessions(Array.isArray(safetyResult) ? safetyResult : []);
    if (requestErrors.length) setNotice({ type: "error", text: `Some passenger data could not load: ${requestErrors.join(", ")}. Refresh to retry.` });
    setSessionState("ready");
  }, []);

  useEffect(() => {
    let active = true;
    const sessionToken = readSessionToken();
    setToken(sessionToken);
    if (!sessionToken) { setSessionState("signed-out"); return () => { active = false; }; }
    setSessionState("loading");
    reload(sessionToken, () => active).catch((error) => {
      if (!active) return;
      if (error.status === 401) { clearSessionToken(); setToken(null); setSessionState("expired"); }
      else { setSessionState("error"); setNotice({ type: "error", text: error.message || "Could not load your passenger account." }); }
    });
    return () => { active = false; };
  }, [reload, refreshKey]);

  useEffect(() => {
    if (sessionState !== "signed-out" && sessionState !== "expired") return;
    const params = new URLSearchParams(window.location.search);
    const requestedRouteId = params.get("routeId");
    const destination = requestedRouteId ? `/login?bookingRoute=${encodeURIComponent(requestedRouteId)}` : window.location.hash === "#booking" ? "/login?booking=1" : "/login";
    router.replace(destination);
  }, [sessionState, router]);

  useEffect(() => {
    let active = true;
    if (!token || !routeId) { setRouteAlerts([]); setRouteAlertsState("idle"); return () => { active = false; }; }
    setRouteAlertsState("loading");
    apiRequest(`/route-alerts/route/${encodeURIComponent(routeId)}`, { token })
      .then((result) => { if (active) { setRouteAlerts(Array.isArray(result) ? result : []); setRouteAlertsState("ready"); } })
      .catch(() => { if (active) { setRouteAlerts([]); setRouteAlertsState("error"); } });
    return () => { active = false; };
  }, [token, routeId, refreshKey, routeAlertsRefresh]);

  async function perform(label, action, success) {
    if (!token || busy) return false;
    setBusy(label); setNotice(null); setShareUrl("");
    try {
      const result = await action();
      if (success) setNotice({ type: "success", text: success(result) });
      setRefreshKey((key) => key + 1);
      return result || true;
    } catch (error) {
      if (error.status === 401) { clearSessionToken(); setToken(null); setProfile(null); setSessionState("expired"); }
      setNotice({ type: "error", text: error.message || "That action could not be completed. Please try again." });
      return false;
    } finally { setBusy(""); }
  }

  async function bookRide(event) {
    event.preventDefault();
    const pickupLocation = bookingForm.shareLocation ? await getLocation().catch((error) => { setNotice({ type: "error", text: error.message }); return null; }) : null;
    if (bookingForm.shareLocation && !pickupLocation) return;
    const payload = { routeId: bookingForm.routeId, paymentMethod: bookingForm.paymentMethod === "cash" ? "cash" : "online", shareLocation: bookingForm.shareLocation, seatNumber: bookingForm.seatNumber.trim(), ...(pickupLocation ? { pickupLocation } : {}) };
    const result = await perform("booking", () => apiRequest("/bookings", { method: "POST", token, body: JSON.stringify(payload) }), (booking) => `Seat ${booking.seatNumber || bookingForm.seatNumber} reserved on ${busName(booking.bus)}. Fare: ${booking.currency || "PKR"} ${booking.fare ?? "—"}. No online payment was taken; pay the driver when boarding.`);
    if (result && result !== true) setBookingForm((current) => ({ ...current, seatNumber: "", shareLocation: false }));
  }

  async function toggleBookingLocation(booking) {
    if (booking.status !== "confirmed") return;
    const shareLocation = !booking.locationSharingActive;
    const pickupLocation = shareLocation ? await getLocation().catch((error) => { setNotice({ type: "error", text: error.message }); return null; }) : null;
    if (shareLocation && !pickupLocation) return;
    await perform(`location-${booking._id}`, () => apiRequest(`/bookings/${encodeURIComponent(booking._id)}/location`, { method: "PATCH", token, body: JSON.stringify({ shareLocation, ...(pickupLocation ? { pickupLocation } : {}) }) }), () => shareLocation ? "Pickup location sharing started." : "Pickup location sharing stopped.");
  }

  async function cancelBooking(booking) {
    if (booking.status !== "confirmed") return;
    const paymentNote = booking.paymentStatus === "paid" ? " Your payment will remain marked as paid; refunds are not available in the current app." : "";
    if (!window.confirm(`Cancel this booking? The seat will be released.${paymentNote}`)) return;
    await perform(`cancel-${booking._id}`, () => apiRequest(`/bookings/${encodeURIComponent(booking._id)}/cancel`, { method: "PATCH", token }), () => `Booking cancelled and the seat released.${paymentNote}`);
  }

  async function startSafetyShare(event) {
    event.preventDefault();
    const result = await perform("safety", () => apiRequest("/safety/sessions", { method: "POST", token, body: JSON.stringify({ bus: safetyBusId }) }), () => "Your trip sharing link is ready.");
    if (result && result !== true) setShareUrl(`${window.location.origin}/safety/track?token=${encodeURIComponent(result.shareToken)}`);
  }

  async function stopSafetyShare(session) {
    await perform(`safety-${session._id}`, () => apiRequest(`/safety/sessions/${encodeURIComponent(session._id)}/end`, { method: "PATCH", token }), () => "Trip sharing ended.");
  }

  async function sendReport(event) {
    event.preventDefault();
    const result = await perform("report", () => apiRequest("/reports", { method: "POST", token, body: JSON.stringify(reportForm) }), () => "Your report was sent to the transit team.");
    if (result) setReportForm((current) => ({ ...current, description: "" }));
  }

  async function copyShareUrl() {
    try { await navigator.clipboard.writeText(shareUrl); setNotice({ type: "success", text: "Safety link copied to clipboard." }); }
    catch { setNotice({ type: "error", text: "Could not copy automatically. Select and copy the link below." }); }
  }

  function signOut() { clearSessionToken(); setToken(null); setProfile(null); setSessionState("signed-out"); }

  if (["signed-out", "expired"].includes(sessionState)) return <main className="min-h-[70vh] bg-[#f4f5fb] p-6"><p className="mx-auto max-w-2xl rounded-2xl bg-white p-5 text-sm text-[#68738e]">Opening passenger sign-in…</p></main>;
  if (sessionState === "denied") {
    const denied = true;
    const requestedRouteId = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("routeId");
    const signInHref = requestedRouteId ? `/login?bookingRoute=${encodeURIComponent(requestedRouteId)}` : "/login";
    return <main className="min-h-[70vh] bg-[#f4f5fb] px-4 py-10"><section className="mx-auto max-w-2xl rounded-3xl border border-white bg-white p-7 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#536bb7]">Passenger account</p><h1 className="mt-3 text-2xl font-semibold text-[#293553]">{denied ? "Passenger access only" : sessionState === "expired" ? "Please sign in again" : "Sign in to book your ride"}</h1><p className="mt-2 text-sm leading-6 text-[#74809a]">{denied ? "This page is for passenger accounts. Use an administrator or driver account in its own workspace." : "Create a passenger account or sign in to view bookings, route alerts, and trip sharing."}</p><Link href={signInHref} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#536bb7] px-5 py-3 text-sm font-semibold text-white">Sign in or create account →</Link><Link href="/routes" className="ml-3 inline-flex min-h-11 items-center rounded-xl border border-[#dfe3f1] px-5 py-3 text-sm font-semibold text-[#53617e]">Browse routes</Link></section></main>;
  }
  if (sessionState === "loading") return <main className="min-h-[70vh] bg-[#f4f5fb] p-6"><div className="mx-auto max-w-5xl rounded-3xl bg-white p-6 text-sm text-[#68738e]">Loading your passenger account…</div></main>;
  if (sessionState === "error") return <main className="min-h-[70vh] bg-[#f4f5fb] p-6"><div className="mx-auto max-w-5xl rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">{notice?.text || "Could not load your passenger account."}<button onClick={() => setRefreshKey((key) => key + 1)} className="ml-3 font-semibold underline">Try again</button></div></main>;

  return (
    <main className="workspace-theme min-h-screen bg-[#f4f5fb] px-4 py-7 text-[#293553] sm:px-8 sm:py-10 lg:px-12">
      <div className="mx-auto max-w-[1240px]">
        <section className="flex flex-col justify-between gap-4 rounded-[1.75rem] bg-gradient-to-br from-[#26386e] via-[#354b8d] to-[#4560a8] p-6 text-white shadow-[0_18px_45px_rgba(47,66,126,.18)] sm:flex-row sm:items-end sm:p-8"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#a8efdf]">Passenger dashboard</p><h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Your journeys, {profile?.name?.split(" ")[0] || "all in one place"}.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/75">Book a ride, check route updates, and share your trip with people you trust.</p></div><ProfileMenu name={profile?.name} email={profile?.email} role="Passenger" onSignOut={signOut} /></section>

        {notice && <div role={notice.type === "error" ? "alert" : "status"} className={`mt-5 rounded-2xl border px-4 py-3 text-sm leading-5 ${notice.type === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{notice.text}</div>}

        <div role="tablist" aria-label="Passenger dashboard sections" className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-[#e3e7f2] bg-white p-2 shadow-sm sm:grid-cols-4">
          {[ ["book", "Book a ride", "Choose route, seat & payment"], ["history", "My bookings", "View recent and past trips"], ["security", "Trip security", "Share your trip or location"], ["report", "Report an issue", "Tell us about a bus problem"] ].map(([id, title, description]) => <button key={id} type="button" role="tab" id={"passenger-tab-" + id} aria-selected={activeTab === id} aria-controls={"passenger-panel-" + id} onClick={() => setActiveTab(id)} className={"min-h-[76px] rounded-xl px-3 py-3 text-left transition duration-200 sm:px-4 " + (activeTab === id ? "bg-[#536bb7] text-white shadow-md shadow-[#536bb7]/20" : "text-[#53617e] hover:-translate-y-0.5 hover:bg-[#f1f3fb] hover:text-[#34405d]")}><span className="block text-xs font-bold sm:text-sm">{title}</span><span className={"mt-1 hidden text-[10px] leading-4 sm:block " + (activeTab === id ? "text-white/75" : "text-[#8992a8]")}>{description}</span></button>)}
        </div>

        {activeTab === "book" && <div role="tabpanel" id="passenger-panel-book" aria-labelledby="passenger-tab-book" className="mt-5 grid items-start gap-5 xl:grid-cols-[1.1fr_.9fr]">
          <section id="booking" className="scroll-mt-24 rounded-3xl border border-white bg-white p-5 shadow-[0_14px_38px_rgba(53,67,112,.07)] sm:p-7"><PanelTitle eyebrow="Simple 3-step booking" title="Reserve your seat" note={`${routes.length} routes`}/><p className="mt-2 text-xs leading-5 text-[#7b859c]">Choose a route, pick a seat number, then confirm. The server checks the live bus and seat availability before reserving.</p>
            <form onSubmit={bookRide} className="mt-5 space-y-5"><label className="block"><span className="text-xs font-semibold text-[#596681]">1 · Choose your route</span><select required value={bookingForm.routeId} onChange={(event) => setBookingForm({ ...bookingForm, routeId: event.target.value, seatNumber: "" })} className="mt-1.5 min-h-12 w-full rounded-xl border border-[#dfe3f1] bg-[#fbfcff] px-3 text-sm text-[#34405d] outline-none focus:border-[#8093d1]"><option value="">Select a route</option>{routes.map((route) => <option key={route._id} value={route._id}>{route.routeName} · {route.startPoint} to {route.endPoint}</option>)}</select></label>
              {bookingForm.routeId && <div className="rounded-2xl bg-[#f7f8fc] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold text-[#596681]">2 · Choose your seat number</p><span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f8f5] px-2.5 py-1 text-[10px] font-bold text-[#167b6e]"><span className="h-1.5 w-1.5 rounded-full bg-[#20bba5]"/> {freeSeatsOnRoute} seats reported free on this route</span></div><p className="mt-1 text-[10px] text-[#8992a8]">Availability updates live. The server confirms your selected seat before it is reserved.</p><div className="mt-2"><SeatPicker capacity={seatCapacity} value={bookingForm.seatNumber} onChange={(seatNumber) => setBookingForm({ ...bookingForm, seatNumber })}/></div></div>}
              {bookingForm.routeId && <PaymentOptions value={bookingForm.paymentMethod} onChange={(paymentMethod) => setBookingForm({ ...bookingForm, paymentMethod })}/>}
              <label className="flex items-start gap-3 rounded-xl bg-[#f6f7fb] p-3.5"><input type="checkbox" checked={bookingForm.shareLocation} onChange={(event) => setBookingForm({ ...bookingForm, shareLocation: event.target.checked })} className="mt-0.5 h-4 w-4 accent-[#536bb7]"/><span className="text-xs leading-5 text-[#596681]"><strong className="font-semibold text-[#34405d]">Share pickup location with my driver</strong><span className="mt-0.5 block text-[#8992a8]">Optional. Your browser will ask for location access, and sharing is only sent for this confirmed booking.</span></span></label>
              {bookingForm.routeId && <button disabled={busy !== "" || !bookingForm.seatNumber} className="min-h-12 w-full rounded-xl bg-[#536bb7] px-5 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(83,107,183,.18)] transition hover:-translate-y-0.5 hover:bg-[#43599f] disabled:cursor-not-allowed disabled:opacity-50">{busy === "booking" ? "Reserving seat…" : bookingForm.seatNumber ? `3 · Reserve seat ${bookingForm.seatNumber} · Pay at boarding` : "Choose a seat to continue"}<span className="ml-2" aria-hidden="true">→</span></button>}
            </form>
            {routes.length === 0 && <p className="mt-3 text-xs text-[#8992a8]">No active routes are available right now.</p>}
          </section>

          <section className="rounded-3xl border border-white bg-[#e9ebf8] p-5 shadow-[0_14px_38px_rgba(53,67,112,.07)] sm:p-7"><PanelTitle eyebrow="Service notices" title="Route alerts" note="Choose a route to check updates"/><select value={routeId} onChange={(event) => setRouteId(event.target.value)} className="mt-5 min-h-11 w-full rounded-xl border border-white bg-white px-3 text-sm text-[#34405d] outline-none focus:border-[#8093d1]"><option value="">Select a route</option>{routes.map((route) => <option key={route._id} value={route._id}>{route.routeName}</option>)}</select>
            {routeAlertsState === "loading" && <p className="mt-4 rounded-xl bg-white/70 p-4 text-xs text-[#74809a]">Checking route alerts…</p>}
            {routeAlertsState === "error" && <div role="status" className="mt-4 rounded-xl bg-white/70 p-4 text-xs leading-5 text-[#74809a]">Route alerts could not be loaded.<button type="button" onClick={() => setRouteAlertsRefresh((current) => current + 1)} className="ml-2 font-semibold text-[#536bb7] underline">Try again</button></div>}
            {routeAlertsState === "ready" && (routeAlerts.length ? <div className="mt-4 space-y-2">{routeAlerts.map((alert) => <article key={alert._id} className="rounded-2xl border border-white bg-white p-4"><p className="text-sm font-semibold text-[#34405d]">{alert.message}</p><p className="mt-2 text-[10px] text-[#8992a8]">Posted {dateLabel(alert.createdAt)}{alert.expiresAt ? ` · until ${dateLabel(alert.expiresAt)}` : ""}</p></article>)}</div> : <p className="mt-4 rounded-xl bg-white/70 p-4 text-xs text-[#74809a]">{routeId ? "No active alerts for this route." : "Select a route to view its latest notices."}</p>)}
          </section>
        </div>}

        {activeTab === "history" && <section role="tabpanel" id="passenger-panel-history" aria-labelledby="passenger-tab-history" className="mt-5 rounded-3xl border border-white bg-white p-5 shadow-[0_14px_38px_rgba(53,67,112,.07)] sm:p-7"><PanelTitle eyebrow="Your trips" title="My bookings" note={`${bookings.length} bookings`}/><p className="mt-2 text-xs leading-5 text-[#7b859c]">Payment is recorded by the server. Online checkout is not available yet, so online bookings remain pending until a provider is connected.</p><div className="mt-5 space-y-3">{bookings.map((booking) => <article key={booking._id} className="grid gap-4 rounded-2xl border border-[#e9ecf5] bg-[#fbfcff] p-4 sm:grid-cols-[1fr_auto] sm:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold text-[#34405d]">{booking.route?.routeName || "Transit ride"}</h3><span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold capitalize ${booking.status === "confirmed" ? "bg-emerald-50 text-emerald-700" : booking.status === "completed" ? "bg-[#e9edff] text-[#536bb7]" : "bg-slate-100 text-slate-600"}`}>{booking.status}</span><PaymentStatus status={booking.paymentStatus} method={booking.paymentMethod}/></div><p className="mt-1 truncate text-xs text-[#74809a]">{booking.route?.startPoint || "—"} → {booking.route?.endPoint || "—"} · {busName(booking.bus)}{booking.seatNumber ? ` · Seat ${booking.seatNumber}` : ""}</p><p className="mt-1 text-[10px] text-[#8992a8]">{dateLabel(booking.createdAt)} · {booking.currency || "PKR"} {booking.fare ?? 0}</p>{booking.locationSharingActive && <p className="mt-2 text-[10px] font-semibold text-[#16866f]">Pickup location is shared with your driver.</p>}</div><div className="flex flex-wrap gap-2">{booking.status === "confirmed" && <><button disabled={busy !== ""} onClick={() => cancelBooking(booking)} className="min-h-11 rounded-lg border border-[#f0d1cc] bg-white px-3 text-[10px] font-semibold text-[#a65348] disabled:opacity-50">Cancel</button></>}</div></article>)}{bookings.length === 0 && <p className="rounded-2xl bg-[#f6f7fb] p-5 text-sm text-[#74809a]">You have no bookings yet. Choose a route above to get started.</p>}</div></section>}

        <div className="mt-5 grid items-start gap-5 xl:grid-cols-2">
          {activeTab === "security" && <section className="rounded-3xl border border-white bg-[#e9ebf8] p-5 shadow-[0_14px_38px_rgba(53,67,112,.07)] sm:p-7"><PanelTitle eyebrow="Pickup privacy" title="Share your location with your driver" note="Confirmed bookings only"/><p className="mt-2 text-xs leading-5 text-[#7b859c]">Turn pickup sharing on only when you want your assigned driver to see your location. You can stop it at any time.</p><div className="mt-5 space-y-3">{bookings.filter((booking) => booking.status === "confirmed").map((booking) => <article key={booking._id} className="flex flex-col justify-between gap-3 rounded-2xl border border-white bg-white p-4 sm:flex-row sm:items-center"><div><p className="text-xs font-semibold text-[#34405d]">{booking.route?.routeName || "Transit ride"} · Seat {booking.seatNumber || "—"}</p><p className="mt-1 text-[10px] text-[#8992a8]">{busName(booking.bus)} · {booking.locationSharingActive ? "Location sharing is on" : "Location sharing is off"}</p></div><button disabled={busy !== ""} onClick={() => toggleBookingLocation(booking)} className="min-h-10 self-start rounded-lg border border-[#dce2f1] bg-white px-3 text-[10px] font-semibold text-[#536bb7] disabled:opacity-50">{booking.locationSharingActive ? "Stop sharing" : "Share pickup location"}</button></article>)}{bookings.filter((booking) => booking.status === "confirmed").length === 0 && <p className="rounded-xl bg-white/70 p-4 text-xs leading-5 text-[#7b859c]">You have no confirmed bookings to share a pickup location for. Book a ride first.</p>}</div></section>}

          {activeTab === "security" && <section role="tabpanel" id="passenger-panel-security" aria-labelledby="passenger-tab-security" className="rounded-3xl border border-white bg-white p-5 shadow-[0_14px_38px_rgba(53,67,112,.07)] sm:p-7"><PanelTitle eyebrow="Trip safety" title="Share a trip with someone you trust"/><p className="mt-2 text-xs leading-5 text-[#7b859c]">Create a private link that shows your selected bus location while your trip is active. Anyone holding the link can see the passenger name, bus, route, and live bus location. You can stop sharing at any time.</p>
            <form onSubmit={startSafetyShare} className="mt-4 flex flex-col gap-3 sm:flex-row"><select required value={safetyBusId} onChange={(event) => setSafetyBusId(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#dfe3f1] bg-[#fbfcff] px-3 text-sm text-[#34405d] outline-none focus:border-[#8093d1]"><option value="">Choose a bus</option>{buses.map((bus) => <option key={bus._id} value={bus._id}>{bus.busNumber} · {bus.route?.routeName || "Route details unavailable"}</option>)}</select><button disabled={busy === "safety" || buses.length === 0} className="min-h-11 rounded-xl bg-[#536bb7] px-4 text-xs font-semibold text-white transition hover:bg-[#43599f] disabled:opacity-50">{busy === "safety" ? "Creating link…" : "Create safety link"}</button></form>
            {shareUrl && <div className="mt-4 rounded-2xl border border-[#dce2f1] bg-[#f4f6fc] p-4"><p className="text-xs font-semibold text-[#34405d]">Your private trip link is ready</p><div className="mt-2 flex flex-col gap-2 sm:flex-row"><input readOnly value={shareUrl} aria-label="Safety tracking link" className="min-h-10 min-w-0 flex-1 rounded-lg border border-[#dfe3f1] bg-white px-3 text-xs text-[#34405d]"/><button onClick={copyShareUrl} className="rounded-lg bg-[#536bb7] px-3 py-2 text-xs font-semibold text-white hover:bg-[#43599f]">Copy link</button></div><a href={shareUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-[10px] font-semibold text-[#536bb7] underline">Preview shared trip ↗</a></div>}
            <div className="mt-5 space-y-2">{safetySessions.map((session) => <article key={session._id} className="flex flex-col justify-between gap-3 rounded-2xl bg-[#f6f7fb] p-4 sm:flex-row sm:items-center"><div><p className="text-xs font-semibold text-[#34405d]">{busName(session.bus)} · {session.isActive ? "Sharing active" : "Sharing ended"}</p><p className="mt-1 text-[10px] text-[#8992a8]">Started {dateLabel(session.startedAt)}</p>{session.shareToken && <a href={`/safety/track?token=${encodeURIComponent(session.shareToken)}`} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[10px] font-semibold text-[#536bb7] underline">Open shared trip</a>}</div>{session.isActive && <button disabled={busy !== ""} onClick={() => stopSafetyShare(session)} className="self-start rounded-lg border border-[#f0d1cc] bg-white px-3 py-2 text-[10px] font-semibold text-[#a65348] disabled:opacity-50">{busy === `safety-${session._id}` ? "Stopping…" : "Stop sharing"}</button>}</article>)}{safetySessions.length === 0 && <p className="rounded-xl bg-[#f6f7fb] p-4 text-xs text-[#7b859c]">No trip-sharing sessions yet.</p>}</div>
          </section>}

          {activeTab === "report" && <section role="tabpanel" id="passenger-panel-report" aria-labelledby="passenger-tab-report" className="rounded-3xl border border-white bg-[#e9ebf8] p-5 shadow-[0_14px_38px_rgba(53,67,112,.07)] sm:p-7"><PanelTitle eyebrow="Help improve service" title="Report a bus issue"/><p className="mt-2 text-xs leading-5 text-[#7b859c]">Send a safety or vehicle-condition report to the transit team.</p><form onSubmit={sendReport} className="mt-4 space-y-3"><label className="block"><span className="text-xs font-semibold text-[#596681]">Bus</span><select required value={reportForm.bus} onChange={(event) => setReportForm({ ...reportForm, bus: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-white bg-white px-3 text-sm text-[#34405d] outline-none focus:border-[#8093d1]"><option value="">Choose a bus</option>{buses.map((bus) => <option key={bus._id} value={bus._id}>{bus.busNumber} · {bus.route?.routeName || "Route details unavailable"}</option>)}</select></label><label className="block"><span className="text-xs font-semibold text-[#596681]">Report type</span><select value={reportForm.reportType} onChange={(event) => setReportForm({ ...reportForm, reportType: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-white bg-white px-3 text-sm text-[#34405d] outline-none focus:border-[#8093d1]"><option value="condition">Vehicle condition</option><option value="safety">Safety concern</option></select></label><label className="block"><span className="text-xs font-semibold text-[#596681]">What happened?</span><textarea required minLength={3} maxLength={2000} rows={4} value={reportForm.description} onChange={(event) => setReportForm({ ...reportForm, description: event.target.value })} placeholder="Describe the issue so the transit team can review it…" className="mt-1.5 w-full resize-y rounded-xl border border-white bg-white px-3 py-3 text-sm leading-5 text-[#34405d] outline-none placeholder:text-[#a1a9bc] focus:border-[#8093d1]"/></label><button disabled={busy === "report" || buses.length === 0} className="min-h-11 w-full rounded-xl bg-[#536bb7] px-4 text-xs font-semibold text-white transition hover:bg-[#43599f] disabled:opacity-50">{busy === "report" ? "Sending report…" : "Submit report"}</button></form></section>}
        </div>
      </div>
    </main>
  );
}


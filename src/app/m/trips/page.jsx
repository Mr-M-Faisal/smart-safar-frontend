"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useMyBookings, useMySafetySessions, useRoutes } from "@/lib/data/hooks";
import { useAuth } from "@/lib/auth/AuthProvider";
import { apiRequest } from "@/lib/api";
import PaymentStatus from "@/components/booking/PaymentStatus";
import { useAppRefresh } from "@/components/app/AppRefreshContext";

const tabs = ["Upcoming", "Past", "Safety", "Report"];

export default function MobileTripsPage() {
  const auth = useAuth();
  const [tab, setTab] = useState("Upcoming");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState("");
  const [report, setReport] = useState({ bus: "", reportType: "condition", description: "" });
  const [busId, setBusId] = useState("");
  const bookingResource = useMyBookings(auth.token, { enabled: auth.status === "authenticated" && auth.role === "commuter" });
  const safetyResource = useMySafetySessions(auth.token, { enabled: auth.status === "authenticated" && auth.role === "commuter" });
  const routeResource = useRoutes({ enabled: tab === "Safety" || tab === "Report" });
  const bookings = Array.isArray(bookingResource.data) ? bookingResource.data : bookingResource.data?.bookings || [];
  const sessions = Array.isArray(safetyResource.data) ? safetyResource.data : safetyResource.data?.sessions || [];
  const buses = useMemo(() => (Array.isArray(routeResource.data) ? routeResource.data : []).flatMap((route) => (route.buses || []).map((bus) => ({ ...bus, routeName: route.routeName }))), [routeResource.data]);
  const visibleBookings = bookings.filter((booking) => tab === "Upcoming" ? ["confirmed", "pending"].includes(booking.status) : ["completed", "cancelled"].includes(booking.status));
  const refreshTrips = useCallback(() => Promise.all([bookingResource.refresh(), safetyResource.refresh(), routeResource.refresh()]), [bookingResource.refresh, safetyResource.refresh, routeResource.refresh]);
  useAppRefresh(refreshTrips);

  async function action(label, path, options = {}) {
    setWorking(label); setError(""); setNotice("");
    try { await apiRequest(path, { ...options, token: auth.token }); setNotice("Your trip information has been updated."); await Promise.all([bookingResource.refresh(), safetyResource.refresh()]); }
    catch (requestError) { setError(requestError.message || "This action could not be completed."); }
    finally { setWorking(""); }
  }
  async function shareLocation(booking) {
    let pickupLocation;
    const next = !booking.locationSharingActive;
    if (next) {
      try { pickupLocation = await new Promise((resolve, reject) => navigator.geolocation?.getCurrentPosition(({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy, timestamp: new Date().toISOString() }), () => reject(new Error("Allow location access to share your pickup point.")), { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }) || reject(new Error("Location is unavailable."))); }
      catch (locationError) { setError(locationError.message); return; }
    }
    await action(`location-${booking._id}`, `/bookings/${encodeURIComponent(booking._id)}/location`, { method: "PATCH", body: JSON.stringify({ shareLocation: next, ...(pickupLocation ? { pickupLocation } : {}) }) });
  }
  async function createSafety(event) {
    event.preventDefault();
    if (!busId) return;
    setWorking("safety"); setError("");
    try { const result = await apiRequest("/safety/sessions", { method: "POST", token: auth.token, body: JSON.stringify({ bus: busId }) }); setNotice("Your private trip link is ready."); if (result?.url || result?.shareUrl) setNotice(result.url || result.shareUrl); await safetyResource.refresh(); }
    catch (requestError) { setError(requestError.message || "Could not create a trip sharing link."); }
    finally { setWorking(""); }
  }
  async function submitReport(event) {
    event.preventDefault();
    setWorking("report"); setError(""); setNotice("");
    try { await apiRequest("/reports", { method: "POST", token: auth.token, body: JSON.stringify(report) }); setNotice("Your report was sent to the transit team."); setReport((current) => ({ ...current, description: "" })); }
    catch (requestError) { setError(requestError.message || "Could not send your report."); }
    finally { setWorking(""); }
  }
  if (auth.status === "loading") return <div className="app-screen"><div className="app-empty">Checking your account…</div></div>;
  if (auth.status !== "authenticated" || auth.role !== "commuter") return <div className="app-screen"><div className="app-card p-5"><h2 className="text-lg font-bold text-[#293553]">Sign in to manage trips</h2><p className="app-muted mt-2">Bookings and trip safety tools are linked to your passenger account.</p><Link href={`/m/login?returnTo=${encodeURIComponent("/m/trips")}`} className="app-primary mt-4 w-full">Sign in</Link></div></div>;

  return <div className="app-screen">
    <div role="tablist" aria-label="Trip sections" className="grid grid-cols-4 gap-1 rounded-2xl bg-[#e9edf7] p-1">{tabs.map((item) => <button key={item} role="tab" aria-selected={tab === item} onClick={() => { setTab(item); setError(""); setNotice(""); }} className={`min-h-10 rounded-xl px-1 text-[10px] font-bold ${tab === item ? "bg-white text-[#40599f] shadow-sm" : "text-[#75809a]"}`}>{item}</button>)}</div>
    {notice && <p role="status" className="mt-3 break-words rounded-xl bg-[#e8faf4] p-3 text-xs text-[#167b6e]">{notice}</p>}{error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}
    {tab === "Upcoming" || tab === "Past" ? <section className="mt-4 grid gap-3">{bookingResource.isLoading && !bookings.length && <div className="app-empty">Loading bookings…</div>}{bookingResource.error && !bookings.length && <div role="alert" className="app-empty">Bookings couldn’t load. <button className="font-bold text-[#536bb7]" onClick={() => void bookingResource.refresh()}>Retry</button></div>}{!bookingResource.isLoading && !bookingResource.error && visibleBookings.length === 0 && <div className="app-empty">{tab === "Upcoming" ? "No upcoming trips yet." : "No past trips yet."}<Link className="ml-1 font-bold text-[#536bb7]" href="/m/routes">Find a route</Link></div>}{visibleBookings.map((booking) => <article key={booking._id} className="app-card p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate text-sm font-bold text-[#34405d]">{booking.route?.routeName || "Transit ride"}</h2><p className="mt-1 text-xs text-[#77829a]">{booking.route?.startPoint || "—"} → {booking.route?.endPoint || "—"}</p></div><span className="rounded-full bg-[#eef1fc] px-2.5 py-1 text-[10px] font-bold capitalize text-[#536bb7]">{booking.status}</span></div><div className="mt-3 flex flex-wrap items-center gap-2"><span className="text-xs text-[#66728e]">{booking.bus?.busNumber || booking.bus || "Bus"} · Seat {booking.seatNumber || "—"}</span><PaymentStatus status={booking.paymentStatus} method={booking.paymentMethod}/></div><p className="mt-2 text-[10px] text-[#8992a8]">{booking.currency || "PKR"} {booking.fare ?? "—"}{booking.createdAt ? ` · ${new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeZone: "Asia/Karachi" }).format(new Date(booking.createdAt))}` : ""}</p>{booking.status === "confirmed" && <div className="mt-3 flex gap-2"><button disabled={working !== ""} onClick={() => void shareLocation(booking)} className="app-secondary flex-1">{booking.locationSharingActive ? "Stop pickup sharing" : "Share pickup location"}</button><button disabled={working !== ""} onClick={() => void action(`cancel-${booking._id}`, `/bookings/${encodeURIComponent(booking._id)}/cancel`, { method: "PATCH" })} className="min-h-11 rounded-xl border border-rose-200 px-3 text-[11px] font-bold text-rose-700">Cancel</button></div>}</article>)}</section> : null}
    {tab === "Safety" && <section className="mt-4 grid gap-3"><form onSubmit={createSafety} className="app-card p-4"><h2 className="text-sm font-bold text-[#34405d]">Share a private trip link</h2><p className="app-muted mt-1">Anyone with the link can see the selected bus location. You can end sharing at any time.</p><select required className="app-input mt-3" value={busId} onChange={(event) => setBusId(event.target.value)}><option value="">Choose a bus</option>{buses.map((bus) => <option key={bus._id} value={bus._id}>{bus.busNumber} · {bus.routeName}</option>)}</select><button disabled={working !== "" || !busId} className="app-primary mt-3 w-full">{working === "safety" ? "Creating link…" : "Create trip link"}</button></form>{safetyResource.isLoading && !sessions.length && <div className="app-empty">Loading shared trips…</div>}{sessions.map((session) => <article key={session._id} className="app-card p-4"><p className="text-sm font-bold text-[#34405d]">{session.bus?.busNumber || "Shared trip"}</p><p className="app-muted mt-1">{session.status || "Active"} · {session.route?.routeName || "Live location"}</p>{session.shareUrl && <a className="mt-2 block break-all text-xs font-semibold text-[#536bb7] underline" href={session.shareUrl}>{session.shareUrl}</a>}<button className="app-secondary mt-3 w-full" onClick={() => void action(`end-${session._id}`, `/safety/sessions/${encodeURIComponent(session._id)}/end`, { method: "PATCH" })}>End sharing</button></article>)}</section>}
    {tab === "Report" && <form onSubmit={submitReport} className="app-card mt-4 grid gap-3 p-4"><h2 className="text-sm font-bold text-[#34405d]">Report a transit issue</h2><label className="grid gap-1 text-xs font-semibold text-[#596681]">Bus<select className="app-input" value={report.bus} onChange={(event) => setReport((current) => ({ ...current, bus: event.target.value }))}><option value="">Select a bus (optional)</option>{buses.map((bus) => <option key={bus._id} value={bus._id}>{bus.busNumber} · {bus.routeName}</option>)}</select></label><label className="grid gap-1 text-xs font-semibold text-[#596681]">Issue type<select className="app-input" value={report.reportType} onChange={(event) => setReport((current) => ({ ...current, reportType: event.target.value }))}><option value="condition">Bus condition</option><option value="behavior">Driver behavior</option><option value="delay">Delay</option><option value="other">Other</option></select></label><label className="grid gap-1 text-xs font-semibold text-[#596681]">Details<textarea required minLength={5} rows={4} className="app-input py-3" value={report.description} onChange={(event) => setReport((current) => ({ ...current, description: event.target.value }))} /></label><button disabled={working !== ""} className="app-primary w-full">{working === "report" ? "Sending…" : "Send report"}</button></form>}
  </div>;
}

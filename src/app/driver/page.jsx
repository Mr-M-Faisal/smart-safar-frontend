"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { io } from "socket.io-client";
import { apiRequest } from "@/lib/api";
import { clearSessionToken, readSessionToken, revokeAndClearSession } from "@/lib/session";
import ProfileMenu from "@/components/layout/ProfileMenu";

const backendOrigin = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

function assignedBusId(value) {
  return typeof value === "object" && value ? value._id : value;
}

function timeLabel(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Karachi" }).format(new Date(value));
}

function elapsedLabel(from, to) {
  if (!from) return "—";
  const totalSeconds = Math.max(0, Math.floor((to - new Date(from).getTime()) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

function InfoCard({ label, value }) {
  return <div className="rounded-2xl border border-white bg-white/85 p-4 shadow-[0_8px_24px_rgba(53,67,112,.05)]"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#8992a8]">{label}</p><p className="mt-2 break-words text-sm font-semibold text-[#34405d]">{value || "—"}</p></div>;
}

export default function DriverHomePage() {
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [bus, setBus] = useState(null);
  const [pageState, setPageState] = useState("loading");
  const [pageMessage, setPageMessage] = useState("");
  const [working, setWorking] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [passengerLocations, setPassengerLocations] = useState([]);
  const [locationsState, setLocationsState] = useState("idle");
  const [locationsMessage, setLocationsMessage] = useState("");
  const [locationRefresh, setLocationRefresh] = useState(0);
  const [seatBusy, setSeatBusy] = useState(false);
  const [seatError, setSeatError] = useState(null);
  const [seatState, setSeatState] = useState({ seats: [], occupied: 0, capacity: 0 });
  const [shiftClock, setShiftClock] = useState(Date.now());
  const [lastShiftEndedAt, setLastShiftEndedAt] = useState(null);
  const activeShift = profile?.activeShift;
  const authState = pageState === "ready" ? "authenticated" : ["signed-out", "expired", "denied"].includes(pageState) ? "unauthenticated" : "loading";

  useEffect(() => {
    const handleExpired = (event) => { if (event.detail?.role === "driver") { setToken(null); setProfile(null); setBus(null); setPageState("expired"); } };
    window.addEventListener("smart-safar:auth-expired", handleExpired);
    return () => window.removeEventListener("smart-safar:auth-expired", handleExpired);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setShiftClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const reload = useCallback(async (sessionToken, isActive = () => true) => {
    const currentProfile = await apiRequest("/auth/profile", { token: sessionToken });
    if (!isActive()) return;
    if (currentProfile.role !== "driver") {
      setToken(null);
      setProfile(null);
      setBus(null);
      setPageState("denied");
      return;
    }
    setProfile(currentProfile);
    const busId = assignedBusId(currentProfile.assignedBus);
    if (!busId) {
      setBus(null);
      setPageState("ready");
      return;
    }
    try {
      const currentBus = await apiRequest(`/buses/${encodeURIComponent(busId)}`, { token: sessionToken });
      if (!isActive()) return;
      setBus(currentBus);
    } catch (error) {
      if (!isActive()) return;
      setBus(null);
      setPageMessage(error.message || "Assigned bus details could not be loaded.");
    }
    if (isActive()) setPageState("ready");
  }, []);

  useEffect(() => {
    let active = true;
    const sessionToken = readSessionToken("driver");
    setToken(sessionToken);
    if (!sessionToken) {
      setPageState("signed-out");
      return () => { active = false; };
    }
    setPageState("loading");
    setPageMessage("");
    reload(sessionToken, () => active).catch((error) => {
      if (!active) return;
      if (error.status === 401) {
        clearSessionToken("driver");
        setToken(null);
        setPageState("expired");
      } else {
        setPageState("error");
        setPageMessage(`${error.message || "Your driver profile could not be loaded."}${error.code ? ` (${error.code})` : ""}${error.requestId ? ` · Request ${error.requestId}` : ""}`);
      }
    });
    return () => { active = false; };
  }, [reload, refreshKey]);

  async function handleShiftAction(action) {
    if (!token) return;
    setWorking(true);
    setPageMessage("");
    try {
      const result = await apiRequest(`/buses/assigned/${action}-shift`, { method: "POST", token });
      if (action === "end") setLastShiftEndedAt(result?.endedAt || result?.shift?.endedAt || new Date().toISOString());
      else setLastShiftEndedAt(null);
      await reload(token);
    } catch (error) {
      if (error.status === 401) {
        clearSessionToken("driver");
        setToken(null);
        setProfile(null);
        setBus(null);
        setPageState("expired");
      } else {
        setPageMessage(error.message || `Could not ${action} your shift. Please try again.`);
      }
    } finally {
      setWorking(false);
    }
  }

  const loadDriverSeats = useCallback(async () => {
    if (!token || !activeShift) return;
    try { setSeatState(await apiRequest("/buses/assigned/seats", { token })); setSeatError(null); }
    catch (error) { setSeatError(error); }
  }, [token, activeShift]);

  async function seatAction(seatNumber, action) {
    if (!token || seatBusy) return;
    setSeatBusy(true);
    try {
      await apiRequest(action === "walk-in" ? "/buses/assigned/seats/walk-in" : `/buses/assigned/seats/${encodeURIComponent(seatNumber)}`, { method: action === "walk-in" ? "POST" : "PATCH", token, ...(action === "walk-in" ? {} : { body: JSON.stringify({ action }) }) });
      await loadDriverSeats();
    } catch (error) { setPageMessage(`${error.message || "Could not update that seat."}${error.code ? ` (${error.code})` : ""}`); }
    finally {
      setSeatBusy(false);
    }
  }

  function signOut() {
    void revokeAndClearSession("driver");
    setToken(null);
    setProfile(null);
    setBus(null);
    setPageState("signed-out");
    setPageMessage("");
  }

  const route = activeShift?.route || bus?.route;
  const hasBusAssignment = Boolean(assignedBusId(profile?.assignedBus) || activeShift?.bus?._id || bus?._id);
  const assignedBusName = activeShift?.bus?.busNumber || bus?.busNumber;

  useEffect(() => {
    if (!token || !activeShift || pageState !== "ready") { setSeatState({ seats: [], occupied: 0, capacity: 0 }); return undefined; }
    loadDriverSeats(); const timer = window.setInterval(loadDriverSeats, 5000);
    return () => window.clearInterval(timer);
  }, [token, activeShift?._id, pageState, loadDriverSeats]);

  useEffect(() => {
    if (!token || pageState !== "ready" || !activeShift) {
      setPassengerLocations([]);
      setLocationsState("idle");
      return undefined;
    }

    let mounted = true;
    setLocationsState("loading");
    setLocationsMessage("");
    apiRequest("/bookings/assigned/passenger-locations", { token })
      .then((locations) => {
        if (mounted) {
          setPassengerLocations(Array.isArray(locations) ? locations : []);
          setLocationsState("ready");
        }
      })
      .catch((error) => {
        if (mounted) {
          setLocationsState("error");
          setLocationsMessage(error.message || "Shared pickup locations could not be loaded.");
        }
      });

    const socket = io(backendOrigin, { auth: { token } });
    socket.on("connect", () => {
      socket.emit("watchDriverBookings", { token }, (result) => {
        if (mounted && !result?.ok) setLocationsMessage(result?.message || "Live location updates are unavailable.");
      });
    });
    socket.on("connect_error", () => {
      if (mounted) setLocationsMessage("Live updates are reconnecting. You can still refresh the location list.");
    });
    socket.on("driverSeatStateUpdate", (update) => { if (mounted) setSeatState(update); });
    socket.on("passengerLocationUpdate", (update) => {
      if (!mounted || !update?.bookingId) return;
      setPassengerLocations((current) => {
        const remaining = current.filter((item) => String(item.bookingId) !== String(update.bookingId));
        if (!update.sharing) return remaining;
        return [{
          bookingId: update.bookingId,
          passenger: update.passenger,
          pickupLocation: {
            latitude: update.latitude,
            longitude: update.longitude,
            accuracy: update.accuracy,
            timestamp: update.timestamp,
          },
        }, ...remaining];
      });
    });
    socket.on("passengerLocationAccessEnded", () => {
      if (!mounted) return;
      setPassengerLocations([]);
      setLocationsState("idle");
      setLocationsMessage("Your shift ended. Passenger location access has been stopped.");
    });

    return () => {
      mounted = false;
      socket.emit("unwatchDriverBookings");
      socket.disconnect();
    };
  }, [activeShift?._id, locationRefresh, pageState, token]);

  return (
    <main className="driver-scene workspace-theme relative isolate min-h-[70vh] bg-[#f4f5fb] px-4 py-8 text-[#25304f] sm:px-8 sm:py-12 lg:px-12">
      <div className="mx-auto w-full max-w-[1180px]">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#536bb7]">Driver workspace · Faisalabad</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#25304f] sm:text-4xl">Good day{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#68738e]">Check your assigned vehicle and control your current transit shift.</p></div>
          {pageState === "ready" && <ProfileMenu name={profile?.name} email={profile?.email} role="Driver" onSignOut={signOut} />}
        </div>

        {authState === "loading" && pageState !== "error" && <div className="mt-8 rounded-3xl border border-white bg-white p-6 text-sm text-[#68738e] shadow-sm" role="status">Loading your driver profile…</div>}
        {["signed-out", "expired", "denied"].includes(pageState) && <section className="mt-8 rounded-3xl border border-[#dfe3f1] bg-white p-6 shadow-[0_12px_36px_rgba(53,67,112,.08)] sm:p-8"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e9edff] text-xl text-[#536bb7]" aria-hidden="true">↗</span><h2 className="mt-5 text-xl font-semibold text-[#293553]">{pageState === "denied" ? "Driver access only" : pageState === "expired" ? "Your session expired" : "Sign in to manage your shift"}</h2><p className="mt-2 max-w-lg text-sm leading-6 text-[#74809a]">{pageState === "denied" ? "This account is not a driver account. Sign in with the driver credentials assigned by your administrator." : "Sign in with the email and password provided for your driver account. Your assigned bus and active shift will load automatically."}</p><Link href="/login" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#536bb7] px-5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#43599f]">Driver sign in <span className="ml-2" aria-hidden="true">→</span></Link></section>}

        {pageState === "error" && <section className="mt-8 rounded-3xl border border-[#f1c9c2] bg-[#fff8f6] p-6 sm:p-8"><h2 className="text-lg font-semibold text-[#7b433b]">Could not load your profile</h2><p className="mt-2 text-sm leading-6 text-[#9a6258]">{pageMessage}</p><button onClick={() => setRefreshKey((key) => key + 1)} className="mt-5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#536bb7] shadow-sm">Try again</button></section>}

        {pageState === "ready" && <>
          {pageMessage && <p role={pageMessage.includes("updated") ? "status" : "alert"} className={`mt-6 rounded-2xl border px-4 py-3 text-sm leading-5 ${pageMessage.includes("updated") ? "border-[#c9e9df] bg-[#effaf6] text-[#167b6e]" : "border-[#f1c9c2] bg-[#fff5f2] text-[#9a5146]"}`}>{pageMessage}</p>}
          <div className="mt-7 grid items-start gap-5 lg:grid-cols-[1.1fr_.9fr]">
            <section className="driver-glass rounded-[1.75rem] border border-white/70 p-5 shadow-[0_18px_48px_rgba(35,49,87,.13)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_56px_rgba(35,49,87,.19)] sm:p-7">
              <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#536bb7]">Assigned vehicle</p><h2 className="mt-2 text-2xl font-semibold text-[#293553]">{assignedBusName || (hasBusAssignment ? "Assigned bus" : "No bus assigned")}</h2><p className="mt-1 text-sm text-[#74809a]">{route?.routeName || (hasBusAssignment ? "Route details unavailable" : "Contact the transit administrator for a bus assignment.")}</p></div><span className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${activeShift ? "bg-[#e0f7ef] text-[#167b6e]" : "bg-white text-[#687697]"}`}>{activeShift ? "Shift active" : "Off shift"}</span></div>
              {hasBusAssignment && <div className="mt-6 grid gap-3 sm:grid-cols-2"><InfoCard label="Route" value={route?.routeName || "Not available"}/><InfoCard label="Direction" value={activeShift?.bus?.direction || bus?.direction || "Ready to start"}/><InfoCard label="Available seats" value={bus?.availableSeats != null ? `${bus.availableSeats}${bus.capacity != null ? ` / ${bus.capacity}` : ""}` : "—"}/><InfoCard label="Bus status" value={bus?.status || activeShift?.bus?.status || "—"}/></div>}
              {activeShift && <div className="mt-5 rounded-2xl border border-[#dfe6f8] bg-gradient-to-r from-white to-[#f0f3ff] p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#7181ad]">Shift timer</p><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-medium text-[#74809a]">Started {timeLabel(activeShift.startedAt)}</p><p className="mt-1 font-mono text-2xl font-bold tracking-tight text-[#405ba7]">{elapsedLabel(activeShift.startedAt, shiftClock)}</p></div><span className="rounded-full bg-[#e0f7ef] px-2.5 py-1 text-[10px] font-semibold capitalize text-[#167b6e]">{activeShift.startDirection || "outbound"} journey · running</span></div></div>}
              {!activeShift && lastShiftEndedAt && <div className="mt-5 rounded-2xl border border-[#dfe6f8] bg-[#f7f8fc] p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#7181ad]">Last shift ended</p><p className="mt-1 text-sm font-semibold text-[#34405d]">{timeLabel(lastShiftEndedAt)}</p></div>}
              {activeShift && <section className="mt-5 rounded-2xl border border-[#dfe6f8] bg-gradient-to-br from-[#f5f7ff] to-white p-4 sm:p-5">{seatError && <div role="alert" className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">Seat map could not load{seatError.code ? ` (${seatError.code})` : ""}: {seatError.message} <button type="button" onClick={() => loadDriverSeats()} className="ml-2 font-bold underline">Retry</button></div>}<div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#7181ad]">Live seat map</p><p className="mt-1 text-xl font-bold text-[#293553]">{seatState.occupied || 0} / {seatState.capacity || bus?.capacity || 0} occupied</p></div><button type="button" disabled={seatBusy} onClick={() => seatAction(null,"walk-in")} className="min-h-12 rounded-xl bg-gradient-to-r from-[#263a70] to-[#536bb7] px-5 text-sm font-bold text-white shadow-md disabled:opacity-50">+ Walk-in</button></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{(seatState.seats || []).map(seat => <article key={seat.seatNumber} className={`rounded-xl border p-2 text-center text-xs ${seat.status === "available" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : seat.status === "reserved" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-rose-200 bg-rose-50 text-rose-900"}`}><strong>{seat.seatNumber}</strong><span className="mt-1 block text-[9px] capitalize">{seat.status}</span>{seat.passengerName && <span className="block truncate text-[9px]">{seat.passengerName}{seat.shareLocation ? " · 📍" : ""}</span>}{seat.status === "reserved" ? <div className="mt-2 flex justify-center gap-1"><button type="button" disabled={seatBusy} onClick={() => seatAction(seat.seatNumber,"board")} className="rounded bg-white px-2 py-1 text-[9px] font-semibold">Mark boarded</button><button type="button" disabled={seatBusy} onClick={() => seatAction(seat.seatNumber,"no_show")} className="rounded bg-white px-2 py-1 text-[9px] font-semibold">No-show</button></div> : <button type="button" disabled={seatBusy} onClick={() => seatAction(seat.seatNumber,seat.status === "occupied" ? "release" : "occupy")} className="mt-2 rounded bg-white px-2 py-1 text-[9px] font-semibold">{seat.status === "occupied" ? "Passenger got off" : "Mark occupied"}</button>}</article>)}</div><p className="mt-2 text-[10px] text-[#8992a8]">Available · Reserved · Occupied. All seat totals are calculated from the seat map.</p></section>}
            </section>

            <section className="driver-glass rounded-[1.75rem] border border-white/70 p-5 shadow-[0_18px_48px_rgba(35,49,87,.13)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_56px_rgba(35,49,87,.19)] sm:p-7">
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#536bb7]">Shift controls</p><h2 className="mt-2 text-xl font-semibold text-[#293553]">{activeShift ? "Your shift is underway" : "Ready to go?"}</h2><p className="mt-2 text-sm leading-6 text-[#74809a]">{activeShift ? "End your shift when you have finished service. The bus will be marked idle." : hasBusAssignment ? "Start your shift when you are ready to begin service with your assigned bus." : "A bus assignment is required before you can start a shift."}</p>
              {pageMessage && !pageMessage.includes("updated") && <p role="alert" className="mt-4 rounded-xl border border-[#f1c9c2] bg-[#fff5f2] px-3.5 py-3 text-xs leading-5 text-[#9a5146]">{pageMessage}</p>}
              {activeShift ? <button onClick={() => handleShiftAction("end")} disabled={working} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#b94745] px-5 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(185,71,69,.18)] transition hover:-translate-y-0.5 hover:bg-[#a43c3a] disabled:cursor-wait disabled:opacity-60">{working ? "Ending shift…" : "End shift"}<span aria-hidden="true">■</span></button> : <button onClick={() => handleShiftAction("start")} disabled={working || !hasBusAssignment} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#536bb7] px-5 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(83,107,183,.18)] transition hover:-translate-y-0.5 hover:bg-[#43599f] disabled:cursor-not-allowed disabled:opacity-50">{working ? "Starting shift…" : "Start shift"}<span aria-hidden="true">▶</span></button>}
              <p className="mt-4 text-[11px] leading-5 text-[#8992a8]">Shift status is saved by the transit server and restored when you sign back in.</p>
            </section>
          </div>
          <section className="driver-glass mt-5 rounded-[1.75rem] border border-white/70 p-5 shadow-[0_18px_48px_rgba(35,49,87,.13)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_56px_rgba(35,49,87,.19)] sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#536bb7]">Opt-in trip safety</p><h2 className="mt-2 text-xl font-semibold text-[#293553]">Passenger pickup locations</h2></div><div className="flex items-center gap-2">{activeShift && <button type="button" onClick={() => setLocationRefresh((value) => value + 1)} className="min-h-8 rounded-lg border border-[#dce2f1] bg-white px-3 text-[10px] font-semibold text-[#536bb7]">Refresh</button>}<span className="rounded-full bg-[#e9edff] px-3 py-1.5 text-[10px] font-semibold text-[#536bb7]">{activeShift ? `${passengerLocations.length} sharing` : "Shift required"}</span></div></div>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-[#74809a]">Only passengers who chose to share their location for a confirmed booking on your active bus and route appear here. Updates stop when they turn sharing off or your shift ends.</p>
            {!activeShift && <p className="mt-4 rounded-xl bg-[#f6f7fb] p-4 text-xs text-[#74809a]">Start your assigned shift to view any pickup locations shared with you.</p>}
            {activeShift && locationsState === "loading" && <p role="status" className="mt-4 rounded-xl bg-[#f6f7fb] p-4 text-xs text-[#74809a]">Loading shared locations…</p>}
            {activeShift && locationsState === "error" && <div role="alert" className="mt-4 rounded-xl bg-[#fff5f2] p-4 text-xs text-[#9a5146]">{locationsMessage}<button onClick={() => setRefreshKey((key) => key + 1)} className="ml-2 font-semibold underline">Refresh</button></div>}
            {activeShift && locationsMessage && locationsState === "ready" && <p role="status" className="mt-3 text-[10px] text-[#8992a8]">{locationsMessage}</p>}
            {activeShift && locationsState === "ready" && passengerLocations.length === 0 && <p className="mt-4 rounded-xl bg-[#f6f7fb] p-4 text-xs text-[#74809a]">No passengers are sharing a pickup location right now.</p>}
            {activeShift && locationsState === "ready" && passengerLocations.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2">{passengerLocations.map((item) => {
              const point = item.pickupLocation || {};
              const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(`${point.latitude},${point.longitude}`)}`;
              return <article key={item.bookingId} className="rounded-2xl border border-[#e9ecf5] bg-[#fbfcff] p-4"><p className="text-sm font-semibold text-[#34405d]">{item.passenger?.name || "Passenger"}</p><p className="mt-1 text-xs text-[#74809a]">Pickup point · {Number(point.latitude).toFixed(5)}, {Number(point.longitude).toFixed(5)}</p><p className="mt-1 text-[10px] text-[#8992a8]">Updated {timeLabel(point.timestamp)}{point.accuracy != null ? ` · ±${Math.round(point.accuracy)} m` : ""}</p><a href={mapUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-9 items-center rounded-lg bg-[#536bb7] px-3 text-[10px] font-semibold text-white hover:bg-[#43599f]">Open map ↗</a></article>;
            })}</div>}
          </section>
        </>}
      </div>
    </main>
  );
}

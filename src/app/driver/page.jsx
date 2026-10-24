"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { subscribeDriverBookings } from "@/lib/realtime";
import usePolling from "@/lib/usePolling";
import { apiRequest } from "@/lib/api";
import { clearSessionToken, revokeAndClearSession } from "@/lib/session";
import ProfileMenu from "@/components/layout/ProfileMenu";
import { useAuth } from "@/lib/auth/AuthProvider";
import useDriverTracking from "@/features/driver/useDriverTracking";
import BottomSheet from "@/components/app/BottomSheet";
import DriverSeatMap from "@/components/driver/DriverSeatMap";
import { useAppRefresh } from "@/components/app/AppRefreshContext";
import HeroCard from "@/components/ui/brand/HeroCard";
import Surface from "@/components/ui/brand/Surface";



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

function ShiftTimer({ startedAt }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return elapsedLabel(startedAt, now);
}

function InfoCard({ label, value }) {
  return <div className="rounded-2xl border border-white bg-white/85 p-4 shadow-[0_8px_24px_rgba(53,67,112,.05)]"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#8992a8]">{label}</p><p className="mt-2 break-words text-sm font-semibold text-[#34405d]">{value || "—"}</p></div>;
}

export function DriverHomePage({ mobile = false }) {
  const auth = useAuth();
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
  const [seatNotice, setSeatNotice] = useState("");
  const [highlightedSeat, setHighlightedSeat] = useState(null);
  const [undoSeatAction, setUndoSeatAction] = useState(null);
  const [lastShiftEndedAt, setLastShiftEndedAt] = useState(null);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [mobileSeatMapOpen, setMobileSeatMapOpen] = useState(false);
  const undoTimer = useRef(null);
  const highlightTimer = useRef(null);
  const activeShift = profile?.activeShift;
  const authState = pageState === "ready" ? "authenticated" : ["signed-out", "expired", "denied"].includes(pageState) ? "unauthenticated" : "loading";

  useEffect(() => {
    const handleExpired = (event) => { if (event.detail?.role === "driver") { setToken(null); setProfile(null); setBus(null); setPageState("expired"); } };
    window.addEventListener("smart-safar:auth-expired", handleExpired);
    return () => window.removeEventListener("smart-safar:auth-expired", handleExpired);
  }, []);

  const reload = useCallback(async (sessionToken, isActive = () => true, refreshProfile = false) => {
    const currentProfile = refreshProfile ? await auth.refreshAuth() : auth.user;
    if (!isActive()) return;
    if (auth.role !== "driver" || !currentProfile) {
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
  }, [auth.refreshAuth, auth.role, auth.user]);

  useEffect(() => {
    let active = true;
    if (auth.status === "loading" || (auth.status === "authenticated" && !auth.validated)) return () => { active = false; };
    const sessionToken = auth.status === "authenticated" && auth.role === "driver" ? auth.token : null;
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
  }, [auth.status, auth.validated, auth.role, auth.token, reload, refreshKey]);

  async function handleShiftAction(action) {
    if (!token) return;
    setWorking(true);
    setPageMessage("");
    try {
      const result = await apiRequest(`/buses/assigned/${action}-shift`, { method: "POST", token });
      if (action === "end") setLastShiftEndedAt(result?.endedAt || result?.shift?.endedAt || new Date().toISOString());
      else setLastShiftEndedAt(null);
      await reload(token, () => true, true);
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
    if (!token || !activeShift) return null;
    try { const latest = await apiRequest("/buses/assigned/seats", { token }); setSeatState(latest); setSeatError(null); return latest; }
    catch (error) { setSeatError({ message: seatErrorMessage(error), code: error?.code || null }); return null; }
  }, [token, activeShift]);
  const refreshDriverData = useCallback(() => token ? Promise.all([reload(token, () => true, true), loadDriverSeats()]) : Promise.resolve(), [loadDriverSeats, reload, token]);
  useAppRefresh(refreshDriverData);
  usePolling(loadDriverSeats, 30000, { enabled: Boolean(token && activeShift && pageState === "ready") });

  function seatErrorMessage(error) {
    const messages = {
      SHIFT_NOT_OPEN: "Your shift has ended. Open an active shift to change seats.",
      SEAT_STATE_CONFLICT: "This seat changed just now. The seat map has been refreshed.",
      NO_SEATS_AVAILABLE: "No seats are available for a walk-in.",
      SEAT_NOT_FOUND: "That seat was not found. The seat map has been refreshed.",
    };
    return messages[error?.code] || error?.message || "Could not update that seat.";
  }

  async function seatAction(seatNumbers, action, { recordUndo = true } = {}) {
    if (!token || seatBusy) return [];
    setSeatError(null);
    setSeatNotice("");
    setSeatBusy(true);
    try {
      if (action === "walk-in") {
        const result = await apiRequest("/buses/assigned/seats/walk-in", { method: "POST", token });
        const assignedNumber = result?.seat?.seatNumber;
        await loadDriverSeats();
        if (assignedNumber != null) {
          setSeatNotice(`Walk-in assigned to seat ${assignedNumber}.`);
          setHighlightedSeat(assignedNumber);
          window.clearTimeout(highlightTimer.current);
          highlightTimer.current = window.setTimeout(() => setHighlightedSeat(null), 2500);
        }
        return [];
      }

      const numbers = [...new Set(seatNumbers || [])];
      const previousStatuses = new Map(seatState.seats.map((seat) => [Number(seat.seatNumber), seat.status]));
      const nextStatus = { occupy: "occupied", board: "occupied", release: "available", no_show: "available" }[action];
      const delta = action === "occupy" || action === "board" ? 1 : action === "release" ? -1 : 0;
      const changedCount = numbers.filter((number) => seatState.seats.some((seat) => Number(seat.seatNumber) === number && seat.status !== nextStatus)).length;
      setSeatState((current) => {
        const nextSeats = current.seats.map((seat) => numbers.includes(Number(seat.seatNumber)) ? { ...seat, status: nextStatus } : seat);
        return { ...current, occupied: Math.max(0, Number(current.occupied || 0) + delta * changedCount), seats: nextSeats };
      });
      const results = await Promise.allSettled(numbers.map((seatNumber) => apiRequest(`/buses/assigned/seats/${encodeURIComponent(seatNumber)}`, { method: "PATCH", token, body: JSON.stringify({ action }) })));
      const failed = numbers.filter((_, index) => results[index].status === "rejected");
      const succeeded = numbers.filter((_, index) => results[index].status === "fulfilled");
      const latest = await loadDriverSeats();
      if (!latest) {
        setSeatState((current) => {
          const nextSeats = current.seats.map((seat) => failed.includes(Number(seat.seatNumber)) && previousStatuses.has(Number(seat.seatNumber)) ? { ...seat, status: previousStatuses.get(Number(seat.seatNumber)) } : seat);
          return { ...current, occupied: nextSeats.filter((seat) => seat.status === "occupied").length, seats: nextSeats };
        });
      }
      const inverse = { occupy: "release", release: "occupy" }[action];
      if (recordUndo && succeeded.length && inverse) {
        window.clearTimeout(undoTimer.current);
        setUndoSeatAction({ seatNumbers: succeeded, action: inverse, label: "last change" });
        undoTimer.current = window.setTimeout(() => setUndoSeatAction(null), 5000);
      }
      if (failed.length) {
        const firstFailure = results[numbers.findIndex((number) => failed.includes(number))];
        const cause = firstFailure?.reason;
        const failureSeatNumber = failed[0];
        const failureText = `Seat ${failureSeatNumber}: ${seatErrorMessage(cause)}`;
        setSeatError({ message: `${succeeded.length} updated, ${failed.length} failed: ${failureText}`, code: cause?.code || null });
      } else if (succeeded.length) {
        setSeatNotice(`${succeeded.length} seat${succeeded.length === 1 ? "" : "s"} updated.`);
      }
      return failed;
    } catch (error) {
      const message = seatErrorMessage(error);
      setSeatError({ message, code: error?.code || null });
      return seatNumbers || [];
    }
    finally {
      setSeatBusy(false);
    }
  }

  useEffect(() => () => { window.clearTimeout(undoTimer.current); window.clearTimeout(highlightTimer.current); }, []);

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
  const trackingBusId = activeShift?.bus?._id || assignedBusId(profile?.assignedBus) || bus?._id;
  const tracking = useDriverTracking({ busId: trackingBusId, token, enabled: Boolean(token && activeShift && pageState === "ready") });

  useEffect(() => {
    if (!token || !activeShift || pageState !== "ready") { setSeatState({ seats: [], occupied: 0, capacity: 0 }); return undefined; }
    loadDriverSeats();
    return undefined;
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

    const cleanups = subscribeDriverBookings(token, {
    driverSeatStateUpdate: (update) => { if (mounted) setSeatState((current) => ({ ...update, seats: (update.seats || []).map((seat) => { const previous = current.seats.find((item) => String(item.seatNumber) === String(seat.seatNumber)); return seat.status === "reserved" && previous?.status === "reserved" ? { ...seat, passengerName: previous.passengerName, shareLocation: previous.shareLocation } : seat; }) })); },
    passengerLocationUpdate: (update) => {
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
    },
    passengerLocationAccessEnded: () => {
      if (!mounted) return;
      setPassengerLocations([]);
      setLocationsState("idle");
      setLocationsMessage("Your shift ended. Passenger location access has been stopped.");
    },
    });

    return () => {
      mounted = false;
      cleanups();
    };
  }, [activeShift?._id, locationRefresh, pageState, token]);

  if (mobile) {
    if (authState === "loading" || pageState === "loading") return <div className="app-screen"><div role="status" className="app-empty animate-pulse">Loading your driver shift…</div></div>;
    if (pageState !== "ready") return <div className="app-screen"><section className="app-card p-5"><h2 className="text-lg font-bold">{pageState === "denied" ? "Driver access only" : pageState === "expired" ? "Your session expired" : "Sign in to manage your shift"}</h2><p className="app-muted mt-2">{pageMessage || "Use the driver account assigned by your administrator."}</p><Link href="/m/login?returnTo=%2Fm%2Fdriver" className="app-primary mt-4 w-full">Driver sign in</Link></section></div>;
    const nextStop = (route?.stops || []).slice().sort((a,b) => (Number(a.stopOrder)||0)-(Number(b.stopOrder)||0))[0]?.stopName;
    return <div className="app-screen space-y-4">
      <HeroCard eyebrow={activeShift ? "On shift" : "Driver shift"} title={activeShift ? "You’re on shift" : "Ready to drive?"} description={activeShift ? `Started ${timeLabel(activeShift.startedAt)}` : "Start your assigned route when you’re ready."} className="p-5">{activeShift && <p className="mt-3 font-mono text-3xl font-bold text-aqua"><ShiftTimer startedAt={activeShift.startedAt}/></p>}<button type="button" disabled={working || (!activeShift && !hasBusAssignment)} onClick={() => { if (activeShift && !window.confirm("End your current shift?")) return; void handleShiftAction(activeShift ? "end" : "start"); }} className={`mt-4 min-h-12 w-full rounded-full text-sm font-bold text-white shadow-lg disabled:opacity-50 ${activeShift ? "bg-[#b95750]" : "bg-transit-500"}`}>{working ? "Updating shift…" : activeShift ? "End shift" : hasBusAssignment ? "Start shift" : "No bus assigned"}</button></HeroCard>
      {pageMessage && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{pageMessage}</p>}
      <Surface as="section" className="p-4"><div className="flex items-center justify-between"><div><p className="app-eyebrow">Assigned service</p><h3 className="mt-1 text-base font-bold text-[#34405d]">{assignedBusName || "No bus assigned"}</h3><p className="mt-1 text-xs text-[#77829a]">{route?.routeName || "Route not assigned"}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${activeShift ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{activeShift ? "Active" : "Idle"}</span></div><div className="mt-3 flex items-center justify-between border-t border-[#edf0f6] pt-3 text-xs"><span className="text-[#77829a]">GPS status</span><strong className={tracking.status === "Good" ? "text-emerald-700" : tracking.status === "Permission denied" ? "text-rose-700" : "text-amber-700"}>{tracking.status}</strong></div>{nextStop && <p className="mt-2 text-xs text-[#77829a]">Next stop · <strong className="text-[#34405d]">{nextStop}</strong></p>}<button onClick={() => setMobileDetailsOpen(true)} className="mt-3 min-h-11 w-full rounded-xl bg-[#f2f4fb] text-xs font-semibold text-[#536bb7]">View shift details</button></Surface>
      {activeShift && <Surface as="section" className="p-4"><div className="flex items-center justify-between gap-3"><div className="min-w-0 flex-1"><h3 className="text-sm font-bold text-[#34405d]">Live seats</h3><p className="mt-1 truncate text-xs text-[#77829a]">{seatState.occupied || 0} / {seatState.capacity || bus?.capacity || 0} occupied · {(seatState.seats || []).filter((seat) => seat.status === "reserved").length} reserved</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e9edf6]"><span className="block h-full rounded-full bg-[#536bb7] transition-[width]" style={{ width: `${Math.min(100, 100 * (seatState.occupied || 0) / Math.max(1, seatState.capacity || bus?.capacity || 1))}%` }}/></div></div><button type="button" disabled={seatBusy} onClick={() => void seatAction(null, "walk-in")} className="app-secondary min-h-11 shrink-0">＋ Walk-in</button></div>{seatError && <p role="alert" className="mt-2 text-[10px] text-rose-700">{seatError.message} <button onClick={() => void loadDriverSeats()} className="font-bold underline">Retry</button></p>}<button type="button" onClick={() => setMobileSeatMapOpen(true)} className="mt-3 min-h-11 w-full rounded-xl bg-[#f2f4fb] text-xs font-semibold text-[#536bb7]">Open seat map →</button></Surface>}
      <BottomSheet open={mobileSeatMapOpen} title="Live seat map" fullHeight onClose={() => { setMobileSeatMapOpen(false); setUndoSeatAction(null); setSeatNotice(""); void loadDriverSeats(); }}>
        <DriverSeatMap seats={seatState.seats} occupied={seatState.occupied || 0} capacity={seatState.capacity || bus?.capacity || 0} busy={seatBusy} error={seatError} notice={seatNotice} highlightedSeat={highlightedSeat} undoLabel={undoSeatAction?.label || ""} onAction={seatAction} onWalkIn={() => void seatAction(null, "walk-in")} onRetry={() => void loadDriverSeats()} onUndo={() => { if (!undoSeatAction) return; const undo = undoSeatAction; setUndoSeatAction(null); void seatAction(undo.seatNumbers, undo.action, { recordUndo: false }); }}/>
      </BottomSheet>
      <BottomSheet open={mobileDetailsOpen} title="Shift details" onClose={() => setMobileDetailsOpen(false)}><div className="space-y-3 text-sm text-[#596681]"><p><strong>Bus:</strong> {assignedBusName || "Unassigned"}</p><p><strong>Route:</strong> {route?.routeName || "Not assigned"}</p><p><strong>GPS:</strong> {tracking.status}{tracking.lastSentSeconds != null ? ` · updated ${tracking.lastSentSeconds}s ago` : ""}</p><p><strong>Seats occupied:</strong> {seatState.occupied || 0}/{seatState.capacity || bus?.capacity || 0}</p><Link href="/live-map" className="app-primary w-full">Open live map</Link>{activeShift && <button onClick={() => setLocationRefresh((value)=>value+1)} className="app-secondary w-full">Refresh shared pickup locations</button>}{locationsState === "error" && <p role="alert" className="text-xs text-rose-700">{locationsMessage}</p>}{passengerLocations.slice(0,5).map((item)=><p key={item.bookingId} className="rounded-xl bg-[#f6f7fb] p-3 text-xs">{item.passenger?.name || "Passenger"} · pickup shared for this trip</p>)}</div></BottomSheet>
    </div>;
  }

  return (
    <main className="driver-scene workspace-theme relative isolate min-h-[70vh] bg-[#f4f5fb] px-4 py-8 text-[#25304f] sm:px-8 sm:py-12 lg:px-12">
      <div className="mx-auto w-full max-w-[1180px]">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#536bb7]">Driver workspace · Faisalabad</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#25304f] sm:text-4xl">Good day{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#68738e]">Check your assigned vehicle and control your current transit shift.</p></div>
          {pageState === "ready" && <ProfileMenu name={profile?.name} email={profile?.email} role="Driver" homeHref="/driver" homeLabel="Open dashboard" onSignOut={signOut} />}
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
              {activeShift && <div className="mt-5 rounded-2xl border border-[#dfe6f8] bg-gradient-to-r from-white to-[#f0f3ff] p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#7181ad]">Shift timer</p><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-medium text-[#74809a]">Started {timeLabel(activeShift.startedAt)}</p><p className="mt-1 font-mono text-2xl font-bold tracking-tight text-[#405ba7]"><ShiftTimer startedAt={activeShift.startedAt} /></p></div><span className="rounded-full bg-[#e0f7ef] px-2.5 py-1 text-[10px] font-semibold capitalize text-[#167b6e]">{activeShift.startDirection || "outbound"} journey · running</span></div><div className="mt-4 border-t border-[#e4e9f5] pt-3"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${tracking.status === "Good" ? "bg-[#e0f7ef] text-[#167b6e]" : tracking.status === "Weak" ? "bg-amber-50 text-amber-800" : tracking.status === "Permission denied" ? "bg-rose-50 text-rose-700" : tracking.status === "Offline" ? "bg-slate-100 text-slate-700" : "bg-[#eef1fc] text-[#536bb7]"}`}>GPS · {tracking.status}</span><span className="text-[11px] text-[#74809a]">{tracking.lastSentSeconds == null ? "Waiting for first position" : `Last sent ${tracking.lastSentSeconds} s ago`}{tracking.lastAccuracy != null ? ` · ±${Math.round(tracking.lastAccuracy)} m` : ""}</span></div><p className="mt-2 text-[11px] leading-5 text-[#74809a]">Keep Smart Safar open for the most reliable location updates. Browsers may pause GPS when the app is in the background or the screen is off.</p>{tracking.status === "Permission denied" && <div role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-800"><strong>Allow location access to share your bus position.</strong><p className="mt-1">Open your browser’s site settings, change Location to Allow, return to this page, and restart your shift.</p></div>}{tracking.errorMessage && tracking.status !== "Permission denied" && tracking.status !== "Offline" && <p role="status" className="mt-2 text-[11px] leading-5 text-[#9a6258]">{tracking.errorMessage}</p>}</div></div>}
              {!activeShift && lastShiftEndedAt && <div className="mt-5 rounded-2xl border border-[#dfe6f8] bg-[#f7f8fc] p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#7181ad]">Last shift ended</p><p className="mt-1 text-sm font-semibold text-[#34405d]">{timeLabel(lastShiftEndedAt)}</p></div>}
              {activeShift && <div className="mt-5"><DriverSeatMap seats={seatState.seats} occupied={seatState.occupied || 0} capacity={seatState.capacity || bus?.capacity || 0} busy={seatBusy} error={seatError} notice={seatNotice} highlightedSeat={highlightedSeat} undoLabel={undoSeatAction?.label || ""} onAction={seatAction} onWalkIn={() => void seatAction(null, "walk-in")} onRetry={() => void loadDriverSeats()} onUndo={() => { if (!undoSeatAction) return; const undo = undoSeatAction; setUndoSeatAction(null); void seatAction(undo.seatNumbers, undo.action, { recordUndo: false }); }}/></div>}
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

export default DriverHomePage;

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { clearSessionToken, readSessionToken } from "@/lib/session";
import ProfileMenu from "@/components/layout/ProfileMenu";

const initialData = { overview: null, buses: [], routes: [], drivers: [], shifts: [], adminBookings: [], reportItems: [], stopsByRoute: {}, alertsByRoute: {} };
const endpointsByTab = {
  overview: [["overview", "/admin/overview"]],
  drivers: [["drivers", "/admin/drivers"], ["shifts", "/admin/shifts"], ["buses", "/buses"]],
  routes: [["routes", "/routes"], ["buses", "/buses"], ["shifts", "/admin/shifts"]],
  bookings: [["adminBookings", "/admin/bookings"]],
  buses: [["buses", "/buses"], ["routes", "/routes"], ["drivers", "/admin/drivers"]],
  reports: [["reportItems", "/reports"]],
};

function idOf(value) { return typeof value === "object" && value ? value._id : value; }
function dateLabel(value) { return value ? new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Karachi" }).format(new Date(value)) : "—"; }
function dayLabel(value) { return value ? new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(`${value}T12:00:00`)) : "—"; }

function SectionTitle({ eyebrow, title, action }) {
  return <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.19em] text-[#536bb7]">{eyebrow}</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-[#293553]">{title}</h2></div>{action}</div>;
}

function MetricCard({ label, value, note, color = "blue" }) {
  const styles = color === "green" ? "bg-[#e4f8f0] text-[#16866f]" : color === "orange" ? "bg-[#fff0e5] text-[#c36a30]" : color === "red" ? "bg-[#fff0ef] text-[#b94745]" : "bg-[#e9edff] text-[#536bb7]";
  return <article className="rounded-2xl border border-white bg-white p-4 shadow-[0_8px_24px_rgba(53,67,112,.05)] sm:p-5"><p className="text-xs font-medium text-[#74809a]">{label}</p><div className="mt-3 flex items-end justify-between gap-2"><p className="text-3xl font-semibold tracking-tight text-[#293553]">{value ?? "—"}</p><span className={`rounded-lg px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${styles}`}>{note}</span></div></article>;
}

function Field({ label, ...props }) {
  return <label className="block min-w-0"><span className="mb-1.5 block text-[11px] font-semibold text-[#596681]">{label}</span><input {...props} className={`min-h-10 w-full rounded-xl border border-[#dfe3f1] bg-white px-3 text-sm text-[#293553] outline-none transition placeholder:text-[#a1a9bc] focus:border-[#8093d1] focus:ring-4 focus:ring-[#536bb7]/10 ${props.className || ""}`} /></label>;
}

function SelectField({ label, children, ...props }) {
  return <label className="block min-w-0"><span className="mb-1.5 block text-[11px] font-semibold text-[#596681]">{label}</span><select {...props} className="min-h-10 w-full rounded-xl border border-[#dfe3f1] bg-white px-3 text-sm text-[#293553] outline-none transition focus:border-[#8093d1] focus:ring-4 focus:ring-[#536bb7]/10">{children}</select></label>;
}

export default function AdminHomePage() {
  const [token, setToken] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [sessionState, setSessionState] = useState("loading");
  const [data, setData] = useState(initialData);
  const [dataErrors, setDataErrors] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [driverForm, setDriverForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [driverEditId, setDriverEditId] = useState("");
  const [driverEditForm, setDriverEditForm] = useState({ name: "", email: "", phone: "" });
  const [busForm, setBusForm] = useState({ busNumber: "", route: "", capacity: "", driver: "" });
  const [routeForm, setRouteForm] = useState({ routeName: "", startPoint: "", endPoint: "", description: "" });
  const [stopForm, setStopForm] = useState({ route: "", stopName: "", latitude: "", longitude: "", stopOrder: "" });
  const [alertForm, setAlertForm] = useState({ route: "", message: "", severity: "info", expiresAt: "" });
  const [bookingFilter, setBookingFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [loadingTab, setLoadingTab] = useState("");
  const [routeDetailsLoading, setRouteDetailsLoading] = useState(false);
  const profileVerifiedRef = useRef(false);
  const loadedTabsRef = useRef(new Set());

  useEffect(() => {
    const syncTab = () => setActiveTab((window.location.hash || "#overview").slice(1));
    syncTab();
    window.addEventListener("hashchange", syncTab);
    return () => window.removeEventListener("hashchange", syncTab);
  }, []);

  const loadData = useCallback(async (sessionToken, isActive = () => true, tab = "overview") => {
    setLoadingTab(tab);
    if (!profileVerifiedRef.current) {
      const profile = await apiRequest("/auth/profile", { token: sessionToken });
      if (!isActive()) return;
      if (profile.role !== "admin") {
        setToken(null); setAdmin(null); setSessionState("denied"); setLoadingTab(""); return;
      }
      setAdmin(profile);
      profileVerifiedRef.current = true;
    }
    const results = await Promise.all((endpointsByTab[tab] || endpointsByTab.overview).map(async ([key, path]) => {
      try { return { key, value: await apiRequest(path, { token: sessionToken }) }; }
      catch (error) { return { key, error }; }
    }));
    if (!isActive()) return;
    const values = {};
    const errors = [];
    results.forEach(({ key, value, error }) => {
      if (error) { errors.push({ key, message: error.message }); return; }
      values[key] = value;
    });
    setData((current) => ({ ...current, ...values }));
    setDataErrors(errors);
    loadedTabsRef.current.add(tab);
    setLoadingTab("");
    setSessionState("ready");
  }, []);
  useEffect(() => {
    let active = true;
    const sessionToken = readSessionToken("admin");
    setToken(sessionToken);
    if (!sessionToken) { setSessionState("signed-out"); return () => { active = false; }; }
    setSessionState("loading");
    loadedTabsRef.current.clear();
    setData((current) => ({ ...current, stopsByRoute: {}, alertsByRoute: {} }));
    const firstTab = (window.location.hash || "#overview").slice(1);
    loadData(sessionToken, () => active, firstTab).catch((error) => {
      if (!active) return;
      if (error.status === 401) { clearSessionToken("admin"); setToken(null); setSessionState("expired"); }
      else { setSessionState("error"); setNotice({ type: "error", text: error.message || "Could not load the administrator profile." }); }
    });
    return () => { active = false; };
  }, [loadData, refreshKey]);

  useEffect(() => {
    if (sessionState !== "ready" || !token || loadedTabsRef.current.has(activeTab)) return undefined;
    let active = true;
    loadData(token, () => active, activeTab).catch((error) => {
      if (!active) return;
      setLoadingTab("");
      setNotice({ type: "error", text: error.message || "Could not load selected tab data." });
    });
    return () => { active = false; };
  }, [activeTab, sessionState, token, loadData]);
  useEffect(() => {
    if (sessionState !== "ready" || activeTab !== "routes" || !token || data.routes.length === 0) return undefined;
    let active = true;
    const routeList = data.routes;
    if (routeList.every((route) => Object.prototype.hasOwnProperty.call(data.stopsByRoute, route._id) && Object.prototype.hasOwnProperty.call(data.alertsByRoute, route._id))) return undefined;
    setRouteDetailsLoading(true);
    async function loadRouteDetails() {
      const [stopResults, alertResults] = await Promise.all([
        Promise.all(routeList.map(async (route) => {
          try { return { routeId: route._id, value: await apiRequest(`/stops/route/${encodeURIComponent(route._id)}`, { token }) }; }
          catch (error) { return { routeId: route._id, value: [], error }; }
        })),
        Promise.all(routeList.map(async (route) => {
          try { return { routeId: route._id, value: await apiRequest(`/route-alerts/route/${encodeURIComponent(route._id)}`, { token }) }; }
          catch (error) { return { routeId: route._id, value: [], error }; }
        })),
      ]);
      if (!active) return;
      const stopsByRoute = Object.fromEntries(stopResults.map(({ routeId, value }) => [routeId, Array.isArray(value) ? value : []]));
      const alertsByRoute = Object.fromEntries(alertResults.map(({ routeId, value }) => [routeId, Array.isArray(value) ? value : []]));
      setData((current) => ({ ...current, stopsByRoute, alertsByRoute }));
      setRouteDetailsLoading(false);
      const detailErrors = [...stopResults, ...alertResults].filter((item) => item.error).map((item) => ({ key: `route details: ${item.routeId}`, message: item.error.message }));
      setDataErrors((current) => [...current.filter((item) => !item.key.startsWith("route details:")), ...detailErrors]);
    }
    loadRouteDetails();
    return () => { active = false; };
  }, [activeTab, sessionState, token, data.routes, data.stopsByRoute, data.alertsByRoute]);
  async function mutate(action, successText) {
    if (!token || busy) return false;
    setBusy(true); setNotice(null);
    try {
      await action();
      setNotice({ type: "success", text: successText });
      setRefreshKey((key) => key + 1);
      return true;
    } catch (error) {
      if (error.status === 401) {
        try { await apiRequest("/auth/profile", { token }); }
        catch (profileError) { if (profileError.status === 401) { clearSessionToken("admin"); setToken(null); setAdmin(null); setSessionState("expired"); } }
      }
      setNotice({ type: "error", text: error.message || "The change could not be saved. Please try again." });
      return false;
    } finally { setBusy(false); }
  }

  async function createDriver(event) {
    event.preventDefault();
    const saved = await mutate(() => apiRequest("/admin/drivers", { method: "POST", token, body: JSON.stringify(driverForm) }), "Driver account created. You can assign a bus below.");
    if (saved) setDriverForm({ name: "", email: "", phone: "", password: "" });
  }

  async function saveDriverEdits(event) {
    event.preventDefault();
    if (!driverEditId) return;
    await mutate(() => apiRequest(`/admin/drivers/${encodeURIComponent(driverEditId)}`, { method: "PUT", token, body: JSON.stringify(driverEditForm) }), "Driver account updated.");
  }

  async function assignDriver(driver, nextBusId) {
    const previousBusId = idOf(driver.assignedBus);
    if (String(previousBusId || "") === String(nextBusId || "")) return;
    const previousBus = data.buses.find((bus) => String(bus._id) === String(previousBusId));
    const nextBus = data.buses.find((bus) => String(bus._id) === String(nextBusId));
    if (nextBusId && !nextBus) return;
    await mutate(async () => {
      if (previousBus) await apiRequest(`/buses/${encodeURIComponent(previousBus._id)}`, { method: "PUT", token, body: JSON.stringify({ driver: null }) });
      if (nextBus) await apiRequest(`/buses/${encodeURIComponent(nextBus._id)}`, { method: "PUT", token, body: JSON.stringify({ driver: driver._id }) });
    }, nextBus ? `${driver.name} assigned to ${nextBus.busNumber}.` : `${driver.name} is now unassigned.`);
  }

  async function createBus(event) {
    event.preventDefault();
    const payload = { busNumber: busForm.busNumber.trim(), route: busForm.route, capacity: Number(busForm.capacity), ...(busForm.driver ? { driver: busForm.driver } : {}) };
    const saved = await mutate(() => apiRequest("/buses", { method: "POST", token, body: JSON.stringify(payload) }), "Bus added to the fleet.");
    if (saved) setBusForm({ busNumber: "", route: "", capacity: "", driver: "" });
  }

  async function createRoute(event) {
    event.preventDefault();
    const saved = await mutate(() => apiRequest("/routes", { method: "POST", token, body: JSON.stringify(routeForm) }), "Route created. Add its stops in the route setup flow before assigning buses.");
    if (saved) setRouteForm({ routeName: "", startPoint: "", endPoint: "", description: "" });
  }

  async function deactivateRoute(route) {
    if (!window.confirm(`Remove ${route.routeName} from passenger route lists? Existing records will remain.`)) return;
    await mutate(() => apiRequest(`/routes/${encodeURIComponent(route._id)}`, { method: "DELETE", token }), "Route removed from service.");
  }

  async function createRouteAlert(event) {
    event.preventDefault();
    const payload = { route: alertForm.route, message: alertForm.message.trim(), severity: alertForm.severity, ...(alertForm.expiresAt ? { expiresAt: new Date(alertForm.expiresAt).toISOString() } : {}) };
    const saved = await mutate(() => apiRequest("/route-alerts", { method: "POST", token, body: JSON.stringify(payload) }), "Route alert published.");
    if (saved) setAlertForm({ route: "", message: "", expiresAt: "" });
  }

  async function removeRouteAlert(alert) {
    await mutate(() => apiRequest(`/route-alerts/${encodeURIComponent(alert._id)}`, { method: "DELETE", token }), "Route alert removed.");
  }

  async function updateReportStatus(report, status) {
    await mutate(() => apiRequest(`/reports/${encodeURIComponent(report._id)}/status`, {
      method: "PATCH", token, body: JSON.stringify({ status }),
    }), `Report marked ${status}.`);
  }

  async function cancelBooking(booking) {
    if (!window.confirm(`Cancel ticket ${booking.seatNumber ? `for seat ${booking.seatNumber}` : ""} belonging to ${booking.user?.name || "this passenger"}? The seat will be released.`)) return;
    await mutate(() => apiRequest(`/admin/bookings/${encodeURIComponent(booking._id)}/cancel`, { method: "PATCH", token }), "Booking cancelled and seat released.");
  }

  async function updateBus(bus, patch) {
    await mutate(() => apiRequest(`/buses/${encodeURIComponent(bus._id)}`, { method: "PUT", token, body: JSON.stringify(patch) }), `Bus ${bus.busNumber} updated.`);
  }

  async function deleteBus(bus) {
    if (!window.confirm(`Remove bus ${bus.busNumber} from the fleet?`)) return;
    await mutate(() => apiRequest(`/buses/${encodeURIComponent(bus._id)}`, { method: "DELETE", token }), `Bus ${bus.busNumber} removed.`);
  }

  async function createStop(event) {
    event.preventDefault();
    const payload = { ...stopForm, latitude: Number(stopForm.latitude), longitude: Number(stopForm.longitude), stopOrder: Number(stopForm.stopOrder) };
    const saved = await mutate(() => apiRequest("/stops", { method: "POST", token, body: JSON.stringify(payload) }), "Stop added to the selected route.");
    if (saved) setStopForm((current) => ({ ...current, stopName: "", latitude: "", longitude: "", stopOrder: String(Number(current.stopOrder) + 1) }));
  }

  function signOut() { clearSessionToken("admin"); setToken(null); setAdmin(null); setSessionState("signed-out"); setData(initialData); }

  const activeShifts = useMemo(() => data.shifts.filter((shift) => shift.status === "active"), [data.shifts]);

  if (["signed-out", "expired", "denied"].includes(sessionState)) {
    const denied = sessionState === "denied";
    return <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"><span className="text-xs font-bold uppercase tracking-[.18em] text-transit-700">Administrator access</span><h2 className="mt-3 text-xl font-semibold text-ink">{denied ? "Admin access only" : sessionState === "expired" ? "Your session expired" : "Sign in to open the fleet dashboard"}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{denied ? "This account is not an administrator. Sign in using the admin credentials provisioned for your project." : "Authenticate with an administrator account to view and manage fleet data."}</p><Link href="/login" className="mt-5 inline-flex rounded-xl bg-transit-700 px-4 py-2.5 text-sm font-semibold text-white">Administrator sign in →</Link></section>;
  }
  if (sessionState === "loading") return <div className="rounded-3xl border border-slate-200 bg-white p-7 text-sm text-slate-500" role="status">Loading secure fleet data…</div>;
  if (sessionState === "error") return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-7 text-sm text-rose-800">{notice?.text || "The administrator profile could not be loaded."}<button onClick={() => setRefreshKey((key) => key + 1)} className="ml-4 rounded-lg bg-white px-3 py-1.5 font-semibold text-indigo-700">Retry</button></div>;

  return (
    <div className="workspace-theme space-y-9 text-[#293553]" data-admin-tab={activeTab.replace("#", "")}>
      <section className="scroll-mt-8 rounded-[1.75rem] bg-gradient-to-br from-[#26386e] via-[#354b8d] to-[#4560a8] p-6 text-white shadow-[0_18px_45px_rgba(47,66,126,.2)] sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#a8efdf]">Faisalabad transit operations</p><h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Welcome{admin?.name ? `, ${admin.name.split(" ")[0]}` : " back"}.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-white/75">{activeTab === "overview" ? "A quick snapshot of today’s fleet and bookings." : activeTab === "drivers" ? "Create drivers and check who is on shift or idle." : activeTab === "routes" ? "Manage routes, ordered stops, bus assignments, and service alerts." : activeTab === "buses" ? "Add buses, set passenger capacity, and assign routes." : activeTab === "bookings" ? "Review passenger journeys, seats, and payment status." : "Review and resolve passenger reports."}</p></div><div className="flex items-center gap-2"><button onClick={() => setRefreshKey((key) => key + 1)} disabled={busy} className="min-h-11 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-50">Refresh data</button><ProfileMenu name={admin?.name} email={admin?.email} role="Administrator" onSignOut={signOut} /></div></div>
      </section>

      {notice && <div role={notice.type === "error" ? "alert" : "status"} className={`rounded-2xl border px-4 py-3 text-sm ${notice.type === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{notice.text}</div>}
      {loadingTab === activeTab && <div role="status" className="rounded-2xl border border-[#dce2f1] bg-white px-4 py-3 text-sm text-[#68738e]">Loading {activeTab} data…</div>}
{activeTab === "routes" && routeDetailsLoading && <div role="status" className="rounded-2xl border border-[#dce2f1] bg-white px-4 py-3 text-sm text-[#68738e]">Loading route stops and alerts…</div>}
            {dataErrors.length > 0 && <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Some dashboard sections could not load: {dataErrors.map((error) => error.key).join(", ")}. Use Refresh data to try again.</div>}

      <section id="summary" aria-label="Fleet summary" hidden={activeTab !== "overview"} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active buses" value={data.overview?.buses?.active ?? 0} note="on service" color="green" />
        <MetricCard label="Active shifts" value={data.overview?.activeShifts} note="right now" color="blue" />
        <MetricCard label="Active routes" value={data.overview?.routes?.total ?? 0} note="in service" color="orange" />
        <MetricCard label="Total bookings" value={data.overview?.totalBookings ?? 0} note={`${data.overview?.bookingsToday ?? 0} today`} color="red" />
      </section>

      <section id="fleet" hidden={true} className="scroll-mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <SectionTitle eyebrow="Fleet status" title="Vehicle overview" action={<span className="text-xs text-slate-500">{data.buses.length} vehicles</span>} />
        <div className="mt-5 grid gap-3 sm:grid-cols-3"><MetricCard label="Active" value={data.overview?.buses?.active ?? 0} note="on service" color="green"/><MetricCard label="Idle" value={data.overview?.buses?.idle ?? 0} note="available"/><MetricCard label="Maintenance" value={data.overview?.buses?.maintenance ?? 0} note="check status" color="orange"/></div>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-100"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#f6f7fb] text-[10px] uppercase tracking-wide text-[#7c87a1]"><tr><th className="px-4 py-3">Vehicle</th><th className="px-4 py-3">Route</th><th className="px-4 py-3">Driver</th><th className="px-4 py-3">Seats</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Trust score</th></tr></thead><tbody className="divide-y divide-slate-100">{data.buses.map((bus) => <tr key={bus._id}><td className="px-4 py-3 font-semibold text-[#34405d]">{bus.busNumber}</td><td className="px-4 py-3 text-[#66728e]">{bus.route?.routeName || "—"}</td><td className="px-4 py-3 text-[#66728e]">{bus.driver?.name || "Unassigned"}</td><td className="px-4 py-3 text-[#66728e]">{bus.availableSeats ?? "—"}{bus.capacity != null ? ` / ${bus.capacity}` : ""}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${bus.status === "active" ? "bg-emerald-50 text-emerald-700" : bus.status === "maintenance" ? "bg-orange-50 text-orange-700" : "bg-slate-100 text-slate-600"}`}>{bus.status || "unknown"}</span></td><td className="px-4 py-3 text-xs font-semibold text-[#536bb7]">{bus.trustScore?.totalRatings ? `${Number(bus.trustScore.score).toFixed(1)} / 5 · ${bus.trustScore.totalRatings} ratings` : "No ratings yet"}</td></tr>)}{data.buses.length === 0 && <tr><td colSpan="6" className="px-4 py-7 text-center text-sm text-slate-500">No fleet data is available yet.</td></tr>}</tbody></table></div>
      </section>

      <section id="drivers" hidden={activeTab !== "drivers" && activeTab !== "buses"} className="scroll-mt-8 grid items-start gap-5 xl:grid-cols-2">
        <div id="driver-create-panel" hidden={activeTab !== "drivers"} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><SectionTitle eyebrow="Team management" title="Create a driver account"/><p className="mt-2 text-xs leading-5 text-slate-500">New drivers can sign in at the driver portal. Assign a bus after creating the account.</p>
          <form onSubmit={createDriver} className="mt-5 space-y-3"><Field label="Full name" required minLength={2} value={driverForm.name} onChange={(event) => setDriverForm({ ...driverForm, name: event.target.value })} placeholder="Driver name"/><Field label="Email address" required type="email" value={driverForm.email} onChange={(event) => setDriverForm({ ...driverForm, email: event.target.value })} placeholder="driver@example.com"/><div className="grid gap-3 sm:grid-cols-2"><Field label="Phone (optional)" value={driverForm.phone} onChange={(event) => setDriverForm({ ...driverForm, phone: event.target.value })} placeholder="0300 0000000"/><Field label="Temporary password" required minLength={6} type="password" autoComplete="new-password" value={driverForm.password} onChange={(event) => setDriverForm({ ...driverForm, password: event.target.value })} placeholder="At least 6 characters"/></div><button disabled={busy} className="min-h-10 rounded-xl bg-[#536bb7] px-4 text-xs font-semibold text-white transition hover:bg-[#43599f] disabled:opacity-50">{busy ? "Saving…" : "Create driver"}</button></form>
        </div>
        <section id="driver-directory-panel" hidden={activeTab !== "drivers"} className="rounded-3xl border border-[#dfe4f3] bg-gradient-to-br from-white via-[#f7f8ff] to-[#eef2ff] p-5 shadow-[0_12px_30px_rgba(53,67,112,.08)] sm:p-7"><SectionTitle eyebrow="Team management" title="Driver directory" action={<span className="rounded-full bg-[#e9edff] px-3 py-1 text-[10px] font-bold text-[#536bb7]">{data.drivers.length} drivers</span>}/><p className="mt-2 text-xs leading-5 text-slate-500">See which drivers are on shift or idle, and check their assigned buses.</p><div className="mt-5 space-y-3">{data.drivers.map((driver) => <article key={driver._id} className="grid gap-3 rounded-2xl border border-white bg-white/85 p-4 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#34405d]">{driver.name}</p><p className="mt-1 truncate text-xs text-[#7d88a1]">{driver.email}{driver.phone ? ` · ${driver.phone}` : ""}</p></div><div className="flex flex-wrap items-center gap-2"><span className={`w-fit rounded-full px-3 py-1.5 text-[10px] font-semibold ${driver.assignedBus ? "bg-[#e4f8f0] text-[#16866f]" : "bg-[#fff0e5] text-[#c36a30]"}`}>{driver.assignedBus ? `Assigned · ${(data.buses.find((bus) => String(bus._id) === String(idOf(driver.assignedBus)) )?.busNumber || "Assigned")}` : "No bus assigned"}</span><span className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${data.shifts.some((shift) => String(idOf(shift.driver)) === String(driver._id) && shift.status === "active") ? "bg-[#e4f8f0] text-[#16866f]" : "bg-slate-100 text-slate-600"}`}>{data.shifts.some((shift) => String(idOf(shift.driver)) === String(driver._id) && shift.status === "active") ? "On shift" : "Idle"}</span><button type="button" disabled={busy} onClick={async () => { if (!window.confirm(`Remove driver account for ${driver.name}?`)) return; await mutate(() => apiRequest(`/admin/drivers/${encodeURIComponent(driver._id)}`, { method: "DELETE", token }), "Driver account removed."); }} className="rounded-lg border border-rose-200 px-3 py-2 text-[10px] font-semibold text-rose-700">Remove</button></div></article>)}{data.drivers.length === 0 && <p className="rounded-xl bg-white/80 p-4 text-xs text-slate-500">No driver accounts found. Create one using the form.</p>}</div></section>
        <form hidden={activeTab !== "drivers"} onSubmit={saveDriverEdits} className="rounded-3xl border border-[#dfe4f3] bg-white p-5 shadow-sm sm:p-7 xl:col-span-2"><SectionTitle eyebrow="Driver operations" title="Edit a driver account"/><div className="mt-4 grid gap-3 sm:grid-cols-2"><SelectField label="Driver" value={driverEditId} onChange={(event) => { const driver = data.drivers.find((item) => String(item._id) === event.target.value); setDriverEditId(event.target.value); setDriverEditForm(driver ? { name: driver.name || "", email: driver.email || "", phone: driver.phone || "" } : { name: "", email: "", phone: "" }); }}><option value="">Choose driver</option>{data.drivers.map((driver) => <option key={driver._id} value={driver._id}>{driver.name}</option>)}</SelectField><Field label="Full name" required disabled={!driverEditId} value={driverEditForm.name} onChange={(event) => setDriverEditForm({ ...driverEditForm, name: event.target.value })}/><Field label="Email address" required type="email" disabled={!driverEditId} value={driverEditForm.email} onChange={(event) => setDriverEditForm({ ...driverEditForm, email: event.target.value })}/><Field label="Phone" disabled={!driverEditId} value={driverEditForm.phone} onChange={(event) => setDriverEditForm({ ...driverEditForm, phone: event.target.value })}/><button disabled={busy || !driverEditId} className="min-h-10 self-end rounded-xl bg-[#536bb7] px-4 text-xs font-semibold text-white disabled:opacity-50">Save driver details</button></div></form>
        <div id="bus-assignment-panel" hidden={activeTab !== "drivers"} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><SectionTitle eyebrow="Driver operations" title="Assign a bus to a driver" action={<span className="text-xs text-slate-500">{data.drivers.length} drivers</span>}/><p className="mt-2 text-xs leading-5 text-slate-500">Choose one available vehicle for each driver. Assignments are saved to the fleet record.</p><div className="mt-5 space-y-3">{data.drivers.map((driver) => <article key={driver._id} className="grid gap-3 rounded-2xl border border-slate-100 bg-[#fbfcff] p-4 sm:grid-cols-[1fr_1fr] sm:items-center"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#34405d]">{driver.name}</p><p className="mt-1 truncate text-xs text-[#7d88a1]">{driver.email}</p></div><SelectField label={`Assign bus to ${driver.name}`} value={idOf(driver.assignedBus) || ""} disabled={busy} onChange={(event) => assignDriver(driver, event.target.value)}><option value="">No bus assigned</option>{data.buses.filter((bus) => !bus.driver || String(idOf(bus.driver)) === String(driver._id)).map((bus) => <option key={bus._id} value={bus._id}>{bus.busNumber} · {bus.route?.routeName || "Route pending"}</option>)}</SelectField></article>)}{data.drivers.length === 0 && <p className="rounded-2xl bg-[#f6f7fb] p-5 text-sm text-slate-500">No driver accounts found. Create the first account here.</p>}</div></div>
      </section>

      <section id="admin-setup" hidden={activeTab !== "buses" && activeTab !== "routes"} className="space-y-5">
        <div id="bus-form-panel" hidden={activeTab !== "buses"} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><SectionTitle eyebrow="Fleet setup" title="Add a vehicle"/><form onSubmit={createBus} className="mt-5 grid gap-3 sm:grid-cols-2"><Field label="Bus number" required value={busForm.busNumber} onChange={(event) => setBusForm({ ...busForm, busNumber: event.target.value })} placeholder="SS-101"/><Field label="Seat capacity" required type="number" min="1" value={busForm.capacity} onChange={(event) => setBusForm({ ...busForm, capacity: event.target.value })} placeholder="40"/><SelectField label="Route" required value={busForm.route} onChange={(event) => setBusForm({ ...busForm, route: event.target.value })}><option value="">Choose route</option>{data.routes.map((route) => <option key={route._id} value={route._id}>{route.routeName}</option>)}</SelectField><SelectField label="Driver (optional)" value={busForm.driver} onChange={(event) => setBusForm({ ...busForm, driver: event.target.value })}><option value="">Leave unassigned</option>{data.drivers.filter((driver) => !driver.assignedBus).map((driver) => <option key={driver._id} value={driver._id}>{driver.name}</option>)}</SelectField><button disabled={busy || data.routes.length === 0} className="min-h-10 rounded-xl bg-[#536bb7] px-4 text-xs font-semibold text-white transition hover:bg-[#43599f] disabled:opacity-50 sm:col-span-2">{busy ? "Saving…" : "Add bus to fleet"}</button></form>{data.routes.length === 0 && <p className="mt-3 text-xs text-amber-700">Create a route before adding a bus.</p>}</div>
        <div id="routes-panel" hidden={activeTab !== "routes"} className="scroll-mt-8 grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-2">
  <div className="min-w-0 rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-[#f7f8ff] p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#c8d2f1] hover:shadow-lg sm:p-6">
    <SectionTitle eyebrow="Network setup" title="Create a route"/>
    <form onSubmit={createRoute} className="mt-5 grid gap-3 sm:grid-cols-2">
      <Field label="Route name" required value={routeForm.routeName} onChange={(event) => setRouteForm({ ...routeForm, routeName: event.target.value })} placeholder="Clock Tower – D Ground"/>
      <Field label="Start point" required value={routeForm.startPoint} onChange={(event) => setRouteForm({ ...routeForm, startPoint: event.target.value })} placeholder="Ghanta Ghar"/>
      <Field label="End point" required value={routeForm.endPoint} onChange={(event) => setRouteForm({ ...routeForm, endPoint: event.target.value })} placeholder="D Ground"/>
      <Field label="Description (optional)" value={routeForm.description} onChange={(event) => setRouteForm({ ...routeForm, description: event.target.value })} placeholder="Short route description"/>
      <button disabled={busy} className="min-h-11 rounded-xl bg-[#536bb7] px-4 text-xs font-semibold text-white transition hover:bg-[#43599f] disabled:opacity-50 sm:col-span-2">{busy ? "Saving…" : "Create route"}</button>
    </form>
  </div>

  <div className="min-w-0 rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-[#f1f8ff] p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#c8d2f1] hover:shadow-lg sm:p-6">
    <SectionTitle eyebrow="Stop management" title="Add a route stop"/>
    <form onSubmit={createStop} className="mt-5 grid gap-3 sm:grid-cols-2">
      <SelectField label="Route" required value={stopForm.route} onChange={(event) => { const routeId = event.target.value; const nextOrder = Math.max(0, ...(data.stopsByRoute[routeId] || []).map((stop) => Number(stop.stopOrder) || 0)) + 1; setStopForm({ ...stopForm, route: routeId, stopOrder: routeId ? String(nextOrder) : "" }); }}><option value="">Choose route</option>{data.routes.map((route) => <option key={route._id} value={route._id}>{route.routeName}</option>)}</SelectField>
      <Field label="Stop name" required value={stopForm.stopName} onChange={(event) => setStopForm({ ...stopForm, stopName: event.target.value })} placeholder="Railway Station"/>
      <Field label="Latitude" required type="number" step="any" min="-90" max="90" value={stopForm.latitude} onChange={(event) => setStopForm({ ...stopForm, latitude: event.target.value })} placeholder="31.4218"/>
      <Field label="Longitude" required type="number" step="any" min="-180" max="180" value={stopForm.longitude} onChange={(event) => setStopForm({ ...stopForm, longitude: event.target.value })} placeholder="73.0802"/>
      <Field label="Stop order" required type="number" min="1" step="1" value={stopForm.stopOrder} onChange={(event) => setStopForm({ ...stopForm, stopOrder: event.target.value })} placeholder="1"/>
      <button disabled={busy || data.routes.length === 0} className="min-h-11 self-end rounded-xl bg-[#536bb7] px-4 text-xs font-semibold text-white transition hover:bg-[#43599f] disabled:opacity-50">{busy ? "Saving…" : "Add stop"}</button>
    </form>
    {data.routes.length === 0 && <p className="mt-3 text-xs text-amber-700">Create a route before adding stops.</p>}
  </div>

  <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#c8d2f1] hover:shadow-lg xl:col-span-2 sm:p-6">
    <SectionTitle eyebrow="Route directory" title="Active routes" action={<span className="rounded-full bg-[#e9edff] px-3 py-1 text-[10px] font-bold text-[#536bb7]">{data.routes.length} routes</span>}/>
    <p className="mt-2 text-xs leading-5 text-slate-500">See each route’s stops, assigned buses, and drivers in one place.</p>
    <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2">
      {data.routes.map((route) => {
        const routeBuses = data.buses.filter((bus) => String(idOf(bus.route)) === String(route._id));
        const operatingBusCount = routeBuses.filter((bus) => bus.status === "active" && bus.driver && data.shifts.some((shift) => shift.status === "active" && String(idOf(shift.bus)) === String(bus._id) && String(idOf(shift.route)) === String(route._id))).length;
        const routeReadiness = operatingBusCount ? `${operatingBusCount} bus${operatingBusCount === 1 ? "" : "es"} operating` : !routeBuses.length ? "No bus assigned" : routeBuses.every((bus) => bus.status === "maintenance") ? "All buses under maintenance" : routeBuses.some((bus) => bus.driver) ? "Waiting for driver shift" : "Driver assignment needed";
        const routeStops = (data.stopsByRoute[route._id] || []).slice().sort((a, b) => (Number(a.stopOrder) || 0) - (Number(b.stopOrder) || 0));
        return <article key={route._id} className="min-w-0 rounded-2xl border border-[#e5e9f5] bg-gradient-to-br from-white to-[#f6f8ff] p-4 transition duration-200 hover:-translate-y-1 hover:border-[#bdc9ef] hover:shadow-md sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0"><p className={`text-[10px] font-bold uppercase tracking-[.16em] ${operatingBusCount ? "text-[#16866f]" : "text-[#a75b2a]"}`}>{routeReadiness}</p><h3 className="mt-1 break-words text-lg font-semibold text-[#293553]">{route.routeName}</h3><p className="mt-1 text-xs text-[#74809a]">{route.startPoint || "Start pending"} <span className="px-1 text-[#20bba5]">→</span> {route.endPoint || "End pending"}</p></div>
            <div className="flex shrink-0 gap-2"><span className="rounded-full bg-[#e9edff] px-2.5 py-1 text-[10px] font-semibold text-[#536bb7]">{routeStops.length} stops</span><span className="rounded-full bg-[#e4f8f0] px-2.5 py-1 text-[10px] font-semibold text-[#16866f]">{routeBuses.length} buses</span></div>
          </div>
          {route.description && <p className="mt-3 text-xs leading-5 text-[#74809a]">{route.description}</p>}
          <div className="mt-4 border-t border-[#e8ebf4] pt-4">
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#74809a]">Assigned buses &amp; drivers</p>
            <div className="mt-2 space-y-2">{routeBuses.map((bus) => { const shiftActive = data.shifts.some((shift) => shift.status === "active" && String(idOf(shift.bus)) === String(bus._id) && String(idOf(shift.route)) === String(route._id)); const operating = bus.status === "active" && Boolean(bus.driver) && shiftActive; const busState = bus.status === "maintenance" ? "Maintenance" : operating ? "On shift · accepting bookings" : shiftActive ? "Shift active · bus unavailable" : bus.status === "active" && bus.driver ? "Active status · driver shift missing" : bus.driver ? "Assigned · driver shift needed" : "No driver assigned"; return <div key={bus._id} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2.5"><div className="min-w-0"><p className="truncate text-xs font-semibold text-[#34405d]">{bus.busNumber}</p><p className="mt-0.5 truncate text-[10px] text-[#8992a8]">Driver · {bus.driver?.name || data.drivers.find((driver) => String(driver._id) === String(idOf(bus.driver)))?.name || "Unassigned"}</p><p className={`mt-1 text-[10px] font-semibold ${operating ? "text-[#16866f]" : "text-[#a75b2a]"}`}>{busState} · {bus.availableSeats ?? 0}/{bus.capacity ?? "—"} seats free</p></div><span className={`shrink-0 rounded-lg px-2 py-1 text-[10px] ${operating ? "bg-[#e4f8f0] text-[#16866f]" : "bg-[#fff2e9] text-[#9a653d]"}`}>{bus.status || "idle"}</span></div>; })}{routeBuses.length === 0 && <p className="rounded-xl bg-white px-3 py-2.5 text-xs text-[#8992a8]">No bus assigned yet. Assign one below.</p>}</div>
          </div>
          <div className="mt-4 border-t border-[#e8ebf4] pt-4">
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#74809a]">Journey stops</p>
            <div className="mt-2 flex flex-wrap gap-2">{routeStops.map((stop) => <span key={stop._id} className="inline-flex min-w-0 items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs text-[#465573]"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#e9edff] text-[9px] font-bold text-[#536bb7]">{stop.stopOrder}</span><span className="break-words">{stop.stopName}</span><button type="button" disabled={busy} aria-label={`Remove ${stop.stopName}`} onClick={async () => { if (!window.confirm(`Remove stop ${stop.stopName}?`)) return; await mutate(() => apiRequest(`/stops/${encodeURIComponent(stop._id)}`, { method: "DELETE", token }), `Stop ${stop.stopName} removed.`); }} className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[#a35b59] transition hover:bg-rose-50 disabled:opacity-50">×</button></span>)}{routeStops.length === 0 && <p className="rounded-xl bg-white px-3 py-2.5 text-xs text-[#8992a8]">No stops added yet.</p>}</div>
          </div>
          <div className="mt-4 flex justify-end border-t border-[#e8ebf4] pt-3"><button type="button" disabled={busy} onClick={() => deactivateRoute(route)} className="min-h-9 rounded-lg border border-rose-200 bg-white px-3 text-[10px] font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50">Remove route</button></div>
        </article>;
      })}
      {data.routes.length === 0 && <p className="rounded-2xl bg-[#f6f7fb] p-5 text-sm text-slate-500 md:col-span-2">No active routes yet. Create your first route above.</p>}
    </div>
  </section>
</div>
      </section>
      <section hidden={activeTab !== "routes"} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#c8d2f1] hover:shadow-lg sm:p-7"><SectionTitle eyebrow="Route operations" title="Assign buses to routes" action={<span className="text-xs text-slate-500">{data.buses.length} buses</span>}/><p className="mt-2 text-xs leading-5 text-slate-500">Choose the service route for each existing bus. The passenger route list updates after you save.</p><div className="mt-5 grid gap-3 md:grid-cols-2">{data.buses.map((bus) => <div key={bus._id} className="grid gap-3 rounded-2xl border border-slate-100 bg-[#fbfcff] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#c8d2f1] hover:shadow-md sm:grid-cols-[.8fr_1.2fr] sm:items-end"><div><p className="text-sm font-semibold text-[#34405d]">{bus.busNumber}</p><p className="mt-1 text-[11px] text-[#74809a]">{bus.availableSeats ?? 0} seats available · {bus.driver?.name || "No driver"}</p></div><SelectField label={`Route for ${bus.busNumber}`} value={idOf(bus.route) || ""} disabled={busy} onChange={(event) => { if (event.target.value && String(idOf(bus.route)) !== event.target.value) updateBus(bus, { route: event.target.value }); }}><option value="">Choose route</option>{data.routes.map((route) => <option key={route._id} value={route._id}>{route.routeName}</option>)}</SelectField></div>)}{data.buses.length === 0 && <p className="rounded-xl bg-[#f6f7fb] p-4 text-sm text-slate-500">Add a bus first, then assign it to a route here.</p>}</div></section>

      <section hidden={activeTab !== "buses"} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><SectionTitle eyebrow="Fleet controls" title="Vehicle status and trust" action={<span className="text-xs text-slate-500">{data.buses.length} vehicles</span>}/><p className="mt-2 text-xs leading-5 text-slate-500">Set buses to idle or maintenance here. A bus enters service only when its assigned driver starts a shift.</p><div className="mt-5 grid gap-3 lg:grid-cols-2">{data.buses.map((bus) => <article key={bus._id} className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-[#f6f8ff] p-4 transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-[#34405d]">{bus.busNumber}</p><p className="mt-1 text-xs text-[#74809a]">{bus.route?.routeName || "No route"} · {bus.driver?.name || "Unassigned"}</p><p className="mt-2 text-[11px] font-semibold text-[#536bb7]">{bus.trustScore?.totalRatings ? `Trust ${Number(bus.trustScore.score).toFixed(1)} / 5 · ${bus.trustScore.totalRatings} ratings` : "Trust score: no ratings yet"}</p></div><div className="flex items-center gap-2"><SelectField label={`Status for ${bus.busNumber}`} value={bus.status || "idle"} disabled={busy} onChange={(event) => updateBus(bus, { status: event.target.value })}>{bus.status === "active" && <option value="active" disabled>Active · driver shift</option>}<option value="idle">Idle</option><option value="maintenance">Maintenance</option></SelectField><button type="button" disabled={busy} onClick={() => deleteBus(bus)} className="mt-5 min-h-10 rounded-xl border border-rose-200 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50">Remove</button></div></div><p className="mt-3 text-[10px] text-[#8992a8]">Seat availability: {bus.availableSeats ?? 0} of {bus.capacity ?? 0}</p></article>)}{data.buses.length === 0 && <p className="rounded-xl bg-[#f6f7fb] p-4 text-sm text-slate-500">No buses to manage yet.</p>}</div></section>

      <section hidden={activeTab !== "bookings"} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><SectionTitle eyebrow="Ticket operations" title="Bookings and payment status" action={<div className="flex flex-wrap gap-2"><span className="rounded-full bg-[#e9edff] px-3 py-1 text-[10px] font-bold text-[#536bb7]">{data.adminBookings.length} loaded</span><select aria-label="Filter bookings" value={bookingFilter} onChange={(event) => setBookingFilter(event.target.value)} className="min-h-9 rounded-xl border border-[#dfe3f1] bg-white px-3 text-xs text-[#465573]"><option value="all">All bookings</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option><option value="completed">Completed</option></select></div>}/><p className="mt-2 text-xs leading-5 text-slate-500">Payment state is supplied by the backend. Online payment checkout is not connected, so pending records cannot be marked paid from this screen.</p><div className="mt-5 space-y-3">{data.adminBookings.filter((booking) => bookingFilter === "all" || booking.status === bookingFilter).map((booking) => <article key={booking._id} className="grid gap-4 rounded-2xl border border-slate-100 bg-[#fbfcff] p-4 xl:grid-cols-[1fr_auto] xl:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-[#34405d]">{booking.route?.routeName || "Route unavailable"}</p><span className="rounded-full bg-[#eef1f8] px-2.5 py-1 text-[10px] font-semibold capitalize text-[#596681]">{booking.status}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${booking.paymentStatus === "paid" ? "bg-emerald-50 text-emerald-700" : booking.paymentStatus === "failed" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"}`}>Payment · {booking.paymentStatus}</span></div><p className="mt-1 text-xs text-[#596681]">{booking.user?.name || "Passenger"} · {booking.user?.email || "No email"}</p><p className="mt-1 text-[11px] text-[#8992a8]">{booking.bus?.busNumber || "Bus"} · Seat {booking.seatNumber || "not assigned"} · {booking.currency || "PKR"} {booking.fare ?? 0} · {booking.paymentProvider || booking.paymentMethod || "—"}</p><p className="mt-1 text-[10px] text-[#8992a8]">Booked {dateLabel(booking.createdAt)}{booking.paidAt ? ` · Paid ${dateLabel(booking.paidAt)}` : ""}</p></div>{booking.status === "confirmed" && <button type="button" disabled={busy} onClick={() => cancelBooking(booking)} className="min-h-10 rounded-xl border border-rose-200 px-4 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50">Cancel booking</button>}</article>)}{data.adminBookings.length === 0 && <p className="rounded-xl bg-[#f6f7fb] p-5 text-sm text-slate-500">No booking records found.</p>}{data.adminBookings.length > 0 && data.adminBookings.filter((booking) => bookingFilter === "all" || booking.status === bookingFilter).length === 0 && <p className="rounded-xl bg-[#f6f7fb] p-5 text-sm text-slate-500">No {bookingFilter} bookings found.</p>}</div><p className="mt-4 text-[10px] text-[#8992a8]">Showing at most 500 newest records. Cancellation releases the seat and stops any shared trip location.</p></section>

      <section id="alerts" hidden={activeTab !== "routes"} className="scroll-mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><SectionTitle eyebrow="Passenger updates" title="Publish a route alert"/><p className="mt-2 text-xs leading-5 text-slate-500">Current notices appear to passengers who select the matching route.</p><form onSubmit={createRouteAlert} className="mt-4 grid gap-3 md:grid-cols-[.8fr_.8fr_1.4fr_1fr_auto] md:items-end"><SelectField label="Route" required value={alertForm.route} onChange={(event) => setAlertForm({ ...alertForm, route: event.target.value })}><option value="">Choose route</option>{data.routes.map((route) => <option key={route._id} value={route._id}>{route.routeName}</option>)}</SelectField><SelectField label="Severity" required value={alertForm.severity} onChange={(event) => setAlertForm({ ...alertForm, severity: event.target.value })}><option value="info">Info</option><option value="delay">Delay</option><option value="disruption">Disruption</option></SelectField><label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#596681]">Notice</span><input required maxLength={500} value={alertForm.message} onChange={(event) => setAlertForm({ ...alertForm, message: event.target.value })} placeholder="Service update for passengers" className="min-h-10 w-full rounded-xl border border-[#dfe3f1] bg-white px-3 text-sm text-[#293553] outline-none focus:border-[#8093d1]"/></label><label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#596681]">Expiry · optional</span><input type="datetime-local" value={alertForm.expiresAt} onChange={(event) => setAlertForm({ ...alertForm, expiresAt: event.target.value })} className="min-h-10 w-full rounded-xl border border-[#dfe3f1] bg-white px-3 text-sm text-[#293553] outline-none focus:border-[#8093d1]"/></label><button disabled={busy || data.routes.length === 0} className="min-h-10 rounded-xl bg-[#536bb7] px-4 text-xs font-semibold text-white transition hover:bg-[#43599f] disabled:opacity-50">{busy ? "Publishing…" : "Publish alert"}</button></form><div className="mt-5 grid gap-3 md:grid-cols-2">{data.routes.flatMap((route) => (data.alertsByRoute[route._id] || []).map((alert) => ({ ...alert, routeName: route.routeName }))).map((alert) => <article key={alert._id} className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4"><p className="text-xs font-semibold text-[#574a32]">{alert.routeName}</p><p className="mt-1 text-sm text-[#605741]">{alert.message}</p><div className="mt-2 flex items-center justify-between gap-3"><p className="text-[10px] text-[#938769]">Posted {dateLabel(alert.createdAt)}{alert.expiresAt ? ` · Expires ${dateLabel(alert.expiresAt)}` : " · No expiry set"}</p><button type="button" disabled={busy} onClick={() => removeRouteAlert(alert)} className="shrink-0 rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#8a6740] disabled:opacity-50">Remove</button></div></article>)}{data.routes.length > 0 && Object.values(data.alertsByRoute).every((items) => items.length === 0) && <p className="rounded-xl bg-[#f6f7fb] p-4 text-xs text-[#74809a]">No active route alerts.</p>}</div></section>

      <section id="reports" hidden={activeTab !== "reports"} className="scroll-mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><SectionTitle eyebrow="Passenger feedback" title="Review bus reports" action={<span className="text-xs text-slate-500">{data.reportItems.length} reports</span>}/><p className="mt-2 text-xs leading-5 text-slate-500">Review safety concerns and vehicle-condition reports submitted by passengers.</p><div className="mt-5 space-y-3">{data.reportItems.map((report) => <article key={report._id} className="grid gap-4 rounded-2xl border border-slate-100 bg-[#fbfcff] p-4 sm:grid-cols-[1fr_auto] sm:items-start"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold text-[#34405d]">{report.bus?.busNumber || "Bus"} · {report.reportType === "safety" ? "Safety concern" : "Vehicle condition"}</h3><span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold capitalize ${report.status === "resolved" ? "bg-[#e9edff] text-[#536bb7]" : report.status === "reviewed" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-800"}`}>{report.status}</span></div><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#596681]">{report.description}</p><p className="mt-2 text-[10px] text-[#8992a8]">From {report.user?.name || "Passenger"} · {dateLabel(report.createdAt)}</p></div><div className="flex flex-wrap gap-2">{report.status === "open" && <button disabled={busy} onClick={() => updateReportStatus(report, "reviewed")} className="min-h-11 rounded-lg border border-[#dce2f1] bg-white px-3 text-[10px] font-semibold text-[#536bb7] disabled:opacity-50">Mark reviewed</button>}{report.status !== "resolved" ? <button disabled={busy} onClick={() => updateReportStatus(report, "resolved")} className="min-h-11 rounded-lg bg-[#536bb7] px-3 text-[10px] font-semibold text-white hover:bg-[#43599f] disabled:opacity-50">Resolve</button> : <button disabled={busy} onClick={() => updateReportStatus(report, "reviewed")} className="min-h-11 rounded-lg border border-[#dce2f1] bg-white px-3 text-[10px] font-semibold text-[#536bb7] disabled:opacity-50">Reopen</button>}</div></article>)}{data.reportItems.length === 0 && <p className="rounded-xl bg-[#f6f7fb] p-5 text-sm text-[#74809a]">No passenger reports have been submitted.</p>}</div></section>
      <section id="shifts" hidden={activeTab !== "drivers"} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><SectionTitle eyebrow="Operations" title="Recent shifts" action={<span className="text-xs text-slate-500">{activeShifts.length} active now</span>}/><div className="mt-5 overflow-x-auto rounded-2xl border border-slate-100"><table className="w-full min-w-[690px] text-left text-sm"><thead className="bg-[#f6f7fb] text-[10px] uppercase tracking-wide text-[#7c87a1]"><tr><th className="px-4 py-3">Driver</th><th className="px-4 py-3">Bus</th><th className="px-4 py-3">Route</th><th className="px-4 py-3">Started</th><th className="px-4 py-3">State</th></tr></thead><tbody className="divide-y divide-slate-100">{data.shifts.map((shift) => <tr key={shift._id}><td className="px-4 py-3 font-medium text-[#34405d]">{shift.driver?.name || "—"}</td><td className="px-4 py-3 text-[#66728e]">{shift.bus?.busNumber || "—"}</td><td className="px-4 py-3 text-[#66728e]">{shift.route?.routeName || "—"}</td><td className="px-4 py-3 text-xs text-[#66728e]">{dateLabel(shift.startedAt)}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${shift.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{shift.status}</span></td></tr>)}{data.shifts.length === 0 && <tr><td colSpan="5" className="px-4 py-7 text-center text-sm text-slate-500">No shifts have been recorded.</td></tr>}</tbody></table></div></section>
    </div>
  );
}




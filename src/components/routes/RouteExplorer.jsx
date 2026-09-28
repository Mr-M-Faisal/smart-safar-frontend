"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { demoStopsForRoute, faisalabadDemoRoutes } from "@/data/faisalabad-demo";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import BookingLink from "@/components/layout/BookingLink";
import LeafletRouteMap from "@/components/map/LeafletRouteMap";
import { saveBookingSelection } from "@/lib/bookingSelection";

function routeBusCount(route) {
  return route.buses?.length ?? null;
}

function busStatusLabel(status) {
  return ({ active: "On route", idle: "Waiting", maintenance: "Unavailable" })[status] || status || "Status unavailable";
}

export default function RouteExplorer() {
  const firstDemoRoute = faisalabadDemoRoutes[0];
  const [routes, setRoutes] = useState(faisalabadDemoRoutes);
  const [selectedRoute, setSelectedRoute] = useState(firstDemoRoute);
  const [stops, setStops] = useState(() => demoStopsForRoute(firstDemoRoute));
  const [buses, setBuses] = useState(firstDemoRoute.buses);
  const [query, setQuery] = useState("");
  const [routesState, setRoutesState] = useState("ready");
  const [stopsState, setStopsState] = useState("ready");
  const [busesState, setBusesState] = useState("ready");
  const [dataSource, setDataSource] = useState("demo");
  const [refreshKey, setRefreshKey] = useState(0);
  const [checkingBackend, setCheckingBackend] = useState(true);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    setCheckingBackend(true);
    apiRequest("/routes")
      .then((result) => {
        if (!mounted) return;
        const backendRoutes = Array.isArray(result) ? result : [];
        if (backendRoutes.length) {
          setRoutes(backendRoutes);
          setSelectedRoute((current) => backendRoutes.find((route) => route._id === current?._id) || backendRoutes[0]);
          setDataSource("backend");
        } else {
          setRoutes(faisalabadDemoRoutes);
          setSelectedRoute((current) => faisalabadDemoRoutes.find((route) => route._id === current?._id) || faisalabadDemoRoutes[0]);
          setDataSource("demo");
        }
        setRoutesState("ready");
        setCheckingBackend(false);
      })
      .catch(() => {
        if (!mounted) return;
        setRoutes(faisalabadDemoRoutes);
        setSelectedRoute((current) => faisalabadDemoRoutes.find((route) => route._id === current?._id) || faisalabadDemoRoutes[0]);
        setDataSource("demo");
        setRoutesState("ready");
        setCheckingBackend(false);
      });

    return () => { mounted = false; };
  }, [refreshKey]);

  useEffect(() => {
    if (!selectedRoute?._id) {
      setStops([]);
      setBuses([]);
      return undefined;
    }

    if (dataSource === "demo") {
      setStops(demoStopsForRoute(selectedRoute));
      setBuses(selectedRoute.buses || []);
      setStopsState("ready");
      setBusesState("ready");
      return undefined;
    }

    let current = true;
    setStopsState("loading");
    setBusesState("loading");

    apiRequest(`/stops/route/${encodeURIComponent(selectedRoute._id)}`)
      .then((result) => {
        if (!current) return;
        setStops(Array.isArray(result) ? result : []);
        setStopsState("ready");
      })
      .catch(() => { if (current) setStopsState("error"); });

    apiRequest(`/buses?route=${encodeURIComponent(selectedRoute._id)}`)
      .then((result) => {
        if (!current) return;
        setBuses(Array.isArray(result) ? result : []);
        setBusesState("ready");
      })
      .catch(() => { if (current) setBusesState("error"); });

    return () => { current = false; };
  }, [selectedRoute?._id, dataSource]);

  const filteredRoutes = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return routes;
    return routes.filter((route) => {
      const searchable = [route.routeName, route.startPoint, route.endPoint, route.description,
        ...(route.stops || []).map((stop) => typeof stop === "string" ? stop : stop.stopName),
        ...(route.buses || []).map((bus) => bus.busNumber)];
      return searchable.some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [query, routes]);

  return (
    <main className="min-h-[70vh] w-full min-w-0 overflow-x-clip bg-[#f4f5fb] px-4 py-8 text-[#25304f] sm:px-8 sm:py-14 lg:px-12">
      <div className="mx-auto w-full min-w-0 max-w-[1320px]">
        <RevealOnScroll>
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#536bb7]">Faisalabad · public transit</p>
          <div className="mt-3 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div><h1 className="text-4xl font-semibold tracking-[-.04em] text-[#25304f] sm:text-5xl">Find your route.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#68738e] sm:text-base">Explore routes, see the stops along the way, and check buses serving each journey.</p></div>
            <label className="flex w-full items-center gap-3 rounded-2xl border border-[#e2e5f1] bg-white px-4 py-3 shadow-[0_8px_25px_rgba(53,67,112,.07)] transition focus-within:border-[#91a1db] focus-within:shadow-[0_10px_30px_rgba(83,107,183,.12)] md:max-w-sm">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-[#7381a4]"><circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.8"/><path d="m16 16 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              <input aria-label="Search routes, areas, stops, or buses" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search route, area, stop, bus" className="w-full border-0 bg-transparent text-sm text-[#25304f] outline-none placeholder:text-[#9aa3b7]" />
            </label>
          </div>
        </RevealOnScroll>

        {routesState === "loading" && <div className="mt-9 rounded-3xl border border-[#e2e5f1] bg-white p-8 text-sm text-[#68738e] shadow-sm">Loading Faisalabad routes…</div>}

        {routesState === "ready" && (
          <>
            {dataSource === "demo" && <div className="mt-8 flex flex-col justify-between gap-2 rounded-2xl border border-[#cdd7f5] bg-[#e9edff] px-5 py-4 text-sm text-[#4e608f] sm:flex-row sm:items-center"><div><span><strong className="font-semibold text-[#3d559e]">Local demo data</strong> · sample Faisalabad routes and buses for exploring the interface.</span><span className="mt-1 block text-xs text-[#7583aa] sm:ml-2 sm:mt-0 sm:inline">{checkingBackend ? "Checking server in the background…" : "Available offline"}</span></div><button disabled={checkingBackend} onClick={() => setRefreshKey((key) => key + 1)} className="self-start rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#536bb7] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-wait disabled:opacity-60 sm:self-auto">{checkingBackend ? "Checking…" : "Try backend again"}</button></div>}
            {dataSource === "backend" && <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#bfe8dd] bg-[#e8faf4] px-4 py-2 text-xs font-semibold text-[#167b6e]"><span className="h-2 w-2 rounded-full bg-[#22bfa7]"/> Connected to transit server</div>}

            {routes.length === 0 ? <div className="mt-8 rounded-3xl border border-[#e2e5f1] bg-white p-8 text-sm text-[#68738e]">No sample routes are available.</div> : <div className="mt-8 grid items-start gap-6 lg:grid-cols-[.95fr_1.05fr]">
              <section aria-label="Available routes" className={`space-y-3 ${mobileDetailOpen ? "hidden lg:block" : ""}`}>
                <div className="mb-4 flex items-center justify-between px-1"><h2 className="text-sm font-semibold text-[#525f7e]">Available routes</h2><span className="rounded-full bg-[#e4e8f7] px-3 py-1 text-xs font-semibold text-[#536bb7]">{filteredRoutes.length} routes</span></div>
                {filteredRoutes.map((route, index) => {
                  const selected = String(route._id) === String(selectedRoute?._id);
                  return <RevealOnScroll key={route._id} style={{ "--reveal-delay": `${Math.min(index, 5) * 65}ms` }}>
                    <button onClick={() => { setSelectedRoute(route); saveBookingSelection({ routeId: route._id, busId: "" }); setMobileDetailOpen(true); }} aria-pressed={selected} className={`group w-full rounded-3xl border p-5 text-left transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7185c6] motion-reduce:transform-none motion-reduce:transition-none sm:p-6 ${selected ? "border-[#344b93] bg-gradient-to-r from-[#263a70] to-[#536bb7] text-white shadow-[0_9px_24px_rgba(49,68,130,.23)] hover:brightness-110" : "border-[#e8ebf4] bg-white text-[#34405d] shadow-[0_8px_22px_rgba(53,67,112,.06)] hover:-translate-y-0.5 hover:border-[#9eaddf] hover:shadow-[0_12px_26px_rgba(53,67,112,.12)]"}`}>
                      <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${selected ? "bg-white/15 text-[#a5f1df]" : "bg-[#eff1fa] text-[#7381a4] group-hover:bg-[#e6eaf9] group-hover:text-[#536bb7]"}`}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M5 17.5h14M7 14V6.8c0-.99.81-1.8 1.8-1.8h6.4c.99 0 1.8.81 1.8 1.8V14M7 14h10l2 3.5H5L7 14Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><circle cx="8" cy="17.5" r="1.5" fill="currentColor"/><circle cx="16" cy="17.5" r="1.5" fill="currentColor"/></svg></span><div><span className={`text-[10px] font-bold uppercase tracking-[.16em] ${selected ? "text-white/65" : "text-[#7381a4]"}`}>Transit route</span><h3 className={`mt-1 text-lg font-semibold ${selected ? "text-white" : "text-[#293553]"}`}>{route.routeName}</h3></div></div><div className="flex items-center gap-3"><span className={`hidden rounded-full px-2.5 py-1 text-[10px] font-semibold sm:inline ${selected ? "bg-white/15 text-white" : "bg-[#eef0fa] text-[#687697]"}`}>{routeBusCount(route) ?? "—"} buses</span>{selected ? <span className="grid h-8 w-8 place-items-center rounded-full bg-[#a5f1df] text-sm font-bold text-[#20345f]" aria-label="Selected">✓</span> : <span className="text-lg text-[#9aa3b7] transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">→</span>}</div></div>
                      <div className={`mt-5 flex items-center gap-3 text-sm font-medium ${selected ? "text-white/85" : "text-[#53607e]"}`}><span className="max-w-[42%] truncate">{route.startPoint}</span><span className={`h-px min-w-7 flex-1 ${selected ? "bg-white/35" : "bg-[#d9deef]"}`}/><span className="max-w-[42%] truncate text-right">{route.endPoint}</span></div>
                      {route.description && <p className={`mt-4 text-sm leading-6 ${selected ? "text-white/75" : "text-[#7a849c]"}`}>{route.description}</p>}
                    </button>
                  </RevealOnScroll>;
                })}
                {filteredRoutes.length === 0 && <div className="rounded-3xl border border-dashed border-[#cbd3e9] bg-white/70 p-8 text-sm text-[#68738e]">No routes match “{query}”. Try another route, area, stop, or bus number.</div>}
              </section>

              <aside className={`rounded-[2rem] border border-white bg-[#e9ebf8] p-5 shadow-[0_18px_48px_rgba(53,67,112,.11)] sm:p-7 lg:sticky lg:top-28 ${mobileDetailOpen ? "block" : "hidden lg:block"}`}>
                {selectedRoute ? <>
                  <button type="button" onClick={() => setMobileDetailOpen(false)} className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-full border border-[#d9def0] bg-white px-4 text-xs font-semibold text-[#536bb7] lg:hidden"><span aria-hidden="true">←</span> All routes</button>
                  <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#536bb7]">Route details</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#263250]">{selectedRoute.routeName}</h2><p className="mt-1 text-sm text-[#68738e]">{selectedRoute.startPoint} <span className="px-1 text-[#22a992]">→</span> {selectedRoute.endPoint}</p></div><span className="rounded-2xl bg-white/80 px-3 py-2 text-xs font-semibold text-[#536bb7] shadow-sm">{stopsState === "ready" ? `${stops.length} stops` : "Stops"}</span></div>
                  <BookingLink routeId={dataSource === "backend" ? selectedRoute._id : undefined} className="mt-4 flex min-h-12 items-center justify-between rounded-xl bg-[#536bb7] px-4 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(83,107,183,.18)] transition hover:-translate-y-0.5 hover:bg-[#43599f]"><span>Choose seat &amp; payment</span><span aria-hidden="true">→</span></BookingLink>
                  <div className="mt-5 overflow-hidden rounded-3xl border border-white/90 bg-white p-2 shadow-[0_8px_24px_rgba(53,67,112,.06)]">
                    <div className="mb-2 flex items-center justify-between px-2 pt-1"><h3 className="text-xs font-semibold text-[#394562]">Route map</h3><span className="text-[10px] font-medium text-[#8992a8]">{stops.length ? `${stops.length} stops shown` : "Loading route points…"}</span></div>
                    <div className="h-44 overflow-hidden rounded-2xl sm:h-52">
                      <LeafletRouteMap routeSegments={[{ routeId: selectedRoute._id, routeName: selectedRoute.routeName, stops }]} selectedRouteId={selectedRoute._id} ariaLabel={`Map showing ${selectedRoute.routeName} and its stops`} />
                    </div>
                  </div>
                  <div className="mt-6 rounded-3xl border border-white/90 bg-[#fffdf8] p-5 shadow-[0_8px_24px_rgba(53,67,112,.06)] sm:p-6">
                    <h3 className="text-sm font-semibold text-[#394562]">Journey stops</h3>
                    {stopsState === "loading" && <p className="mt-5 text-sm text-[#7b859c]">Loading stops…</p>}
                    {stopsState === "error" && <div role="alert" className="mt-5"><p className="text-sm text-[#9a5a50]">Stops could not be loaded.</p><button onClick={() => setRefreshKey((key) => key + 1)} className="mt-3 rounded-full border border-[#d9b6b0] px-4 py-2 text-xs font-semibold text-[#75433d] transition hover:bg-[#fff1ed]">Retry data</button></div>}
                    {stopsState === "ready" && stops.length === 0 && <p className="mt-5 text-sm text-[#7b859c]">No stops have been added to this route yet.</p>}
                    {stopsState === "ready" && stops.length > 0 && <ol className="mt-5 space-y-0">{stops.map((stop, index) => <li key={stop._id || `${stop.stopOrder}-${stop.stopName}`} className="relative flex gap-4 pb-5 last:pb-0"><span className="relative flex w-4 shrink-0 justify-center"><span className={`z-10 mt-1.5 h-3 w-3 rounded-full border-[3px] border-[#fffdf8] ring-1 ${index === 0 || index === stops.length - 1 ? "bg-[#20bba5] ring-[#20bba5]" : "bg-[#758acb] ring-[#758acb]"} `}/>{index < stops.length - 1 && <span className="absolute top-4 h-full w-px bg-[#cdd5ee]"/>}</span><span className="min-w-0"><span className="block text-sm font-semibold text-[#394562]">{stop.stopName}</span><span className="mt-1 block text-xs text-[#8992a8]">Stop {stop.stopOrder ?? index + 1}</span></span></li>)}</ol>}
                  </div>

                  <div className="mt-6"><div className="mb-3 flex items-center justify-between px-1"><h3 className="text-sm font-semibold text-[#394562]">Buses on this route</h3><span className="text-xs text-[#7b859c]">{busesState === "ready" ? buses.length : ""}</span></div>
                    {busesState === "loading" && <p className="rounded-2xl bg-white/70 p-4 text-sm text-[#7b859c]">Loading buses…</p>}
                    {busesState === "error" && <p role="alert" className="rounded-2xl bg-[#fff7f5] p-4 text-sm text-[#9a5a50]">Bus information is temporarily unavailable.</p>}
                    {busesState === "ready" && buses.length === 0 && <p className="rounded-2xl bg-white/70 p-4 text-sm text-[#7b859c]">No buses are assigned to this route yet.</p>}
                    {busesState === "ready" && buses.length > 0 && <div className="space-y-2">{buses.map((bus) => <article key={bus._id || bus.busNumber} className="rounded-2xl border border-white/90 bg-white/90 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold text-[#34405d]">{bus.busNumber || "Bus"}</p><p className="mt-1 text-xs text-[#7b859c]">{bus.direction || "Route service"} · {busStatusLabel(bus.status)}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${bus.status === "active" ? "bg-[#e4f8f0] text-[#18846f]" : bus.status === "maintenance" ? "bg-[#fff0e8] text-[#a85b2a]" : "bg-[#eef0fa] text-[#687697]"}`}>{bus.status === "active" ? "Active" : bus.status === "maintenance" ? "Maintenance" : "Standby"}</span></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#68738e]"><span>Seats: <strong className="text-[#34405d]">{bus.availableSeats ?? "—"}{bus.capacity != null ? ` / ${bus.capacity}` : ""}</strong></span>{bus.nextStop?.stopName || bus.nextStop ? <span>Next stop: <strong className="text-[#34405d]">{bus.nextStop.stopName || bus.nextStop}</strong></span> : null}{bus.etaMinutes != null && <span>ETA: <strong className="text-[#34405d]">{Math.round(bus.etaMinutes)} min</strong></span>}</div></article>)}</div>}
                  </div>
                  <p className="mt-4 text-xs leading-5 text-[#7b859c]">{dataSource === "demo" ? "All displayed routes, buses, seats, and ETAs are sample data for the local prototype." : "Bus status and seat counts are provided by the Smart Safar transit server."}</p>
                </> : <p className="text-sm text-[#68738e]">Choose a route to view its stops and buses.</p>}
              </aside>
            </div>}
          </>
        )}
      </div>
    </main>
  );
}

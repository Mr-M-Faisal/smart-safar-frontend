"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiRequest, readSavedCache } from "@/lib/api";
import { demoStopsForRoute, faisalabadDemoRoutes } from "@/data/faisalabad-demo";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import BookingLink from "@/components/layout/BookingLink";
import { saveBookingSelection } from "@/lib/bookingSelection";

const LeafletRouteMap = dynamic(() => import("@/components/map/LeafletRouteMap"), {
  ssr: false,
  loading: () => <div className="h-44 w-full rounded-2xl bg-[#e6e9f4] animate-pulse sm:h-52" />,
});

function routeBusCount(route) {
  return route.buses?.length ?? null;
}

function busStatusLabel(status) {
  return ({ active: "On route", idle: "Waiting", maintenance: "Unavailable" })[status] || status || "Status unavailable";
}

export default function RouteExplorer() {
  const firstDemoRoute = faisalabadDemoRoutes[0];
  const [routes, setRoutes] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = readSavedCache("/routes");
      if (saved?.data && Array.isArray(saved.data) && saved.data.length) return saved.data;
    }
    return faisalabadDemoRoutes;
  });
  const [selectedRoute, setSelectedRoute] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = readSavedCache("/routes");
      if (saved?.data && Array.isArray(saved.data) && saved.data.length) return saved.data[0];
    }
    return firstDemoRoute;
  });
  const [stops, setStops] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = readSavedCache("/routes");
      if (saved?.data && Array.isArray(saved.data) && saved.data.length) {
        const savedStops = readSavedCache(`/stops/route/${saved.data[0]._id}`);
        if (savedStops?.data && Array.isArray(savedStops.data) && savedStops.data.length) return savedStops.data;
      }
    }
    return demoStopsForRoute(firstDemoRoute);
  });
  const [buses, setBuses] = useState(() => firstDemoRoute.buses || []);
  const [query, setQuery] = useState("");
  const [routesState, setRoutesState] = useState("ready");
  const [stopsState, setStopsState] = useState("ready");
  const [busesState, setBusesState] = useState("ready");
  const [dataSource, setDataSource] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = readSavedCache("/routes");
      if (saved?.data && Array.isArray(saved.data) && saved.data.length) return "saved";
    }
    return "demo";
  });
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
          setDataSource(typeof navigator !== "undefined" && !navigator.onLine ? "saved" : "backend");
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
        const saved = readSavedCache("/routes");
        if (saved?.data && Array.isArray(saved.data) && saved.data.length) {
          setRoutes(saved.data);
          setSelectedRoute((current) => saved.data.find((route) => route._id === current?._id) || saved.data[0]);
          setDataSource("saved");
        } else {
          setRoutes(faisalabadDemoRoutes);
          setSelectedRoute((current) => faisalabadDemoRoutes.find((route) => route._id === current?._id) || faisalabadDemoRoutes[0]);
          setDataSource("demo");
        }
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
    <div className="p-4 max-w-lg mx-auto pb-6">
      {/* Search Header */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-[#111d3d]">Explore Routes</h1>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
            {filteredRoutes.length} available
          </span>
        </div>

        <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-2xs">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-slate-400">
            <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.8"/>
            <path d="m16 16 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input
            aria-label="Search routes, areas, stops, or buses"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search route name, stop, or bus"
            className="w-full border-0 bg-transparent text-xs text-[#111d3d] outline-none placeholder:text-slate-400"
          />
        </label>
      </div>

      {routesState === "loading" && (
        <div className="mt-4 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      )}

      {routesState === "ready" && (
        <div className="mt-3">
          {/* List of Routes (shown when detail is not opened on mobile) */}
          <section aria-label="Available routes" className={`space-y-2 ${mobileDetailOpen ? "hidden" : "block"}`}>
            {filteredRoutes.map((route) => {
              const selected = String(route._id) === String(selectedRoute?._id);
              return (
                <button
                  key={route._id}
                  onClick={() => {
                    setSelectedRoute(route);
                    saveBookingSelection({ routeId: route._id, busId: "" });
                    setMobileDetailOpen(true);
                  }}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 text-left shadow-2xs transition active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-xs font-bold text-[#536bb7]">
                      BUS
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-[#111d3d]">{route.routeName}</h3>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        {route.startPoint || "Start"} → {route.endPoint || "End"}
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-400 text-sm pl-2">→</span>
                </button>
              );
            })}
            {filteredRoutes.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
                No routes match “{query}”.
              </div>
            )}
          </section>

          {/* Route Detail View with Back Arrow */}
          {selectedRoute && mobileDetailOpen && (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setMobileDetailOpen(false)}
                className="inline-flex items-center gap-1.5 self-start text-xs font-bold text-[#536bb7] active:opacity-75"
              >
                <span>←</span> Back to routes list
              </button>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#536bb7]">Route Overview</span>
                <h2 className="text-lg font-bold text-[#111d3d] mt-0.5">{selectedRoute.routeName}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedRoute.startPoint} → {selectedRoute.endPoint}
                </p>

                <BookingLink
                  routeId={dataSource === "backend" ? selectedRoute._id : undefined}
                  className="mt-3 flex h-10 w-full items-center justify-center rounded-xl bg-[#536bb7] text-xs font-bold text-white shadow-xs active:bg-[#43599f]"
                >
                  Book seat on this route →
                </BookingLink>
              </div>

              {/* Map Preview */}
              <div className="h-44 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xs">
                <LeafletRouteMap
                  routeSegments={[{ routeId: selectedRoute._id, routeName: selectedRoute.routeName, stops }]}
                  selectedRouteId={selectedRoute._id}
                  ariaLabel={`Map showing ${selectedRoute.routeName}`}
                />
              </div>

              {/* Stops list */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-[#111d3d]">Route Stops</h3>
                  <span className="text-[10px] font-semibold text-slate-400">{stops.length} stops</span>
                </div>
                {stopsState === "loading" && <p className="text-xs text-slate-400">Loading stops...</p>}
                {stopsState === "ready" && (
                  <ol className="space-y-2">
                    {stops.map((stop, index) => (
                      <li key={stop._id || index} className="flex items-center gap-2.5 text-xs">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-50 text-[10px] font-bold text-[#536bb7]">
                          {index + 1}
                        </span>
                        <span className="font-medium text-[#111d3d]">{stop.stopName}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

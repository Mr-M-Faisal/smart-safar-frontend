"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiRequest, readSavedCache } from "@/lib/api";
import { createTransitSocket } from "@/lib/socket";
import { demoStopsForRoute, FAISALABAD_CENTER, faisalabadDemoCoordinates, faisalabadDemoRoutes } from "@/data/faisalabad-demo";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { readBookingSelection, saveBookingSelection } from "@/lib/bookingSelection";

function makeDemoBuses() {
  return faisalabadDemoRoutes.flatMap((route, routeIndex) => route.buses.map((bus, busIndex) => {
    const nextStop = typeof bus.nextStop === "string" ? bus.nextStop : bus.nextStop?.stopName;
    const point = faisalabadDemoCoordinates[nextStop] || FAISALABAD_CENTER;
    const latitude = point[0] + (busIndex % 2 ? -0.0016 : 0.0014);
    const longitude = point[1] + (routeIndex % 2 ? -0.0013 : 0.0012);
    return {
      ...bus,
      _id: bus._id,
      route: { _id: route._id, routeName: route.routeName },
      currentLocation: { latitude, longitude },
      demoOrigin: { latitude, longitude },
    };
  }));
}

function routeIdForBus(bus) {
  return typeof bus.route === "object" ? bus.route?._id : bus.route;
}

function displayStatus(status) {
  return ({ active: "On route", idle: "Waiting", maintenance: "Maintenance" })[status] || "Status unavailable";
}

function tooltipText(text) {
  const element = document.createElement("span");
  element.textContent = String(text || "");
  return element;
}

function RoutePicker({ routes, value, onChange }) {
  const [query, setQuery] = useState("");
  const selected = routes.find((route) => String(route._id) === String(value));
  const matches = routes.filter((route) => `${route.routeName || ""} ${route.startPoint || ""} ${route.endPoint || ""}`.toLowerCase().includes(query.trim().toLowerCase()));

  return <section aria-label="Choose a route" className="mt-6 rounded-[1.5rem] border border-white bg-white/85 p-3.5 shadow-[0_12px_32px_rgba(53,67,112,.07)] backdrop-blur sm:p-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#e9edff] to-[#dff8f2] text-lg text-[#536bb7]" aria-hidden="true">⌖</span>
        <div><h2 className="text-sm font-bold text-[#293553]">Choose your route</h2><p className="mt-0.5 text-[10px] text-[#8992a8]">{selected ? `Tracking ${selected.routeName}` : `${routes.length} routes available`}</p></div>
      </div>
      <label className="flex min-h-10 w-full items-center gap-2 rounded-xl border border-[#e5e9f4] bg-[#f7f8fc] px-3 sm:max-w-[250px]"><span aria-hidden="true" className="text-[#7185c6]">⌕</span><span className="sr-only">Search routes or areas</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a route or area" className="min-w-0 flex-1 bg-transparent text-xs text-[#34405d] outline-none placeholder:text-[#9aa3b7]" /></label>
    </div>
    <div role="listbox" aria-label="Available routes" className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {matches.map((route, index) => {
        const isSelected = String(route._id) === String(value);
        return <button key={route._id} type="button" role="option" aria-selected={isSelected} onClick={() => onChange(route._id)} className={`group flex min-h-[68px] min-w-0 items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7185c6] motion-reduce:transform-none motion-reduce:transition-none ${isSelected ? "border-[#455da8] bg-gradient-to-r from-[#263a70] to-[#536bb7] text-white shadow-[0_8px_20px_rgba(49,68,130,.2)] hover:brightness-110" : "border-[#e8ebf4] bg-white hover:-translate-y-0.5 hover:border-[#c8d1ed] hover:bg-[#f9faff] hover:shadow-[0_8px_18px_rgba(53,67,112,.08)]"}`}>
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-bold ${isSelected ? "bg-white/15 text-[#a5f1df]" : "bg-[#f0f2fb] text-[#7185c6] group-hover:bg-[#e9edff]"}`}>{String(index + 1).padStart(2, "0")}</span>
          <span className="min-w-0 flex-1"><span className={`block truncate text-xs font-bold ${isSelected ? "text-white" : "text-[#34405d]"}`}>{route.routeName}</span><span className={`mt-1 block truncate text-[10px] ${isSelected ? "text-white/70" : "text-[#8992a8]"}`}>{route.startPoint || "Start"}<span className={`px-1.5 ${isSelected ? "text-[#a5f1df]" : "text-[#20a992]"}`}>→</span>{route.endPoint || "End"}</span></span>
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs ${isSelected ? "bg-[#a5f1df] text-[#20345f]" : "bg-[#f4f6fc] text-[#8b97b4] opacity-0 transition group-hover:opacity-100"}`} aria-hidden="true">{isSelected ? "✓" : "→"}</span>
        </button>;
      })}
      {matches.length === 0 && <p className="rounded-xl bg-[#f7f8fc] p-4 text-xs text-[#74809a] sm:col-span-2 xl:col-span-3">No routes match that search.</p>}
    </div>
  </section>;
}
function BusMap({ routeId, stops, buses, selectedBusId, onSelectBus, mapController }) {
  const mapElement = useRef(null);
  const leafletRef = useRef(null);
  const mapRef = useRef(null);
  const routeLayerRef = useRef(null);
  const busLayerRef = useRef(null);
  const onSelectRef = useRef(onSelectBus);
  const [mapReady, setMapReady] = useState(false);
  onSelectRef.current = onSelectBus;

  useEffect(() => {
    let cancelled = false;
    let resizeObserver;
    let resizeHandler;
    import("leaflet").then((module) => {
      if (cancelled || !mapElement.current) return;
      const L = module.default || module;
      leafletRef.current = L;
      const map = L.map(mapElement.current, { zoomControl: false, preferCanvas: true }).setView(FAISALABAD_CENTER, 13);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>',
      }).addTo(map);
      routeLayerRef.current = L.layerGroup().addTo(map);
      busLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      if (mapController) mapController.current = map;
      setMapReady(true);

      if ("ResizeObserver" in window) {
        resizeObserver = new ResizeObserver(() => map.invalidateSize({ pan: false }));
        resizeObserver.observe(mapElement.current);
      } else {
        resizeHandler = () => map.invalidateSize({ pan: false });
        window.addEventListener("resize", resizeHandler);
      }
      window.setTimeout(() => map.invalidateSize({ pan: false }), 80);
    }).catch(() => {});

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        routeLayerRef.current = null;
        busLayerRef.current = null;
        leafletRef.current = null;
      }
      setMapReady(false);
      if (mapController) mapController.current = null;
    };
  }, [mapController]);

  const pathKey = stops.map((stop) => `${stop.stopName}:${stop.latitude}:${stop.longitude}`).join("|");
  const lastPathKey = useRef("");

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const routeLayer = routeLayerRef.current;
    if (!mapReady || !L || !map || !routeLayer) return;
    routeLayer.clearLayers();

    const routePoints = stops
      .filter((stop) => stop.latitude != null && stop.longitude != null && Number.isFinite(Number(stop.latitude)) && Number.isFinite(Number(stop.longitude)))
      .map((stop) => [Number(stop.latitude), Number(stop.longitude)]);

    if (routePoints.length > 1) {
      L.polyline(routePoints, { color: "#20bba5", weight: 5, opacity: 0.88, dashArray: "8 9", lineCap: "round" }).addTo(routeLayer);
    }
    stops.forEach((stop, index) => {
      if (stop.latitude == null || stop.longitude == null || !Number.isFinite(Number(stop.latitude)) || !Number.isFinite(Number(stop.longitude))) return;
      L.circleMarker([Number(stop.latitude), Number(stop.longitude)], {
        radius: index === 0 || index === stops.length - 1 ? 8 : 6,
        color: "#ffffff", weight: 3, fillColor: index === 0 || index === stops.length - 1 ? "#20bba5" : "#7185c6", fillOpacity: 1,
      }).bindTooltip(tooltipText(stop.stopName), { direction: "top", offset: [0, -6] }).addTo(routeLayer);
    });

    const currentPathKey = `${routeId}|${pathKey}`;
    if (currentPathKey !== lastPathKey.current) {
      lastPathKey.current = currentPathKey;
      if (routePoints.length > 1) map.fitBounds(L.latLngBounds(routePoints), { padding: [34, 34], maxZoom: 14 });
      else map.setView(FAISALABAD_CENTER, 13);
    }
  }, [mapReady, routeId, pathKey, stops]);

  useEffect(() => {
    const L = leafletRef.current;
    const busLayer = busLayerRef.current;
    if (!mapReady || !L || !busLayer) return;
    busLayer.clearLayers();

    buses.forEach((bus) => {
      const rawLatitude = bus.currentLocation?.latitude;
      const rawLongitude = bus.currentLocation?.longitude;
      if (rawLatitude == null || rawLongitude == null) return;
      const latitude = Number(rawLatitude);
      const longitude = Number(rawLongitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
      const isSelected = String(bus._id) === String(selectedBusId);
      const statusClass = bus.status === "maintenance" ? " is-maintenance" : bus.status === "idle" ? " is-idle" : "";
      const icon = L.divIcon({
        className: "ss-leaflet-marker",
        html: `<span class="ss-bus-pin${isSelected ? " is-selected" : ""}${statusClass}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M5 16.5h14V7.8A1.8 1.8 0 0 0 17.2 6H6.8A1.8 1.8 0 0 0 5 7.8v8.7ZM5 12h14M8 9h.01M12 9h.01M16 9h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8" cy="17.5" r="1.6" fill="currentColor"/><circle cx="16" cy="17.5" r="1.6" fill="currentColor"/></svg></span>`,
        iconSize: [38, 38], iconAnchor: [19, 19],
      });
      const marker = L.marker([latitude, longitude], { icon, keyboard: true, title: bus.busNumber || "Transit bus" });
      marker.bindTooltip(tooltipText(bus.busNumber || "Transit bus"), { direction: "top", offset: [0, -17] });
      marker.on("click", () => onSelectRef.current(bus._id));
      marker.addTo(busLayer);
    });
  }, [mapReady, buses, selectedBusId]);

  return <div ref={mapElement} className="h-full w-full rounded-[1.35rem] bg-[#e6e9f4]" role="application" aria-label="Interactive Leaflet map showing Faisalabad bus routes and stops" />;
}

export default function LiveMapExperience() {
  const [routes, setRoutes] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = readSavedCache("/routes");
      if (saved?.data && Array.isArray(saved.data) && saved.data.length) return saved.data;
    }
    return faisalabadDemoRoutes;
  });
  const [routeId, setRouteId] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = readSavedCache("/routes");
      if (saved?.data && Array.isArray(saved.data) && saved.data.length) return saved.data[0]._id;
    }
    return faisalabadDemoRoutes[0]._id;
  });
  const [buses, setBuses] = useState(() => {
    if (typeof window !== "undefined") {
      const savedBuses = readSavedCache("/buses");
      if (savedBuses?.data && Array.isArray(savedBuses.data) && savedBuses.data.length) return savedBuses.data;
    }
    return makeDemoBuses();
  });
  const [stops, setStops] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = readSavedCache("/routes");
      if (saved?.data && Array.isArray(saved.data) && saved.data.length) {
        const savedStops = readSavedCache(`/stops/route/${saved.data[0]._id}`);
        if (savedStops?.data && Array.isArray(savedStops.data) && savedStops.data.length) return savedStops.data;
      }
    }
    return demoStopsForRoute(faisalabadDemoRoutes[0]);
  });
  const [dataSource, setDataSource] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = readSavedCache("/routes");
      if (saved?.data && Array.isArray(saved.data) && saved.data.length) return "saved";
    }
    return "demo";
  });
  const [selectedBusId, setSelectedBusId] = useState(() => faisalabadDemoRoutes[0].buses[0]._id);
  const [realtimeStatus, setRealtimeStatus] = useState("demo");
  const [busQuery, setBusQuery] = useState("");
  const [mapMessage, setMapMessage] = useState("");
  const mapController = useRef(null);

  useEffect(() => {
    const saved = readBookingSelection();
    const params = new URLSearchParams(window.location.search);
    const initialRoute = params.get('route') || saved.routeId;
    const initialBus = params.get('bus') || saved.busId;
    if (initialRoute) setRouteId(initialRoute);
    if (initialBus) setSelectedBusId(initialBus);
    let active = true;
    Promise.all([apiRequest("/routes"), apiRequest("/buses")]).then(([routeResult, busResult]) => {
      if (!active) return;
      const liveRoutes = Array.isArray(routeResult) ? routeResult : [];
      if (!liveRoutes.length) return;
      const liveBuses = Array.isArray(busResult) ? busResult : [];
      setRoutes(liveRoutes);
      setRouteId((current) => liveRoutes.some((route) => String(route._id) === String(initialRoute || current)) ? (initialRoute || current) : liveRoutes[0]._id);
      setBuses(liveBuses);
      setSelectedBusId((current) => liveBuses.some((bus) => String(bus._id) === String(initialBus || current)) ? (initialBus || current) : liveBuses[0]?._id || null);
      setDataSource(typeof navigator !== "undefined" && !navigator.onLine ? "saved" : "backend");
      setRealtimeStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "connecting");
    }).catch(() => {
      if (!active) return;
      const savedRoutes = readSavedCache("/routes");
      if (savedRoutes?.data && Array.isArray(savedRoutes.data) && savedRoutes.data.length) {
        const liveRoutes = savedRoutes.data;
        setRoutes(liveRoutes);
        setRouteId((current) => liveRoutes.some((route) => String(route._id) === String(initialRoute || current)) ? (initialRoute || current) : liveRoutes[0]._id);
        const savedBuses = readSavedCache("/buses");
        const liveBuses = Array.isArray(savedBuses?.data) ? savedBuses.data : [];
        if (liveBuses.length) setBuses(liveBuses);
        setSelectedBusId((current) => liveBuses.some((bus) => String(bus._id) === String(initialBus || current)) ? (initialBus || current) : liveBuses[0]?._id || null);
        setDataSource("saved");
        setRealtimeStatus("offline");
      }
    });
    return () => { active = false; };
  }, []);

  const selectedRoute = routes.find((route) => route._id === routeId) || routes[0];

  useEffect(() => {
    if (!selectedRoute) return undefined;
    if (dataSource === "demo") {
      setStops(demoStopsForRoute(selectedRoute));
      return undefined;
    }
    let active = true;
    setStops([]);
    apiRequest(`/stops/route/${encodeURIComponent(selectedRoute._id)}`)
      .then((result) => { if (active) setStops(Array.isArray(result) ? result : []); })
      .catch(() => { if (active) setStops([]); });
    return () => { active = false; };
  }, [selectedRoute?._id, dataSource]);

  const visibleBuses = useMemo(() => buses.filter((bus) => routeIdForBus(bus) === routeId), [buses, routeId]);
  const matchingBuses = useMemo(() => {
    const term = busQuery.trim().toLowerCase();
    return visibleBuses.filter((bus) => !term || `${bus.busNumber || ""} ${displayStatus(bus.status)}`.toLowerCase().includes(term));
  }, [visibleBuses, busQuery]);
  const selectedBus = visibleBuses.find((bus) => String(bus._id) === String(selectedBusId)) || visibleBuses[0] || null;
  const visibleBusIds = visibleBuses.map((bus) => bus._id).filter(Boolean).join(",");

  useEffect(() => {
    if (dataSource !== "demo") return undefined;
    let tick = 0;
    const timer = window.setInterval(() => {
      tick += 1;
      setBuses((current) => current.map((bus, index) => {
        if (bus.status !== "active" || !bus.demoOrigin) return bus;
        const drift = Math.sin(tick * 0.48 + index) * 0.0017;
        const cross = Math.cos(tick * 0.38 + index) * 0.0015;
        return { ...bus, currentLocation: { latitude: bus.demoOrigin.latitude + drift, longitude: bus.demoOrigin.longitude + cross } };
      }));
    }, 5000);
    return () => window.clearInterval(timer);
  }, [dataSource]);

  useEffect(() => {
    if (dataSource !== "backend" || !visibleBusIds) return undefined;
    const socket = createTransitSocket();
    const watchedIds = visibleBusIds.split(",");
    socket.on("connect", () => {
      setRealtimeStatus("live");
      watchedIds.forEach((id) => socket.emit("watchBus", id));
    });
    socket.on("connect_error", () => setRealtimeStatus("reconnecting"));
    socket.on("disconnect", () => setRealtimeStatus("reconnecting"));
    socket.on("locationUpdate", (update) => {
      setBuses((current) => current.map((bus) => String(bus._id) === String(update.busId) ? {
        ...bus,
        currentLocation: { latitude: update.latitude, longitude: update.longitude },
        lastLocationUpdate: update.lastLocationUpdate,
        status: update.status,
        nextStop: update.nextStop,
        etaMinutes: update.etaMinutes,
        direction: update.direction,
      } : bus));
    });
    socket.on("seatStateUpdate", (update) => {
      if (!update?.busId) return;
      setBuses((current) => current.map((bus) => String(bus._id) === String(update.busId) ? { ...bus, availableSeats: update.available, ...(update.capacity != null ? { capacity: update.capacity } : {}) } : bus));
    });
    socket.connect();
    return () => socket.disconnect();
  }, [dataSource, visibleBusIds]);

  function locateMe() {
    if (!navigator.geolocation) {
      setMapMessage("Location is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      mapController.current?.setView([coords.latitude, coords.longitude], 15, { animate: true });
      setMapMessage("Showing your current location on the map.");
    }, () => setMapMessage("Allow location access in your browser to show where you are."), { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-100">
      {/* Fullscreen Map under app bar */}
      <div className="absolute inset-0 z-0">
        <BusMap
          routeId={routeId}
          stops={stops}
          buses={visibleBuses}
          selectedBusId={selectedBus?._id}
          onSelectBus={(id) => {
            setSelectedBusId(id);
            saveBookingSelection({ routeId, busId: id });
          }}
          mapController={mapController}
        />
      </div>

      {/* Floating Top Control Pills */}
      <div className="absolute inset-x-3 top-3 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center justify-between gap-2 pointer-events-auto">
          {/* Route selector dropdown */}
          <div className="flex-1 max-w-xs">
            <select
              value={routeId}
              onChange={(e) => {
                const nextRouteId = e.target.value;
                setRouteId(nextRouteId);
                setSelectedBusId(null);
                saveBookingSelection({ routeId: nextRouteId, busId: "" });
              }}
              className="h-10 w-full rounded-xl border border-slate-200/90 bg-white/95 px-3 text-xs font-bold text-[#111d3d] shadow-md backdrop-blur-md focus:outline-none"
            >
              {routes.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.routeName}
                </option>
              ))}
            </select>
          </div>

          {/* Locate me button */}
          <button
            onClick={locateMe}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200/90 bg-white/95 text-[#536bb7] shadow-md backdrop-blur-md active:scale-90"
            aria-label="Locate me"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4.5 w-4.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
            </svg>
          </button>
        </div>

        {/* Live indicator chip */}
        <div className="self-start pointer-events-auto">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-xs backdrop-blur-md ${
            realtimeStatus === "live"
              ? "bg-emerald-500/90 text-white"
              : dataSource === "saved"
              ? "bg-slate-700/80 text-white"
              : "bg-amber-500/90 text-white"
          }`}>
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            {realtimeStatus === "live" ? "Live tracking" : dataSource === "saved" ? "Offline cache" : "Simulated"}
          </span>
        </div>
      </div>

      {/* Floating Bottom Sheet for Selected Bus & Route */}
      <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none">
        <div className="mx-auto max-w-lg rounded-t-2xl border-t border-slate-200 bg-white/98 p-4 shadow-xl backdrop-blur-md pointer-events-auto">
          <div className="bottom-sheet-handle !my-1" />

          {selectedBus ? (
            <div className="flex flex-col gap-2.5 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-[#111d3d]">{selectedBus.busNumber || "Transit bus"}</span>
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      {displayStatus(selectedBus.status)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedRoute?.routeName || "Route in service"}
                  </p>
                </div>
                <Link
                  href={`/passenger?route=${encodeURIComponent(routeId)}&bus=${encodeURIComponent(selectedBus._id)}#booking`}
                  className="rounded-xl bg-[#536bb7] px-3.5 py-2 text-xs font-bold text-white shadow-xs active:bg-[#43599f]"
                >
                  Book this bus
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-slate-50 p-2">
                  <span className="block text-[9px] font-bold uppercase text-slate-400">Seats Free</span>
                  <span className="text-xs font-bold text-[#111d3d]">
                    {selectedBus.availableSeats ?? "—"}{selectedBus.capacity != null ? ` / ${selectedBus.capacity}` : ""}
                  </span>
                </div>
                <div className="rounded-xl bg-slate-50 p-2">
                  <span className="block text-[9px] font-bold uppercase text-slate-400">Next Stop</span>
                  <span className="text-xs font-bold text-[#111d3d] truncate block">
                    {selectedBus.nextStop?.stopName || selectedBus.nextStop || "Clock Tower"}
                  </span>
                </div>
                <div className="rounded-xl bg-slate-50 p-2">
                  <span className="block text-[9px] font-bold uppercase text-slate-400">ETA</span>
                  <span className="text-xs font-bold text-[#536bb7]">
                    {selectedBus.etaMinutes != null ? `${Math.round(selectedBus.etaMinutes)} min` : "Nearby"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-2 text-center text-xs text-slate-500">
              Tap a bus marker on the map to view live seats and ETA.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


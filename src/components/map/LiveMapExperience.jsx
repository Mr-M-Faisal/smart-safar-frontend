"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRoutes } from "@/lib/data/hooks";
import formatCacheAge from "@/lib/data/formatCacheAge";
import { subscribeBus } from "@/lib/realtime";
import usePolling from "@/lib/usePolling";
import { apiRequest } from "@/lib/api";
import { demoModeEnabled, loadDemoData } from "@/lib/data/demoData";
import { getDataViewState } from "@/lib/data/viewState.cjs";
import { MapSkeleton } from "@/components/ui/skeleton/Skeleton";
import { FAISALABAD_CENTER } from "@/data/mapConfig";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { readBookingSelection, saveBookingSelection } from "@/lib/bookingSelection";
import { getLocationFreshness, useLocationClock } from "@/lib/locationFreshness";
import { SERVICE_AREA_BOUNDS, normalizeServiceCoordinate } from "@/data/serviceArea";
import BookingLink from "@/components/layout/BookingLink";

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
function BusMap({ routeId, stops, buses, selectedBusId, onSelectBus, mapController, dataSource, locationClock }) {
  const mapElement = useRef(null);
  const leafletRef = useRef(null);
  const mapRef = useRef(null);
  const routeLayerRef = useRef(null);
  const busLayerRef = useRef(null);
  const markerRegistryRef = useRef(new Map());
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
      const map = L.map(mapElement.current, { zoomControl: false, preferCanvas: true, minZoom: 9, maxBounds: L.latLngBounds(SERVICE_AREA_BOUNDS).pad(0.12), maxBoundsViscosity: 1 }).setView(FAISALABAD_CENTER, 13);
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
      window.addEventListener("smart-safar:map-layout-changed", onLayoutChange);

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
      window.removeEventListener("smart-safar:map-layout-changed", onLayoutChange);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        routeLayerRef.current = null;
        busLayerRef.current = null;
        markerRegistryRef.current.clear();
        leafletRef.current = null;
      }
      setMapReady(false);
      if (mapController) mapController.current = null;
    };
  }, [mapController]);

  function onLayoutChange() { mapRef.current?.invalidateSize({ pan: false }); }

  const orderedStops = useMemo(() => (Array.isArray(stops) ? [...stops] : []).sort((left, right) => {
    const orderDifference = (Number(left.stopOrder) || 0) - (Number(right.stopOrder) || 0);
    return orderDifference || String(left._id || left.stopName || "").localeCompare(String(right._id || right.stopName || ""));
  }), [stops]);
  const pathKey = orderedStops.map((stop) => `${stop._id || stop.stopName}:${stop.stopOrder}:${stop.latitude}:${stop.longitude}`).join("|");
  const lastPathKey = useRef("");

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const routeLayer = routeLayerRef.current;
    if (!mapReady || !L || !map || !routeLayer) return;
    routeLayer.clearLayers();

    const locatedStops = orderedStops.map((stop, index) => ({
      stop,
      index,
      point: normalizeServiceCoordinate(stop.latitude, stop.longitude, { label: "stop", id: stop._id || stop.stopName }),
    })).filter((entry) => entry.point);
    const routePoints = locatedStops.map(({ point }) => point);

    if (routePoints.length > 1) {
      L.polyline(routePoints, { color: "#ffffff", weight: 11, opacity: 0.94, lineCap: "round", lineJoin: "round" }).addTo(routeLayer);
      L.polyline(routePoints, { color: "#168f80", weight: 6, opacity: 1, lineCap: "round", lineJoin: "round" }).addTo(routeLayer);
    }
    locatedStops.forEach(({ stop, index, point }) => {
      const isStart = index === 0;
      const isEnd = index === orderedStops.length - 1;
      const color = isStart ? "#168f80" : isEnd ? "#e49353" : "#536bb7";
      L.marker(point, {
        icon: L.divIcon({
          className: "ss-route-stop-marker",
          html: `<span style="display:grid;place-items:center;width:34px;height:34px;border:3px solid #fff;border-radius:50%;background:${color};color:#fff;font:700 12px/1 sans-serif;box-shadow:0 2px 9px #25304f66">${index + 1}</span>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        }),
        keyboard: true,
        title: stop.stopName || `Stop ${index + 1}`,
      }).bindTooltip(tooltipText(stop.stopName || `Stop ${index + 1}`), { direction: "top", offset: [0, -8] }).addTo(routeLayer);
    });

    const currentPathKey = `${routeId}|${pathKey}`;
    if (currentPathKey !== lastPathKey.current) {
      lastPathKey.current = currentPathKey;
      if (routePoints.length > 1) map.fitBounds(L.latLngBounds(routePoints), { padding: [44, 44], maxZoom: 14 });
      else if (routePoints.length === 1) map.setView(routePoints[0], 15);
      else map.setView(FAISALABAD_CENTER, 13);
    }
  }, [mapReady, routeId, pathKey, orderedStops]);

  useEffect(() => {
    const L = leafletRef.current;
    const busLayer = busLayerRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !busLayer || !map) return undefined;
    const frame = window.requestAnimationFrame(() => {
      const located = buses.filter((bus) => (dataSource === "demo" || getLocationFreshness(bus.lastLocationUpdate, locationClock).available) && normalizeServiceCoordinate(bus.currentLocation?.latitude, bus.currentLocation?.longitude, { label: "bus", id: bus._id || bus.busNumber }));
      const entries = new Map();
      if (located.length > 100) {
        located.forEach((bus) => {
          const [latitude, longitude] = normalizeServiceCoordinate(bus.currentLocation.latitude, bus.currentLocation.longitude, { label: "bus", id: bus._id || bus.busNumber });
          const gridKey = `${Math.round(latitude / 0.005)}:${Math.round(longitude / 0.005)}`;
          if (!entries.has(gridKey)) entries.set(gridKey, []);
          entries.get(gridKey).push(bus);
        });
      } else located.forEach((bus) => entries.set(`bus:${bus._id}`, [bus]));

      const visibleKeys = new Set();
      for (const [groupKey, members] of entries) {
        const isCluster = members.length > 1;
        const key = isCluster ? `cluster:${groupKey}` : `bus:${members[0]._id}`;
        const bus = members[0];
        const coordinates = members.map((item) => normalizeServiceCoordinate(item.currentLocation.latitude, item.currentLocation.longitude, { label: "bus", id: item._id || item.busNumber }));
        const latitude = coordinates.reduce((sum, point) => sum + point[0], 0) / members.length;
        const longitude = coordinates.reduce((sum, point) => sum + point[1], 0) / members.length;
        const selected = !isCluster && String(bus._id) === String(selectedBusId);
        const statusClass = bus.status === "maintenance" ? " is-maintenance" : bus.status === "idle" ? " is-idle" : "";
        const styleKey = isCluster ? `cluster:${members.length}` : `bus:${selected}:${statusClass}`;
        const icon = isCluster
          ? L.divIcon({ className: "ss-bus-cluster-wrap", html: `<span class="ss-bus-cluster">${members.length}</span>`, iconSize: [42, 42], iconAnchor: [21, 21] })
          : L.divIcon({ className: "ss-leaflet-marker", html: `<span class="ss-bus-pin${selected ? " is-selected" : ""}${statusClass}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M5 16.5h14V7.8A1.8 1.8 0 0 0 17.2 6H6.8A1.8 1.8 0 0 0 5 7.8v8.7ZM5 12h14M8 9h.01M12 9h.01M16 9h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8" cy="17.5" r="1.6" fill="currentColor"/><circle cx="16" cy="17.5" r="1.6" fill="currentColor"/></svg></span>`, iconSize: [38, 38], iconAnchor: [19, 19] });
        let entry = markerRegistryRef.current.get(key);
        if (!entry) {
          const marker = L.marker([latitude, longitude], { icon, keyboard: true, title: isCluster ? `${members.length} transit buses` : bus.busNumber || "Transit bus" }).addTo(busLayer);
          if (isCluster) {
            marker.bindTooltip(tooltipText(`${members.length} buses nearby`), { direction: "top" });
            marker.on("click", () => {
              const currentMembers = markerRegistryRef.current.get(key)?.members || [];
              if (currentMembers.length) map.fitBounds(L.latLngBounds(currentMembers.map((item) => [Number(item.currentLocation.latitude), Number(item.currentLocation.longitude)])).pad(0.4), { maxZoom: 16 });
            });
          } else {
            marker.bindTooltip(tooltipText(bus.busNumber || "Transit bus"), { direction: "top", offset: [0, -17] });
            marker.on("click", () => onSelectRef.current(bus._id));
          }
          entry = { marker, styleKey, members };
          markerRegistryRef.current.set(key, entry);
        } else {
          entry.marker.setLatLng([latitude, longitude]);
          entry.members = members;
          if (entry.styleKey !== styleKey) { entry.marker.setIcon(icon); entry.styleKey = styleKey; }
          entry.marker.options.title = isCluster ? `${members.length} transit buses` : bus.busNumber || "Transit bus";
          entry.marker.setTooltipContent(tooltipText(isCluster ? `${members.length} buses nearby` : bus.busNumber || "Transit bus"));
        }
        visibleKeys.add(key);
      }
      for (const [key, entry] of markerRegistryRef.current) {
        if (visibleKeys.has(key)) continue;
        busLayer.removeLayer(entry.marker);
        markerRegistryRef.current.delete(key);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [mapReady, buses, selectedBusId, dataSource, locationClock]);

  return <div ref={mapElement} className="h-full w-full rounded-[1.35rem] bg-[#e6e9f4]" role="application" aria-label="Interactive Leaflet map showing Faisalabad bus routes and stops" />;
}

export default function LiveMapExperience() {
  const locationClock = useLocationClock();
  const routesResource = useRoutes();
  const initialRoutes = Array.isArray(routesResource.data) ? routesResource.data : [];
  const [routes, setRoutes] = useState(initialRoutes);
  const [routeId, setRouteId] = useState(initialRoutes[0]?._id || "");
  const [buses, setBuses] = useState(() => initialRoutes.flatMap((route) => (route.buses || []).map((bus) => ({ ...bus, route: { _id: route._id, routeName: route.routeName } }))));
  const [dataSource, setDataSource] = useState(() => routesResource.hasCache ? "saved" : initialRoutes.length ? "backend" : "loading");
  const [demoData, setDemoData] = useState(null);
  const [selectedBusId, setSelectedBusId] = useState(null);
  const [realtimeStatus, setRealtimeStatus] = useState("connecting");
  const [busQuery, setBusQuery] = useState("");
  const [mapMessage, setMapMessage] = useState("");
  const mapController = useRef(null);
  const initialRouteSelectionApplied = useRef(false);
  const initialBusSelectionApplied = useRef(false);

  const selectedRoute = routes.find((route) => String(route._id) === String(routeId)) || routes[0] || null;
  const stops = useMemo(() => {
    if (!selectedRoute) return [];
    if (dataSource === "demo") return demoData?.demoStopsForRoute(selectedRoute) || [];
    return Array.isArray(selectedRoute.stops) ? selectedRoute.stops : [];
  }, [selectedRoute, dataSource, demoData]);
  const locatedStopCount = useMemo(() => stops.filter((stop) => normalizeServiceCoordinate(stop.latitude, stop.longitude, { label: "stop", id: stop._id || stop.stopName })).length, [stops]);
  const stopsWithoutLocation = stops.length - locatedStopCount;
  const dataViewState = getDataViewState({ isLoading: dataSource === "loading", error: dataSource === "error" ? routesResource.error : null, data: routes, hasCache: dataSource === "saved" });

  useEffect(() => {
    const saved = readBookingSelection();
    const params = new URLSearchParams(window.location.search);
    const initialRoute = params.get('route') || saved.routeId;
    const initialBus = params.get('bus') || saved.busId;
    const liveRoutes = Array.isArray(routesResource.data) ? routesResource.data : [];
    let active = true;
    if (Array.isArray(routesResource.data) && liveRoutes.length) {
      setRoutes(liveRoutes);
      setBuses(liveRoutes.flatMap((route) => (route.buses || []).map((bus) => ({ ...bus, route: { _id: route._id, routeName: route.routeName } }))));
      setRouteId((current) => !initialRouteSelectionApplied.current && liveRoutes.some((route) => String(route._id) === String(initialRoute)) ? initialRoute : liveRoutes.some((route) => String(route._id) === String(current)) ? current : liveRoutes[0]._id);
      initialRouteSelectionApplied.current = true;
      const allBuses = liveRoutes.flatMap((route) => route.buses || []);
      setSelectedBusId((current) => !initialBusSelectionApplied.current && allBuses.some((bus) => String(bus._id) === String(initialBus)) ? initialBus : allBuses.some((bus) => String(bus._id) === String(current)) ? current : allBuses[0]?._id || null);
      initialBusSelectionApplied.current = true;
      setDataSource(routesResource.hasCache ? "saved" : "backend");
      setRealtimeStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "connecting");
    } else if (Array.isArray(routesResource.data)) {
      setRoutes([]); setBuses([]); setRouteId(""); setSelectedBusId(null); setDataSource("empty"); setRealtimeStatus("idle");
    } else if (routesResource.error) {
      if (demoModeEnabled) {
        void loadDemoData().then((data) => {
          if (!active) return;
          setDemoData(data);
          const demoRoutes = data?.faisalabadDemoRoutes || [];
          const demoBuses = demoRoutes.flatMap((route, routeIndex) => route.buses.map((bus, busIndex) => {
            const nextStop = typeof bus.nextStop === "string" ? bus.nextStop : bus.nextStop?.stopName;
            const point = data.faisalabadDemoCoordinates[nextStop] || FAISALABAD_CENTER;
            return { ...bus, route: { _id: route._id, routeName: route.routeName }, currentLocation: { latitude: point[0] + (busIndex % 2 ? -0.0016 : 0.0014), longitude: point[1] + (routeIndex % 2 ? -0.0013 : 0.0012) }, demoOrigin: { latitude: point[0], longitude: point[1] } };
          }));
          setRoutes(demoRoutes); setBuses(demoBuses); setRouteId(demoRoutes[0]?._id || ""); setSelectedBusId(demoBuses[0]?._id || null); setDataSource(demoRoutes.length ? "demo" : "error"); setRealtimeStatus("demo");
        });
      } else { setRoutes([]); setBuses([]); setRouteId(""); setSelectedBusId(null); setDataSource("error"); setRealtimeStatus("unavailable"); }
    }
    return () => { active = false; };
  }, [routesResource.data, routesResource.error, routesResource.hasCache]);

  const visibleBuses = useMemo(() => buses.filter((bus) => routeIdForBus(bus) === routeId), [buses, routeId]);
  const matchingBuses = useMemo(() => {
    const term = busQuery.trim().toLowerCase();
    return visibleBuses.filter((bus) => !term || `${bus.busNumber || ""} ${displayStatus(bus.status)}`.toLowerCase().includes(term));
  }, [visibleBuses, busQuery]);
  const selectedBus = visibleBuses.find((bus) => String(bus._id) === String(selectedBusId)) || visibleBuses[0] || null;
  const selectedBusFreshness = selectedBus && dataSource !== "demo" ? getLocationFreshness(selectedBus.lastLocationUpdate, locationClock) : null;
  const visibleBusIds = visibleBuses.map((bus) => bus._id).filter(Boolean).join(",");

  const refreshRouteOverview = async () => {
    const result = await apiRequest("/routes/overview", { cache: "no-store" });
    if (!Array.isArray(result)) return;
    setRoutes(result);
    setBuses(result.flatMap((route) => (route.buses || []).map((bus) => ({ ...bus, route: { _id: route._id, routeName: route.routeName } }))));
  };
  usePolling(refreshRouteOverview, 30000, { enabled: dataSource === "backend" });

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
    const onSocketStatus = (event) => setRealtimeStatus(event.detail?.connected ? "live" : "reconnecting");
    const onResume = () => { setRealtimeStatus("connecting"); void refreshRouteOverview().catch(() => setRealtimeStatus("reconnecting")); };
    window.addEventListener("smart-safar:socket-status", onSocketStatus);
    window.addEventListener("smart-safar:realtime-resume", onResume);
    const cleanups = visibleBusIds.split(",").map((id) => subscribeBus(id, {
      locationUpdate: (update) => {
      setBuses((current) => current.map((bus) => String(bus._id) === String(update.busId) ? {
        ...bus,
        currentLocation: { latitude: update.latitude, longitude: update.longitude },
        lastLocationUpdate: update.lastLocationUpdate,
        status: update.status,
        nextStop: update.nextStop,
        etaMinutes: update.etaMinutes,
        direction: update.direction,
      } : bus));
      setRealtimeStatus("live");
      },
      seatStateUpdate: (update) => {
      if (!update?.busId) return;
      setBuses((current) => current.map((bus) => String(bus._id) === String(update.busId) ? { ...bus, availableSeats: update.available, ...(update.capacity != null ? { capacity: update.capacity } : {}) } : bus));
      },
    }));
    return () => { cleanups.forEach((cleanup) => cleanup()); window.removeEventListener("smart-safar:socket-status", onSocketStatus); window.removeEventListener("smart-safar:realtime-resume", onResume); };
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
    <main className="min-w-0 overflow-x-clip bg-[#f4f5fb] px-4 py-8 text-[#25304f] sm:px-8 sm:py-12 lg:px-12">
      <div className="mx-auto w-full max-w-[1440px] min-w-0">
        <RevealOnScroll>
          <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#536bb7]">Faisalabad · transit network</p><h1 className="mt-3 break-words text-3xl font-semibold tracking-[-.04em] text-[#25304f] sm:text-4xl lg:text-5xl">Track buses around the city.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#68738e] sm:text-base">Choose a route to see its stops and buses on the map.</p></div>
          <RoutePicker routes={routes} value={routeId} onChange={(nextRouteId) => { setRouteId(nextRouteId); setSelectedBusId(null); saveBookingSelection({ routeId: nextRouteId, busId: "" }); }} />
        </RevealOnScroll>

        <div className="mt-6 flex min-w-0 flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${dataSource === "demo" ? "bg-amber-50 text-amber-800" : dataSource === "saved" ? "bg-slate-100 text-slate-700" : dataSource === "error" ? "bg-rose-50 text-rose-800" : "bg-[#e8faf4] text-[#167b6e]"}`}><span className={`h-1.5 w-1.5 rounded-full ${dataSource === "demo" ? "bg-amber-500" : dataSource === "saved" ? "bg-slate-500" : dataSource === "error" ? "bg-rose-500" : "bg-[#22bfa5]"}`}/>{dataSource === "demo" ? "Demo data · simulated locations" : dataSource === "saved" ? `Saved real data · ${formatCacheAge(routesResource.cachedAt) || "offline"}` : dataSource === "empty" ? "No routes published" : dataSource === "error" ? "Real transit data unavailable" : dataViewState === "loading" ? "Loading route data" : realtimeStatus === "live" ? "Live bus locations" : realtimeStatus === "reconnecting" ? "Live updates reconnecting · last location shown" : realtimeStatus === "unavailable" ? "Live updates unavailable" : "Transit data connected · waiting for GPS"}</span>
          {selectedRoute && <span className="max-w-full truncate rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#68738e]">{selectedRoute.startPoint} <span className="px-1 text-[#20a992]">→</span> {selectedRoute.endPoint}</span>}
        </div>

        <div className="mt-5 grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(310px,.85fr)]">
          <section className="min-w-0 rounded-[1.75rem] border border-white bg-white p-2.5 shadow-[0_16px_42px_rgba(53,67,112,.1)] sm:p-3" aria-label="Bus map">
            <div className="relative h-[42svh] min-h-[280px] max-h-[430px] w-full min-w-0 overflow-hidden rounded-[1.4rem] bg-[#e6e9f4] sm:h-[48svh] sm:min-h-[340px] sm:max-h-[520px] lg:h-[60vh] lg:min-h-[420px] lg:max-h-[650px]">
              <BusMap routeId={routeId} stops={stops} buses={visibleBuses} selectedBusId={selectedBus?._id} onSelectBus={(id) => { setSelectedBusId(id); saveBookingSelection({ routeId, busId: id }); }} mapController={mapController} dataSource={dataSource} locationClock={locationClock}/>
              {selectedRoute && stops.length === 0 && dataSource !== "loading" && <p role="status" className="pointer-events-none absolute left-1/2 top-3 z-[450] -translate-x-1/2 rounded-full border border-white/80 bg-white/95 px-3 py-1.5 text-xs font-medium text-[#596681] shadow-sm">No stops have been added to this route yet.</p>}
              {stopsWithoutLocation > 0 && <p role="status" className="pointer-events-none absolute left-1/2 top-3 z-[450] -translate-x-1/2 rounded-full border border-amber-200 bg-amber-50/95 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm">{stopsWithoutLocation} {stopsWithoutLocation === 1 ? "stop has" : "stops have"} no map location</p>}
              {stops.length > 0 && locatedStopCount === 1 && stopsWithoutLocation === 0 && <p role="status" className="pointer-events-none absolute left-1/2 top-3 z-[450] -translate-x-1/2 rounded-full border border-white/80 bg-white/95 px-3 py-1.5 text-xs font-medium text-[#596681] shadow-sm">Showing the stop. Add another stop to draw the route line.</p>}
              {dataSource === "loading" && <div className="absolute inset-0 z-[600]"><MapSkeleton className="!min-h-0 h-full rounded-[1.4rem]" /></div>}
              {(dataSource === "error" || dataSource === "empty") && <div role={dataSource === "error" ? "alert" : "status"} className="absolute inset-x-4 top-16 z-[600] mx-auto max-w-sm rounded-2xl border border-white bg-white/95 p-4 text-center text-sm text-[#596681] shadow-lg">{dataSource === "error" ? <>We couldn’t load real route data. <button onClick={() => void routesResource.refresh()} className="font-semibold text-[#536bb7] underline">Retry</button>{demoModeEnabled && <span className="mt-1 block text-xs">Demo data is available when demo mode is enabled.</span>}</> : "The transit service has no routes to show yet."}</div>}
              <button onClick={locateMe} className="absolute left-3 top-3 z-[500] inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/80 bg-white/95 px-3.5 text-xs font-semibold text-[#465a9c] shadow-md backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg" aria-label="Show my current location"><span aria-hidden="true">◎</span><span className="hidden sm:inline">My location</span></button>
              <div className="absolute bottom-3 left-3 z-[400] flex flex-wrap gap-3 rounded-xl border border-white/80 bg-white/95 px-3 py-2 text-[10px] font-semibold text-[#596681] shadow-md backdrop-blur"><span className="inline-flex items-center gap-1.5"><i className="h-0.5 w-4 rounded bg-[#168f80]"/>Selected route</span><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#20bba5]"/>Bus</span><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#536bb7]"/>Stop</span></div>
            </div>
            {mapMessage && <p role="status" className="px-3 pt-3 text-xs text-[#68738e]">{mapMessage}</p>}
          </section>

          <aside className="min-w-0 rounded-[1.75rem] border border-white bg-[#e9ebf8] p-4 shadow-[0_16px_42px_rgba(53,67,112,.09)] sm:p-5">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#536bb7]">Selected route</p><h2 className="mt-2 break-words text-xl font-semibold text-[#293553]">{selectedRoute?.routeName || "Transit routes"}</h2><p className="mt-1 text-xs text-[#7b859c]">{stops.length} stops · {visibleBuses.length} buses</p></div><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-[#536bb7] shadow-sm" aria-hidden="true">⌖</span></div>
            {selectedRoute && <BookingLink routeId={selectedRoute._id} busId={selectedBus?._id} requireAccount className="mt-3 flex min-h-11 items-center justify-between rounded-xl bg-[#536bb7] px-4 text-xs font-semibold text-white shadow-[0_7px_18px_rgba(83,107,183,.18)] transition hover:-translate-y-0.5 hover:bg-[#43599f]"><span>Book this route</span><span aria-hidden="true">→</span></BookingLink>}

            <div className="mt-5 rounded-2xl border border-white/90 bg-[#fffdf8] p-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-[.13em] text-[#68738e]">Bus details</h3>
              {selectedBus ? <><div className="mt-3 flex items-center justify-between gap-3"><p className="text-lg font-bold text-[#293553]">{selectedBus.busNumber || "Transit bus"}</p><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${selectedBus.status === "active" ? "bg-[#e4f8f0] text-[#18846f]" : "bg-[#eef0fa] text-[#687697]"}`}>{displayStatus(selectedBus.status)}</span></div><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#f1f2fa] p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-[#818ba2]">Seats free</p><p className="mt-1 text-base font-bold text-[#34405d]">{selectedBus.availableSeats ?? "—"}<span className="text-xs font-medium text-[#7b859c]">{selectedBus.capacity != null ? ` / ${selectedBus.capacity}` : ""}</span></p></div><div className="rounded-xl bg-[#f1f2fa] p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-[#818ba2]">Next stop</p><p className="mt-1 truncate text-sm font-bold text-[#34405d]">{selectedBusFreshness?.available === false ? "Location unavailable" : selectedBus.nextStop?.stopName || selectedBus.nextStop || "Awaiting update"}</p></div></div><p className="mt-3 text-xs text-[#7b859c]">{dataSource === "demo" ? (selectedBus.etaMinutes != null ? `Estimated arrival · ${Math.round(selectedBus.etaMinutes)} min` : "Sample position updates every few seconds") : selectedBusFreshness?.label || "Location unavailable"}</p></> : <p className="mt-3 text-sm leading-6 text-[#7b859c]">{dataSource === "error" ? "Bus information is unavailable until a connection returns." : dataSource === "empty" ? "No buses are running on this route right now." : "No bus with a current GPS location is available on this route yet."}</p>}
            </div>

            <div className="mt-5"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-[#394562]">Buses on this route</h3><span className="text-xs text-[#7b859c]">{matchingBuses.length}</span></div><label className="mt-3 flex items-center gap-2 rounded-xl border border-white/90 bg-white px-3 py-2.5"><span className="text-sm text-[#8290b0]" aria-hidden="true">⌕</span><span className="sr-only">Search buses</span><input value={busQuery} onChange={(event) => setBusQuery(event.target.value)} placeholder="Find a bus" className="min-w-0 flex-1 bg-transparent text-xs text-[#34405d] outline-none placeholder:text-[#9aa3b7]"/></label>
              <div className="long-content-list mt-3 max-h-[300px] space-y-2 overflow-y-auto pr-1">{matchingBuses.map((bus) => <button key={bus._id || bus.busNumber} onClick={() => { setSelectedBusId(bus._id); saveBookingSelection({ routeId, busId: bus._id }); }} aria-pressed={String(bus._id) === String(selectedBus?._id)} className={`flex min-h-[62px] w-full items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-left transition ${String(bus._id) === String(selectedBus?._id) ? "border-[#b8c5ee] bg-white shadow-sm" : "border-white/70 bg-white/55 hover:bg-white"}`}><span className="min-w-0"><span className="block truncate text-sm font-semibold text-[#34405d]">{bus.busNumber || "Transit bus"}</span><span className="mt-1 block truncate text-[11px] text-[#7b859c]">{dataSource === "demo" ? (bus.nextStop?.stopName || bus.nextStop || displayStatus(bus.status)) : getLocationFreshness(bus.lastLocationUpdate, locationClock).label}</span></span><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${bus.status === "active" ? "bg-[#20bba5]" : bus.status === "maintenance" ? "bg-[#f39a55]" : "bg-[#98a2ba]"}`} aria-label={displayStatus(bus.status)}/></button>)}{matchingBuses.length === 0 && <p className="rounded-xl bg-white/70 p-4 text-xs leading-5 text-[#7b859c]">{visibleBuses.length ? "No buses match this search." : "No buses running on this route right now."}</p>}</div>
            </div>
            <p className="mt-4 text-[10px] leading-4 text-[#808aa1]">{dataSource === "demo" ? "Demo locations are approximate and simulated for this prototype." : "Bus markers update from the Smart Safar location service."}</p>
          </aside>
        </div>
      </div>
    </main>
  );
}

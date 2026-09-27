"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import LeafletRouteMap from "@/components/map/LeafletRouteMap";
import { FAISALABAD_CENTER, demoStopsForRoute, faisalabadDemoCoordinates, faisalabadDemoRoutes } from "@/data/faisalabad-demo";

function makeDemoBuses() {
  return faisalabadDemoRoutes.flatMap((route, routeIndex) => route.buses.map((bus, busIndex) => {
    const nextStop = typeof bus.nextStop === "string" ? bus.nextStop : bus.nextStop?.stopName;
    const point = faisalabadDemoCoordinates[nextStop] || FAISALABAD_CENTER;
    return { ...bus, route: { _id: route._id }, currentLocation: { latitude: point[0] + (busIndex % 2 ? -0.0012 : 0.0012), longitude: point[1] + (routeIndex % 2 ? -0.001 : 0.001) } };
  }));
}

const localSegments = faisalabadDemoRoutes.map((route) => ({ routeId: route._id, routeName: route.routeName, stops: demoStopsForRoute(route) }));

export default function HomeRouteMap() {
  const [segments, setSegments] = useState(localSegments);
  const [buses, setBuses] = useState(makeDemoBuses);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [source, setSource] = useState("demo");
  const [mapVisible, setMapVisible] = useState(false);
  const mapContainerRef = useRef(null);

  useEffect(() => {
    const element = mapContainerRef.current;
    if (!element) return undefined;
    if (!("IntersectionObserver" in window)) { setMapVisible(true); return undefined; }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setMapVisible(true);
      observer.disconnect();
    }, { rootMargin: "280px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!mapVisible) return undefined;
    let active = true;
    async function loadNetwork() {
      try {
        const [routeResult, busResult] = await Promise.all([
          apiRequest("/routes"),
          apiRequest("/buses").catch(() => []),
        ]);
        if (!active) return;
        const routes = Array.isArray(routeResult) ? routeResult : [];
        if (!routes.length) return;
        const liveBuses = Array.isArray(busResult) ? busResult : [];
        const mappedRoutes = await Promise.all(routes.map(async (route) => {
          try {
            const result = await apiRequest(`/stops/route/${encodeURIComponent(route._id)}`);
            return { routeId: route._id, routeName: route.routeName, stops: Array.isArray(result) ? result : [] };
          } catch {
            return { routeId: route._id, routeName: route.routeName, stops: [] };
          }
        }));
        if (!active || !mappedRoutes.some((route) => route.stops.length)) return;
        setSegments(mappedRoutes.filter((route) => route.stops.length));
        setBuses(liveBuses);
        setSelectedRouteId(null);
        setSource("backend");
      } catch {
        // Keep local Faisalabad examples visible when the backend is unavailable.
      }
    }
    loadNetwork();
    return () => { active = false; };
  }, [mapVisible]);

  const selectedRouteName = useMemo(() => segments.find((route) => String(route.routeId) === String(selectedRouteId))?.routeName, [segments, selectedRouteId]);

  return (
    <>
      <div ref={mapContainerRef} className="absolute inset-0 z-0 overflow-hidden rounded-[inherit] pt-[66px]">
        {mapVisible ? <LeafletRouteMap routeSegments={segments} buses={buses} selectedRouteId={selectedRouteId} onSelectRoute={setSelectedRouteId} className="rounded-none" ariaLabel="Faisalabad transit map showing all bus routes, stops, and buses" /> : <div className="map-grid-light grid h-full place-items-center bg-[#e9edf7]"><span className="rounded-full border border-white/80 bg-white/85 px-4 py-2 text-xs font-semibold text-[#7185c6] shadow-sm">Map ready when you are</span></div>}
      </div>
      <div className="pointer-events-none absolute bottom-5 left-5 z-10 flex max-w-[calc(100%-2.5rem)] flex-wrap items-center gap-2 rounded-xl border border-white/80 bg-white/90 px-3 py-2 text-[10px] font-semibold text-[#58647f] shadow-md backdrop-blur sm:bottom-6 sm:left-6">
        <span className={`h-2 w-2 rounded-full ${source === "backend" ? "bg-[#20bba5]" : "bg-[#e49353]"}`} />
        {selectedRouteName || (source === "backend" ? `${segments.length} routes · live data` : `${segments.length} sample routes · select a line`)}
      </div>
    </>
  );
}

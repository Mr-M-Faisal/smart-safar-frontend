"use client";

import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    let active = true;
    async function loadNetwork() {
      try {
        const routeResult = await apiRequest("/routes");
        if (!active) return;
        const routes = Array.isArray(routeResult) ? routeResult : [];
        if (!routes.length) return;
        const liveBuses = await apiRequest("/buses").then((result) => Array.isArray(result) ? result : []).catch(() => []);
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
  }, []);

  const selectedRouteName = useMemo(() => segments.find((route) => String(route.routeId) === String(selectedRouteId))?.routeName, [segments, selectedRouteId]);

  return (
    <>
      <div className="absolute inset-0 z-0 overflow-hidden rounded-[inherit] pt-[66px]">
        <LeafletRouteMap routeSegments={segments} buses={buses} selectedRouteId={selectedRouteId} onSelectRoute={setSelectedRouteId} className="rounded-none" ariaLabel="Faisalabad transit map showing all bus routes, stops, and buses" />
      </div>
      <div className="pointer-events-none absolute bottom-5 left-5 z-10 flex max-w-[calc(100%-2.5rem)] flex-wrap items-center gap-2 rounded-xl border border-white/80 bg-white/90 px-3 py-2 text-[10px] font-semibold text-[#58647f] shadow-md backdrop-blur sm:bottom-6 sm:left-6">
        <span className={`h-2 w-2 rounded-full ${source === "backend" ? "bg-[#20bba5]" : "bg-[#e49353]"}`} />
        {selectedRouteName || (source === "backend" ? `${segments.length} routes · live data` : `${segments.length} sample routes · select a line`)}
      </div>
    </>
  );
}

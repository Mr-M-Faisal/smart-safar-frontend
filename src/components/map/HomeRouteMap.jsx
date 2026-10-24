"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRoutes } from "@/lib/data/hooks";
import { getDataViewState } from "@/lib/data/viewState.cjs";
import { demoModeEnabled, loadDemoData } from "@/lib/data/demoData";
import useDelayedLoading from "@/lib/useDelayedLoading";
import formatCacheAge from "@/lib/data/formatCacheAge";
import LeafletRouteMap from "@/components/map/LeafletRouteMap";
import { MapSkeleton } from "@/components/ui/skeleton/Skeleton";
import { FAISALABAD_CENTER } from "@/data/mapConfig";
import { saveBookingSelection } from "@/lib/bookingSelection";

export default function HomeRouteMap() {
  const [mapVisible, setMapVisible] = useState(false);
  const routesResource = useRoutes({ enabled: mapVisible });
  const [segments, setSegments] = useState([]);
  const [buses, setBuses] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [source, setSource] = useState("loading");
  const mapContainerRef = useRef(null);
  const showLoading = useDelayedLoading(mapVisible && routesResource.isLoading);
  const dataViewState = getDataViewState({ isLoading: routesResource.isLoading, error: routesResource.error, data: routesResource.data, hasCache: routesResource.hasCache });

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
    const applyRoutes = (routes, nextSource) => {
      const mapped = routes.map((route) => ({ routeId: route._id, routeName: route.routeName, stops: route.stops || [] }));
      setSegments(mapped);
      setBuses(routes.flatMap((route) => (route.buses || []).map((bus) => ({ ...bus, route: { _id: route._id, routeName: route.routeName } }))));
      setSelectedRouteId(null);
      setSource(nextSource);
    };
    if (Array.isArray(routesResource.data)) {
      if (routesResource.data.length) applyRoutes(routesResource.data, routesResource.hasCache ? "saved" : "backend");
      else { setSegments([]); setBuses([]); setSource("empty"); }
    } else if (routesResource.error) {
      if (demoModeEnabled) {
        void loadDemoData().then((data) => {
          if (!active) return;
          const routes = data?.faisalabadDemoRoutes || [];
          applyRoutes(routes.map((route) => ({ ...route, stops: data.demoStopsForRoute(route) })).map((route, routeIndex) => ({
            ...route,
            buses: route.buses.map((bus, busIndex) => {
              const point = data.faisalabadDemoCoordinates[bus.nextStop] || FAISALABAD_CENTER;
              return { ...bus, route: { _id: route._id, routeName: route.routeName }, currentLocation: { latitude: point[0] + (busIndex % 2 ? -0.0012 : 0.0012), longitude: point[1] + (routeIndex % 2 ? -0.001 : 0.001) } };
            }),
          })), "demo");
        });
      } else { setSegments([]); setBuses([]); setSource("error"); }
    }
    return () => { active = false; };
  }, [mapVisible, routesResource.data, routesResource.error, routesResource.hasCache]);

  const selectedRouteName = useMemo(() => segments.find((route) => String(route.routeId) === String(selectedRouteId))?.routeName, [segments, selectedRouteId]);

  return (
    <>
      <div ref={mapContainerRef} className="absolute inset-0 z-0 overflow-hidden rounded-[inherit] pt-[66px]">
        {mapVisible && source !== "error" && source !== "empty" ? <><LeafletRouteMap routeSegments={segments} buses={buses} selectedRouteId={selectedRouteId} onSelectRoute={setSelectedRouteId} className="rounded-none" ariaLabel="Faisalabad transit map showing routes, stops, and buses" />{showLoading && <div className="absolute inset-0 z-[600]"><MapSkeleton className="h-full min-h-0 rounded-none" /></div>}</> : <div className="map-grid-light grid h-full place-items-center bg-[#e9edf7]"><span className="rounded-full border border-white/80 bg-white/85 px-4 py-2 text-xs font-semibold text-[#7185c6] shadow-sm">{mapVisible ? source === "error" ? "Transit map unavailable" : source === "empty" ? "No route data available" : "Map ready when you are" : "Map ready when you are"}</span></div>}
      </div>
      <div className="absolute inset-x-3 top-3 z-20 rounded-xl border border-white/80 bg-white/90 p-2 shadow-md backdrop-blur sm:inset-x-5 sm:top-4 sm:p-2.5">
        <div className="mb-1.5 px-1 text-[9px] font-bold uppercase tracking-[.16em] text-[#7185c6]">Tap a route to preview it</div>
        <div role="group" aria-label="Choose a route from the homepage map" className="flex gap-1.5 overflow-x-auto pb-0.5">
          {segments.map((route) => {
            const selected = String(route.routeId) === String(selectedRouteId);
            return <button key={route.routeId} type="button" aria-pressed={selected} onClick={() => { setSelectedRouteId(route.routeId); saveBookingSelection({ routeId: route.routeId, busId: "" }); }} className={`min-h-9 shrink-0 max-w-[12rem] truncate rounded-lg px-2.5 text-[10px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#536bb7] ${selected ? "bg-[#536bb7] text-white" : "bg-[#f1f3fa] text-[#53617e] hover:bg-[#e5e9f7]"}`}>{route.routeName}</button>;
          })}
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-5 left-5 z-10 flex max-w-[calc(100%-2.5rem)] flex-wrap items-center gap-2 rounded-xl border border-white/80 bg-white/90 px-3 py-2 text-[10px] font-semibold text-[#58647f] shadow-md backdrop-blur sm:bottom-6 sm:left-6">
        <span className={`h-2 w-2 rounded-full ${source === "backend" ? "bg-[#20bba5]" : source === "saved" ? "bg-[#64748b]" : "bg-[#e49353]"}`} />
        {selectedRouteName || (source === "backend" ? `${segments.length} routes · transit data` : source === "saved" ? `${segments.length} routes · saved data · ${formatCacheAge(routesResource.cachedAt) || "previously updated"}` : source === "demo" ? "Demo data · illustrative preview" : source === "empty" ? "No routes available" : source === "error" ? "Real transit data unavailable" : dataViewState === "loading" ? "Loading transit data" : "Map ready when you are")}
      </div>
      {(source === "error" || source === "empty") && <div className="absolute right-5 bottom-5 z-20 max-w-xs rounded-xl border border-white/90 bg-white/95 p-3 text-xs text-[#596681] shadow-lg">{source === "error" ? <><p>Live map data couldn’t be loaded.</p><button type="button" onClick={() => void routesResource.refresh()} className="mt-2 min-h-9 font-semibold text-[#536bb7] underline">Retry</button>{demoModeEnabled && <span className="ml-2">Demo mode can be enabled for presentations.</span>}</> : "The transit service has not published any routes yet."}</div>}
      {source === "demo" && <span className="absolute right-5 top-[4.75rem] z-20 rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-semibold text-amber-900">Demo data</span>}
    </>
  );
}

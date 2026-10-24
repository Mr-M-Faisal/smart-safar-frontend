"use client";

import { useEffect, useRef, useState } from "react";
import { useRoutes } from "@/lib/data/hooks";
import { demoModeEnabled, loadDemoData } from "@/lib/data/demoData";
import useDelayedLoading from "@/lib/useDelayedLoading";
import LeafletRouteMap from "@/components/map/LeafletRouteMap";
import { MapSkeleton } from "@/components/ui/skeleton/Skeleton";
import { FAISALABAD_CENTER } from "@/data/mapConfig";

export default function HomeRouteMap({ selectedRouteId: selectedRouteIdProp = null }) {
  const selectedRouteId = selectedRouteIdProp;
  const [mapVisible, setMapVisible] = useState(false);
  const routesResource = useRoutes({ enabled: mapVisible });
  const [segments, setSegments] = useState([]);
  const [buses, setBuses] = useState([]);
  const [source, setSource] = useState("loading");
  const mapContainerRef = useRef(null);
  const showLoading = useDelayedLoading(mapVisible && routesResource.isLoading);

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

  return (
    <>
      <div ref={mapContainerRef} className="absolute inset-0 z-0 overflow-hidden rounded-[inherit]">
        {mapVisible && source !== "error" && source !== "empty" ? <><LeafletRouteMap routeSegments={segments} buses={buses} selectedRouteId={selectedRouteId} className="rounded-none" ariaLabel="Faisalabad transit map showing routes, stops, and buses" />{showLoading && <div className="absolute inset-0 z-[600]"><MapSkeleton className="h-full min-h-0 rounded-none" /></div>}</> : <div className="map-grid-light grid h-full place-items-center bg-[#e9edf7]"><span className="rounded-full border border-white/80 bg-white/85 px-4 py-2 text-xs font-semibold text-[#7185c6] shadow-sm">{mapVisible ? source === "error" ? "Transit map unavailable" : source === "empty" ? "No route data available" : "Map ready when you are" : "Map ready when you are"}</span></div>}
      </div>
      {(source === "error" || source === "empty") && <div className="absolute right-5 bottom-5 z-20 max-w-xs rounded-xl border border-white/90 bg-white/95 p-3 text-xs text-[#596681] shadow-lg">{source === "error" ? <><p>Live map data couldn’t be loaded.</p><button type="button" onClick={() => void routesResource.refresh()} className="mt-2 min-h-9 font-semibold text-[#536bb7] underline">Retry</button>{demoModeEnabled && <span className="ml-2">Demo mode can be enabled for presentations.</span>}</> : "The transit service has not published any routes yet."}</div>}
    </>
  );
}

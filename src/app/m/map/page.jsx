"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRoutes } from "@/lib/data/hooks";
import AppIcon from "@/components/app/icons";
import { FAISALABAD_CENTER } from "@/data/mapConfig";
import { normalizeServiceCoordinate } from "@/data/serviceArea";
import Surface from "@/components/ui/brand/Surface";
import PanelTitle from "@/components/ui/brand/PanelTitle";

const LeafletRouteMap = dynamic(() => import("@/components/map/LeafletRouteMap"), { ssr: false, loading: () => <div className="absolute inset-0 animate-pulse bg-[#e6e9f4]" /> });

export default function MobileMapPage() {
  const resource = useRoutes();
  const routes = Array.isArray(resource.data) ? resource.data : [];
  const [routeId, setRouteId] = useState("");
  const [sheet, setSheet] = useState("peek");
  const [message, setMessage] = useState("");
  const [locationPrimer, setLocationPrimer] = useState(false);
  const sheetTouchStart = useRef(null);
  const draggedSheet = useRef(false);
  const mapController = useRef(null);
  useEffect(() => { if (!routeId && routes.length) setRouteId(String(routes[0]._id)); }, [routeId, routes]);
  useEffect(() => { const timer = window.setTimeout(() => window.dispatchEvent(new Event("smart-safar:map-layout-changed")), 220); return () => window.clearTimeout(timer); }, [sheet]);
  const selected = routes.find((route) => String(route._id) === routeId);
  const segments = useMemo(() => routes.map((route) => ({ routeId: route._id, routeName: route.routeName, stops: route.stops || [] })), [routes]);
  const buses = useMemo(() => routes.flatMap((route) => (route.buses || []).map((bus) => ({ ...bus, route: { _id: route._id, routeName: route.routeName } }))), [routes]);
  function locateNow() {
    if (!navigator.geolocation) { setMessage("Location is not available on this device."); return; }
    navigator.geolocation.getCurrentPosition(({ coords }) => { const point = normalizeServiceCoordinate(coords.latitude, coords.longitude, { label: "device location" }); if (!point) { mapController.current?.setView(FAISALABAD_CENTER, 12, { animate: true }); setMessage("Your location is outside Faisalabad's service area. Showing the city map."); return; } mapController.current?.setView(point, 15, { animate: true }); setMessage("Showing your current location."); }, () => setMessage("Allow location access in your browser to locate yourself."), { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
  }
  function locate() {
    let primerSeen = false;
    try { primerSeen = localStorage.getItem("ss-map-location-primer-seen") === "1"; } catch (_error) {}
    if (!primerSeen) { setLocationPrimer(true); return; }
    locateNow();
  }
  function resizeSheet(direction) {
    const sizes = ["peek", "half", "full"];
    setSheet((current) => sizes[Math.max(0, Math.min(sizes.length - 1, sizes.indexOf(current) + direction))]);
  }
  return <div className="relative h-full min-h-[300px] overflow-hidden bg-[#e9edf7]" style={{ "--ss-map-sheet-clearance": sheet === "peek" ? "40%" : sheet === "half" ? "62%" : "80%" }}>
    <div className="app-full-map"><LeafletRouteMap routeSegments={segments} buses={buses} selectedRouteId={routeId} mapController={mapController} ariaLabel="Live Faisalabad map with transit routes and buses" /></div>
    <button type="button" aria-label="Locate me" onClick={locate} style={{ bottom: "calc(var(--ss-map-sheet-clearance) + 66px)" }} className="absolute right-4 z-[600] grid h-12 w-12 place-items-center rounded-2xl border border-white bg-white text-[#536bb7] shadow-lg active:scale-[.98]"><AppIcon name="Locate"/></button>
    {message && <div role="status" className="absolute left-3 right-16 top-4 z-[600] rounded-xl bg-white/95 p-3 text-xs text-[#53617e] shadow-lg">{message}<button className="ml-2 font-bold text-[#536bb7]" onClick={() => setMessage("")}>×</button></div>}
    <Surface as="section" className={`app-map-sheet ${sheet === "peek" ? "is-peek" : sheet === "half" ? "is-half" : "is-full"}`} aria-label="Map details">
      <button type="button" aria-label="Resize map details" aria-valuetext={`${sheet} height`} onPointerDown={(event) => { sheetTouchStart.current = event.clientY; draggedSheet.current = false; }} onPointerUp={(event) => {
        if (sheetTouchStart.current == null) return;
        const delta = event.clientY - sheetTouchStart.current;
        sheetTouchStart.current = null;
        if (Math.abs(delta) > 36) { draggedSheet.current = true; resizeSheet(delta < 0 ? 1 : -1); }
      }} onClick={() => { if (draggedSheet.current) { draggedSheet.current = false; return; } resizeSheet(1); }} className="mx-auto mb-3 block h-8 w-14 touch-none cursor-grab rounded-full before:mx-auto before:block before:h-1.5 before:w-10 before:rounded-full before:bg-[#cbd3e4] active:cursor-grabbing" />
      <div className="flex items-center justify-between gap-2"><PanelTitle eyebrow="Live transit" title={selected?.routeName || "Choose a route"}/><span className="rounded-full bg-[#e8faf4] px-2.5 py-1 text-[10px] font-bold text-[#167b6e]">{resource.error ? "Offline" : "Faisalabad"}</span></div>
      {resource.error && !routes.length && <div role="alert" className="mt-3 app-empty">Couldn’t load map data. <button onClick={() => void resource.refresh()} className="font-bold text-[#536bb7]">Retry</button></div>}
      {resource.hasCache && <p className="mt-2 text-[10px] text-[#78839b]">Saved route data · buses may be out of date.</p>}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{routes.map((route) => <button key={route._id} type="button" onClick={() => setRouteId(String(route._id))} aria-pressed={routeId === String(route._id)} className={`min-h-10 shrink-0 rounded-full px-3 text-[11px] font-bold ${routeId === String(route._id) ? "bg-[#536bb7] text-white" : "bg-[#f0f2f9] text-[#66728e]"}`}>{route.routeName}</button>)}</div>
      <div className="mt-3 grid gap-2">{(selected?.buses || []).slice(0, sheet === "peek" ? 1 : 5).map((bus) => <Surface as="div" key={bus._id || bus.busNumber} className="flex items-center gap-3 p-3"><span className="app-action-icon h-9 w-9"><AppIcon name="Bus" size={18}/></span><div className="min-w-0 flex-1"><p className="text-xs font-bold text-[#34405d]">{bus.busNumber || "Bus"}</p><p className="mt-1 text-[10px] text-[#7b859c]">{bus.status === "active" ? "On route" : bus.status || "Status unavailable"} · {bus.availableSeats ?? "—"} seats left</p></div>{bus.etaMinutes != null && <span className="text-xs font-semibold text-[#536bb7]">{bus.etaMinutes} min</span>}</Surface>)}</div>
    </Surface>
    {locationPrimer && <div className="fixed inset-0 z-[1700] flex items-end justify-center bg-[#101a35]/45 p-3 sm:items-center"><section role="dialog" aria-modal="true" aria-labelledby="map-location-primer-title" className="w-full max-w-md rounded-[24px] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl"><p className="app-eyebrow">Your location</p><h2 id="map-location-primer-title" className="mt-2 text-lg font-bold text-[#293553]">Show your place on the map?</h2><p className="app-muted mt-2">Smart Safar uses your location only to center the map. Your location is not saved or shared.</p><button type="button" className="app-primary mt-5 w-full" onClick={() => { try { localStorage.setItem("ss-map-location-primer-seen", "1"); } catch (_error) {} setLocationPrimer(false); locateNow(); }}>Continue</button><button type="button" className="mt-2 min-h-11 w-full text-xs font-bold text-[#536bb7]" onClick={() => setLocationPrimer(false)}>Not now</button></section></div>}
  </div>;
}

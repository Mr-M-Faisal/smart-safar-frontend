"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouteStops, useBuses, useRoutes } from "@/lib/data/hooks";
import { saveBookingSelection } from "@/lib/bookingSelection";

const LeafletRouteMap = dynamic(() => import("@/components/map/LeafletRouteMap"), { ssr: false, loading: () => <div className="h-44 animate-pulse rounded-2xl bg-[#e6e9f4]" /> });

export default function MobileRouteDetailPage({ params }) {
  const routeId = params?.routeId;
  const routesResource = useRoutes();
  const route = (Array.isArray(routesResource.data) ? routesResource.data : []).find((item) => String(item._id) === String(routeId));
  const stopsResource = useRouteStops(routeId);
  const busesResource = useBuses(routeId);
  const stops = Array.isArray(stopsResource.data) ? stopsResource.data : route?.stops || [];
  const buses = Array.isArray(busesResource.data) ? busesResource.data : route?.buses || [];
  const operating = buses.some((bus) => bus.status === "active");
  return <div className="app-screen">
    {routesResource.error && !route && <div role="alert" className="app-empty">Route details could not load. <button className="font-bold text-[#536bb7]" onClick={() => void routesResource.refresh()}>Retry</button></div>}
    {!route && !routesResource.error && <div className="app-empty">Loading route…</div>}
    {route && <>
      <section className="rounded-[22px] bg-gradient-to-br from-[#263a70] to-[#536bb7] p-5 text-white shadow-lg"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#b8f5e6]">{operating ? "Operating route" : "Transit route"}</p><h2 className="mt-2 text-xl font-bold">{route.routeName}</h2><p className="mt-2 text-sm text-white/80">{route.startPoint} <span className="px-1 text-[#a8efdf]">→</span> {route.endPoint}</p><p className="mt-4 text-xs text-white/70">{route.fare != null ? `Fare · Rs. ${route.fare}` : "Fare information unavailable"} · {buses.length} buses</p></section>
      <section className="mt-5"><h3 className="mb-3 text-sm font-bold text-[#394562]">Route map</h3><div className="h-48 overflow-hidden rounded-2xl border border-white bg-white shadow-sm"><LeafletRouteMap routeSegments={[{ routeId: route._id, routeName: route.routeName, stops }]} selectedRouteId={route._id} ariaLabel={`Map showing ${route.routeName} and its stops`} /></div></section>
      <section className="mt-5"><h3 className="mb-3 text-sm font-bold text-[#394562]">Stops · {stops.length}</h3>{stopsResource.error && <div role="alert" className="app-empty">Stops could not load. <button className="font-bold text-[#536bb7]" onClick={() => void stopsResource.refresh()}>Retry</button></div>}{stops.length ? <ol className="app-card px-4 py-2">{stops.map((stop, index) => <li key={stop._id || `${stop.stopOrder}-${stop.stopName}`} className="relative flex min-h-[58px] gap-3 border-l border-[#d6def1] pl-4 last:border-transparent"><span className="absolute -left-[5px] top-4 h-2.5 w-2.5 rounded-full bg-[#20bba5] ring-2 ring-white"/><span className="pt-2 text-sm font-semibold text-[#394562]">{stop.stopName || stop}</span><span className="ml-auto pt-2 text-[10px] text-[#8992a8]">Stop {stop.stopOrder ?? index + 1}</span></li>)}</ol> : <p className="app-empty">No stops added for this route.</p>}</section>
      <section className="mt-5"><h3 className="mb-3 text-sm font-bold text-[#394562]">Buses on this route</h3>{busesResource.error && !buses.length && <div role="alert" className="app-empty">Bus information unavailable. <button className="font-bold text-[#536bb7]" onClick={() => void busesResource.refresh()}>Retry</button></div>}{buses.length ? <div className="grid gap-2">{buses.map((bus) => <div className="app-card flex items-center gap-3 p-3" key={bus._id || bus.busNumber}><span className="app-action-icon"><span aria-hidden="true">▰</span></span><div className="min-w-0 flex-1"><p className="text-sm font-bold text-[#394562]">{bus.busNumber || "Bus"}</p><p className="mt-1 text-xs text-[#77829a]">{bus.availableSeats ?? "—"} seats · {bus.status || "Status unavailable"}</p></div></div>)}</div> : !busesResource.error && <p className="app-empty">No buses are assigned yet.</p>}</section>
      <div className="app-bottom-spacer" />
      <div className="fixed inset-x-0 bottom-[calc(66px+env(safe-area-inset-bottom))] z-10 mx-auto max-w-[680px] px-4"><Link href={`/m/book?route=${encodeURIComponent(route._id)}`} onClick={() => saveBookingSelection({ routeId: route._id, busId: "" })} className="app-primary w-full">Book a seat <span aria-hidden="true">→</span></Link></div>
    </>}
  </div>;
}

"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRoutes } from "@/lib/data/hooks";
import { useAppRefresh } from "@/components/app/AppRefreshContext";
import HeroCard from "@/components/ui/brand/HeroCard";
import TintCard from "@/components/ui/brand/TintCard";
import PillButton from "@/components/ui/brand/PillButton";
import Surface from "@/components/ui/brand/Surface";
import PanelTitle from "@/components/ui/brand/PanelTitle";
import StatusChip from "@/components/ui/brand/StatusChip";
import { useState } from "react";

const HomeRouteMap = dynamic(() => import("@/components/map/HomeRouteMap"), { ssr: false, loading: () => <div className="h-full animate-pulse rounded-2xl bg-[#e6e9f4]" /> });
const highlights = [
  { number: "01", title: "Find your route", description: "Explore local routes and stops.", href: "/m/routes", tint: "from-[#eef2ff] to-white" },
  { number: "02", title: "Follow the bus", description: "See buses move across the city.", href: "/m/map", tint: "from-[#e8f8f5] to-white" },
  { number: "03", title: "Travel informed", description: "Choose a seat and check your trip.", href: "/m/book", tint: "from-[#fff3e8] to-white" },
];

export default function MobileHomePage() {
  const routes = useRoutes();
  const [selectedMapRouteId, setSelectedMapRouteId] = useState(null);
  const routeList = Array.isArray(routes.data) ? routes.data : [];
  useAppRefresh(routes.refresh);
  return <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-4 pb-7 sm:px-6">
    <HeroCard eyebrow="Faisalabad, One Stop Closer" title={<>Find your way through <span className="font-serif italic text-aqua">Faisalabad.</span></>} description="See routes, check bus updates, and plan your next trip across the city." actions={<><PillButton href="/m/map">Explore live map <span aria-hidden="true">→</span></PillButton><PillButton href="/m/routes" secondary>Browse routes</PillButton></>} facts={["Live bus locations", "Arrival estimates", "Seat updates"]} className="max-h-[42svh] min-h-[290px]" />

    <section aria-label="How Smart Safar helps" className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">{highlights.map((item) => <TintCard key={item.number} {...item} className="min-w-[220px]" />)}</section>

    <section>
      <PanelTitle eyebrow="City network" title="Active routes" action={<Link className="text-xs font-bold text-transit-500" href="/m/routes">See all</Link>} />
      {routes.isLoading && !routeList.length ? <Surface className="text-sm text-slate-500">Loading routes…</Surface> : routes.error && !routeList.length ? <Surface role="alert" className="text-sm text-slate-600">Routes couldn’t load. <button className="font-bold text-transit-500" onClick={() => void routes.refresh()}>Retry</button></Surface> : routeList.length ? <div className="grid gap-2">{routeList.slice(0, 3).map((route) => {
        const buses = route.buses?.length ?? 0;
        const operating = (route.buses || []).some((bus) => bus.status === "active" || bus.operating === true);
        return <Link key={route._id} href={`/m/routes/${route._id}`} className="block rounded-[1.2rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-transit-500"><Surface as="div" className="p-3.5"><div className="flex items-start justify-between gap-2"><span className="min-w-0"><span className="block truncate text-sm font-bold text-ink">{route.routeName}</span><span className="mt-1 block truncate text-xs text-slate-600">{route.startPoint || "Start"} <span className="text-transit-500">→</span> {route.endPoint || "End"}</span></span><StatusChip active={operating}>{operating ? "Operating" : "Not operating"}</StatusChip></div><div className="mt-2 flex gap-3 text-[10px] text-slate-500"><span>{(route.stops?.length ?? 0)} {(route.stops?.length ?? 0) === 1 ? "stop" : "stops"}</span><span>{buses} {buses === 1 ? "bus" : "buses"}</span>{route.fare != null && <span>Rs. {route.fare}</span>}</div></Surface></Link>;
      })}</div> : <Surface className="text-sm text-slate-500">No routes have been published yet.</Surface>}
    </section>

    <section>
      <PanelTitle eyebrow="Live transit" title="Faisalabad map" action={<Link className="text-xs font-bold text-transit-500" href="/m/map">Open map</Link>} />
      {routeList.length > 0 && <div className="mb-2 flex gap-2 overflow-x-auto pb-1">{routeList.slice(0, 6).map((route) => <button key={route._id} type="button" aria-pressed={String(route._id) === String(selectedMapRouteId)} onClick={() => setSelectedMapRouteId(String(route._id))} className={`min-h-9 shrink-0 rounded-full px-3 text-[10px] font-bold ${String(route._id) === String(selectedMapRouteId) ? "bg-transit-500 text-white" : "bg-white text-slate-600"}`}>{route.routeName}</button>)}</div>}
      <Link href="/m/map" aria-label="Open live transit map" className="block h-[190px] overflow-hidden rounded-[1.35rem] border border-white/80 bg-[#e9edf7] shadow-[0_12px_34px_rgba(62,76,125,.08)]"><HomeRouteMap selectedRouteId={selectedMapRouteId} /></Link>
    </section>
    {routes.hasCache && <p className="text-center text-[10px] text-slate-500">Saved transit data · reconnect to refresh locations.</p>}
  </div>;
}

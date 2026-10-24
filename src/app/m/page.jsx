"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRoutes } from "@/lib/data/hooks";
import AppIcon from "@/components/app/icons";
import { useAppRefresh } from "@/components/app/AppRefreshContext";

const HomeRouteMap = dynamic(() => import("@/components/map/HomeRouteMap"), { ssr: false, loading: () => <div className="h-full animate-pulse rounded-2xl bg-[#e6e9f4]" /> });

const shortcuts = [["Live map", "/m/map", "Map"], ["Routes", "/m/routes", "Routes"], ["Book a seat", "/m/book", "Ticket"], ["My trips", "/m/trips", "Trips"]];

export default function MobileHomePage() {
  const routes = useRoutes();
  const routeList = Array.isArray(routes.data) ? routes.data : [];
  useAppRefresh(routes.refresh);
  return <div className="app-home">
    <section className="app-home-greeting"><div><p className="app-eyebrow">Faisalabad · transit</p><h2 className="mt-2 text-[1.65rem] font-bold tracking-[-.04em] text-[#293553]">Where to?</h2><p className="app-muted mt-1">Plan your next trip across the city.</p></div><Link href="/m/account" className="app-icon-button app-card" aria-label="Account"><AppIcon name="User"/></Link></section>
    <Link href="/m/routes" className="mt-5 flex min-h-[54px] items-center gap-3 rounded-2xl border border-[#e1e6f2] bg-white px-4 text-sm text-[#8992a8] shadow-sm"><AppIcon name="Search"/><span className="flex-1">Search routes, stops, or areas</span><span className="text-[#536bb7]">→</span></Link>
    <section className="mt-6"><h3 className="mb-3 text-sm font-bold text-[#394562]">Quick actions</h3><div className="app-action-grid">{shortcuts.map(([label, href, icon]) => <Link className="app-action" href={href} key={href}><span className="app-action-icon"><AppIcon name={icon}/></span><span>{label}</span><span className="ml-auto text-[#99a3b8]">→</span></Link>)}</div></section>
    <section className="mt-7"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold text-[#394562]">Active routes</h3><Link className="text-xs font-bold text-[#536bb7]" href="/m/routes">See all</Link></div>{routes.isLoading && !routeList.length ? <div className="app-empty">Loading routes…</div> : routes.error && !routeList.length ? <div role="alert" className="app-empty">Routes couldn’t load. <button className="font-bold text-[#536bb7]" onClick={() => void routes.refresh()}>Retry</button></div> : routeList.length ? <div className="app-route-row">{routeList.slice(0, 8).map((route) => <Link className="app-route-card app-card" href={`/m/routes/${route._id}`} key={route._id}><p className="app-eyebrow">{route.buses?.length ?? 0} buses</p><h4 className="mt-2 truncate text-sm font-bold">{route.routeName}</h4><p className="mt-1 truncate text-xs text-[#77829a]">{route.startPoint} <span className="text-[#20a992]">→</span> {route.endPoint}</p><p className="mt-3 text-xs font-semibold text-[#536bb7]">{route.fare != null ? `Fare · Rs. ${route.fare}` : "View route"}</p></Link>)}</div> : <div className="app-empty">No routes have been published yet.</div>}</section>
    <section className="mt-7"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold text-[#394562]">Live map</h3><Link className="text-xs font-bold text-[#536bb7]" href="/m/map">Open map</Link></div><div className="relative h-[190px] overflow-hidden rounded-2xl border border-white bg-[#e9edf7] shadow-sm"><HomeRouteMap /><Link href="/m/map" className="absolute inset-0 z-[700]" aria-label="Open full live map" /></div></section>
    {routes.hasCache && <p className="mt-4 text-center text-[10px] text-[#78839b]">Saved transit data · reconnect to refresh locations.</p>}
  </div>;
}

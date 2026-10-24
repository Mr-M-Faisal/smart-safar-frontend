"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRoutes } from "@/lib/data/hooks";
import AppIcon from "@/components/app/icons";
import formatCacheAge from "@/lib/data/formatCacheAge";
import { useAppRefresh } from "@/components/app/AppRefreshContext";
import Surface from "@/components/ui/brand/Surface";
import StatusChip from "@/components/ui/brand/StatusChip";
import PanelTitle from "@/components/ui/brand/PanelTitle";

export default function MobileRoutesPage() {
  const resource = useRoutes();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const routes = Array.isArray(resource.data) ? resource.data : [];
  useAppRefresh(resource.refresh);
  const filtered = useMemo(() => routes.filter((route) => {
    const text = `${route.routeName || ""} ${route.startPoint || ""} ${route.endPoint || ""} ${(route.stops || []).map((stop) => stop.stopName || stop).join(" ")}`.toLowerCase();
    return text.includes(search.trim().toLowerCase()) && (filter === "All" || (route.buses || []).some((bus) => bus.status === "active"));
  }), [routes, search, filter]);
  return <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4 pb-7 sm:px-6">
    <PanelTitle eyebrow="Faisalabad transit" title="Explore routes" action={<button type="button" aria-label="Refresh routes" onClick={() => void resource.refresh()} className="grid h-10 w-10 place-items-center rounded-full border border-[#dfe4f1] bg-white text-[#536bb7]"><span aria-hidden="true">↻</span></button>} />
    <label className="sticky top-0 z-10 flex min-h-[48px] items-center gap-3 rounded-full border border-[#d5dcf1] bg-white/95 px-4 shadow-[0_8px_24px_rgba(39,74,122,.05)] backdrop-blur"><AppIcon name="Search" className="text-transit-500"/><span className="sr-only">Search routes and stops</span><input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#929bb0]" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search routes, stops, or areas" /></label>
    <div className="flex gap-2" role="group" aria-label="Filter routes">{["All", "Operating"].map((value) => <button key={value} onClick={() => setFilter(value)} aria-pressed={filter === value} className={`min-h-10 rounded-full px-4 text-xs font-bold ${filter === value ? "bg-transit-500 text-white" : "border border-[#dfe4f1] bg-white text-[#65718c]"}`}>{value}</button>)}</div>
    {resource.hasCache && <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-[11px] text-slate-600">Saved data · {formatCacheAge(resource.cachedAt) || "previously updated"}</p>}
    {resource.isLoading && !routes.length && <div className="mt-4 grid gap-3">{[1,2,3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />)}</div>}
    {resource.error && !routes.length && <div role="alert" className="app-empty mt-4">Couldn’t load routes. <button className="font-bold text-[#536bb7]" onClick={() => void resource.refresh()}>Retry</button></div>}
    {!resource.isLoading && !resource.error && routes.length === 0 && <div className="app-empty mt-4">No routes are available right now.</div>}
    <div className="mt-4 grid gap-3">{filtered.map((route) => {
      const active = (route.buses || []).some((bus) => bus.status === "active");
      const stopCount = route.stops?.length ?? 0;
      const busCount = route.buses?.length ?? 0;
      return <Link href={`/m/routes/${route._id}`} key={route._id} aria-label={`${route.routeName}, ${active ? "operating" : "not operating"}`} className="block rounded-[1.25rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-transit-500">
        <Surface as="div" className="p-4 text-ink transition active:scale-[.99]"><div className="flex items-start gap-3"><span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${active ? "bg-[#20bba5]" : "bg-[#e2a05f]"}`} aria-hidden="true"/><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h2 className="truncate text-sm font-bold">{route.routeName}</h2>{route.fare != null && <span className="shrink-0 text-xs font-bold text-transit-500">Rs. {route.fare}</span>}</div><p className="mt-1 truncate text-xs text-slate-600">{route.startPoint || "Start"} <span className="px-1 text-transit-500">→</span> {route.endPoint || "End"}</p><div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-slate-500"><span>{stopCount} {stopCount === 1 ? "stop" : "stops"}</span><span aria-hidden="true">·</span><span>{busCount} {busCount === 1 ? "bus" : "buses"}</span><StatusChip active={active}>{active ? "Operating" : "Not operating"}</StatusChip></div></div></div></Surface>
      </Link>;
    })}</div>
    {!resource.isLoading && filtered.length === 0 && routes.length > 0 && <div className="app-empty mt-4">No routes match your search.</div>}
  </div>;
}

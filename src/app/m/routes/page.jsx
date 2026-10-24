"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRoutes } from "@/lib/data/hooks";
import AppIcon from "@/components/app/icons";
import formatCacheAge from "@/lib/data/formatCacheAge";

export default function MobileRoutesPage() {
  const resource = useRoutes();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const routes = Array.isArray(resource.data) ? resource.data : [];
  const filtered = useMemo(() => routes.filter((route) => {
    const text = `${route.routeName || ""} ${route.startPoint || ""} ${route.endPoint || ""} ${(route.stops || []).map((stop) => stop.stopName || stop).join(" ")}`.toLowerCase();
    return text.includes(search.trim().toLowerCase()) && (filter === "All" || (route.buses || []).some((bus) => bus.status === "active"));
  }), [routes, search, filter]);
  return <div className="app-screen">
    <label className="sticky top-0 z-10 flex min-h-[48px] items-center gap-3 rounded-2xl border border-[#e1e6f2] bg-white px-3 shadow-sm"><AppIcon name="Search" className="text-[#7185c6]"/><span className="sr-only">Search routes and stops</span><input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#929bb0]" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search routes or stops" /><button type="button" aria-label="Refresh routes" onClick={() => void resource.refresh()} className="grid h-10 w-10 place-items-center rounded-xl text-[#536bb7]"><span aria-hidden="true">↻</span></button></label>
    <div className="mt-3 flex gap-2" role="group" aria-label="Filter routes">{["All", "Operating"].map((value) => <button key={value} onClick={() => setFilter(value)} aria-pressed={filter === value} className={`min-h-10 rounded-full px-4 text-xs font-bold ${filter === value ? "bg-[#536bb7] text-white" : "border border-[#dfe4f1] bg-white text-[#65718c]"}`}>{value}</button>)}</div>
    {resource.hasCache && <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-[11px] text-slate-600">Saved data · {formatCacheAge(resource.cachedAt) || "previously updated"}</p>}
    {resource.isLoading && !routes.length && <div className="mt-4 grid gap-3">{[1,2,3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />)}</div>}
    {resource.error && !routes.length && <div role="alert" className="app-empty mt-4">Couldn’t load routes. <button className="font-bold text-[#536bb7]" onClick={() => void resource.refresh()}>Retry</button></div>}
    {!resource.isLoading && !resource.error && routes.length === 0 && <div className="app-empty mt-4">No routes are available right now.</div>}
    <div className="mt-4 grid gap-3">{filtered.map((route) => {
      const active = (route.buses || []).some((bus) => bus.status === "active");
      return <Link href={`/m/routes/${route._id}`} key={route._id} className="app-card block p-4 text-[#34405d] transition active:scale-[.99]">
        <div className="flex items-start gap-3"><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${active ? "bg-[#20bba5]" : "bg-[#e2a05f]"}`} /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h2 className="truncate text-sm font-bold">{route.routeName}</h2><span className="shrink-0 text-xs font-bold text-[#536bb7]">{route.fare != null ? `Rs. ${route.fare}` : "Details"}</span></div><p className="mt-1 truncate text-xs text-[#77829a]">{route.startPoint || "Start"} <span className="px-1 text-[#20a992]">→</span> {route.endPoint || "End"}</p><div className="mt-3 flex items-center gap-3 text-[10px] text-[#7b859c]"><span>{route.stops?.length ?? 0} stops</span><span>{route.buses?.length ?? 0} buses</span><span className={active ? "font-semibold text-[#188272]" : ""}>{active ? "Operating" : "Not operating"}</span></div></div><span className="mt-4 text-[#9aa3b7]">→</span></div>
      </Link>;
    })}</div>
    {!resource.isLoading && filtered.length === 0 && routes.length > 0 && <div className="app-empty mt-4">No routes match your search.</div>}
  </div>;
}

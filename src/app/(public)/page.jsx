"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { apiRequest, readSavedCache } from "@/lib/api";
import { faisalabadDemoRoutes } from "@/data/faisalabad-demo";
import BookingLink from "@/components/layout/BookingLink";

const HomeRouteMap = dynamic(() => import("@/components/map/HomeRouteMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-2xl bg-[#e6e9f4] animate-pulse" />,
});

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [routes, setRoutes] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = readSavedCache("/routes");
      if (saved?.data && Array.isArray(saved.data) && saved.data.length) return saved.data;
    }
    return faisalabadDemoRoutes;
  });
  const [buses, setBuses] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest("/routes").catch(() => []),
      apiRequest("/buses").catch(() => []),
    ]).then(([routesRes, busesRes]) => {
      if (!active) return;
      if (Array.isArray(routesRes) && routesRes.length) setRoutes(routesRes);
      if (Array.isArray(busesRes) && busesRes.length) setBuses(busesRes);
    });
    return () => { active = false; };
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/routes?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  // Active or displayed buses (from real backend or fallback)
  const displayBuses = buses.length > 0 ? buses.slice(0, 4) : [
    { _id: "demo-1", busNumber: "SS-101", routeName: "Clock Tower – D Ground", nextStop: "Railway Station", availableSeats: 14, etaMinutes: 4 },
    { _id: "demo-2", busNumber: "SS-104", routeName: "Samanabad – Millat", nextStop: "Allied Hospital", availableSeats: 8, etaMinutes: 9 },
    { _id: "demo-3", busNumber: "SS-109", routeName: "Canal Express", nextStop: "Kohinoor City", availableSeats: 22, etaMinutes: 12 },
  ];

  return (
    <div className="flex flex-col gap-3.5 p-4 max-w-lg mx-auto pb-6">
      {/* Top Greeting & Search */}
      <section className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#536bb7]">Transit City</span>
            <h1 className="text-xl font-bold tracking-tight text-[#111d3d]">Faisalabad</h1>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live transit
          </span>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative mt-1">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Where to? (e.g. Clock Tower, D Ground)"
            className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-[#111d3d] placeholder:text-slate-400 focus:border-[#536bb7] focus:outline-none shadow-xs"
          />
          <svg className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </form>
      </section>

      {/* 3 Quick Action Buttons */}
      <section className="grid grid-cols-3 gap-2.5">
        <Link
          href="/live-map"
          className="flex flex-col items-center justify-center gap-1.5 h-20 rounded-2xl bg-white border border-slate-200/80 p-2 text-center shadow-xs active:scale-[0.98] transition"
        >
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-[#536bb7]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4.5 w-4.5">
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
              <line x1="9" y1="3" x2="9" y2="18" />
              <line x1="15" y1="6" x2="15" y2="21" />
            </svg>
          </span>
          <span className="text-xs font-bold text-[#111d3d]">Live map</span>
        </Link>

        <Link
          href="/routes"
          className="flex flex-col items-center justify-center gap-1.5 h-20 rounded-2xl bg-white border border-slate-200/80 p-2 text-center shadow-xs active:scale-[0.98] transition"
        >
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-[#16866f]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4.5 w-4.5">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </span>
          <span className="text-xs font-bold text-[#111d3d]">Routes</span>
        </Link>

        <BookingLink
          href="/passenger"
          className="flex flex-col items-center justify-center gap-1.5 h-20 rounded-2xl bg-white border border-slate-200/80 p-2 text-center shadow-xs active:scale-[0.98] transition"
        >
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4.5 w-4.5">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <line x1="7" y1="2" x2="7" y2="4" />
              <line x1="17" y1="2" x2="17" y2="4" />
              <line x1="7" y1="10" x2="17" y2="10" />
            </svg>
          </span>
          <span className="text-xs font-bold text-[#111d3d]">Book seat</span>
        </BookingLink>
      </section>

      {/* Compact Interactive Map Card (~220px) Fitted to Faisalabad */}
      <section className="relative h-[220px] w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-xs">
        <HomeRouteMap />
        <Link
          href="/live-map"
          className="absolute right-3 bottom-3 z-20 flex items-center gap-1.5 rounded-lg bg-[#111d3d]/90 backdrop-blur-xs px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-md active:scale-95"
        >
          <span>Full map</span>
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      {/* Horizontal Swipeable Route Chips */}
      <section className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Popular routes</h2>
          <Link href="/routes" className="text-[11px] font-semibold text-[#536bb7]">View all</Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
          {routes.slice(0, 6).map((route) => (
            <Link
              key={route._id}
              href={`/live-map?route=${encodeURIComponent(route._id)}`}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-2 shadow-2xs active:bg-slate-50 transition"
            >
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-blue-50 text-[10px] font-bold text-[#536bb7]">
                BUS
              </span>
              <div className="text-left">
                <span className="block text-xs font-bold text-[#111d3d] whitespace-nowrap">{route.routeName}</span>
                <span className="block text-[10px] text-slate-500 whitespace-nowrap">
                  {route.startPoint || "Start"} → {route.endPoint || "End"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Nearby Buses Live Cards */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Nearby buses in service</h2>
          <span className="text-[11px] font-medium text-slate-400">Live updates</span>
        </div>
        <div className="flex flex-col gap-2">
          {displayBuses.map((bus) => (
            <Link
              key={bus._id}
              href={`/live-map?bus=${encodeURIComponent(bus._id)}`}
              className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs active:scale-[0.99] transition"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#111d3d] to-[#25304f] text-xs font-bold text-white">
                  {bus.busNumber || "SS"}
                </span>
                <div>
                  <h3 className="text-xs font-bold text-[#111d3d]">
                    {typeof bus.route === "object" ? bus.route?.routeName : bus.routeName || "City Transit Route"}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Next: {typeof bus.nextStop === "object" ? bus.nextStop?.stopName : bus.nextStop || "Clock Tower"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  {bus.availableSeats != null ? `${bus.availableSeats} seats` : "Seats available"}
                </span>
                <p className="text-[10px] font-semibold text-[#536bb7] mt-0.5">
                  {bus.etaMinutes != null ? `ETA ${Math.round(bus.etaMinutes)}m` : "On route"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}


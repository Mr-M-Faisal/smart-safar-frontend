"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BrandMark from "@/components/layout/BrandMark";

export default function RoleLayout({ role, title, links = [], children }) {
  const [activeTab, setActiveTab] = useState("");
  const isDriver = role === "Driver";
  const isAdmin = role === "Administrator";

  useEffect(() => {
    const syncTab = () => setActiveTab(window.location.hash || window.location.pathname.replace(/\/+$/, "") || "/");
    syncTab();
    window.addEventListener("hashchange", syncTab);
    window.addEventListener("popstate", syncTab);
    return () => {
      window.removeEventListener("hashchange", syncTab);
      window.removeEventListener("popstate", syncTab);
    };
  }, []);

  function linkIsActive(href) {
    const hashIndex = href.indexOf("#");
    return hashIndex >= 0 ? activeTab === href.slice(hashIndex) : activeTab === (href.split(/[?#]/)[0].replace(/\/+$/, "") || "/");
  }

  return (
    <div className="app-shell">
      {/* Top App Bar */}
      <header className="app-bar border-b border-white/10 shadow-sm z-30">
        <div className="flex h-13 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 active:opacity-80">
            <BrandMark size="sm" tone="dark" />
            <div>
              <span className="block text-sm font-bold tracking-tight text-white leading-tight">Smart Safar</span>
              <span className="block text-[9px] font-semibold uppercase tracking-[0.16em] text-[#a5f1df] leading-none">{role}</span>
            </div>
          </Link>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-white/80">
            {title}
          </span>
        </div>
      </header>

      {/* Role Sub-Navigation Tabs */}
      {links.length > 0 && (
        <nav aria-label={`${role} tabs`} className="flex-shrink-0 border-b border-slate-200 bg-white px-3 py-1.5 overflow-x-auto no-scrollbar flex gap-1.5 z-20">
          {links.map(({ label, href }) => {
            const NavLink = isAdmin ? "a" : Link;
            const isActive = linkIsActive(href);
            return (
              <NavLink
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
                  isActive
                    ? "bg-[#536bb7] text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {label}
              </NavLink>
            );
          })}
        </nav>
      )}

      {/* Scrollable Content */}
      <main className="app-content p-4 max-w-lg mx-auto w-full pb-8">
        {children}
      </main>

      {/* Edge-to-edge Bottom Nav Bar */}
      <nav aria-label="Mobile navigation" className="app-bottom-nav z-30">
        <div className="grid grid-cols-4 h-14">
          <Link
            href="/"
            className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-white/60 active:scale-95"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5 stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3.5 10 8.5-7 8.5 7v9a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 19v-9Z"/><path d="M9 20.5v-7h6v7"/>
            </svg>
            <span className="tracking-tight">Home</span>
          </Link>
          <Link
            href="/live-map"
            className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-white/60 active:scale-95"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5 stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6.5 8.5 4l7 2.5L21 4v13.5L15.5 20l-7-2.5L3 20V6.5Z"/><path d="M8.5 4v13.5M15.5 6.5V20"/>
            </svg>
            <span className="tracking-tight">Live map</span>
          </Link>
          <Link
            href="/routes"
            className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-white/60 active:scale-95"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5 stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 4h14M5 10h14M5 16h14"/><circle cx="3" cy="4" r=".6" fill="currentColor"/><circle cx="3" cy="10" r=".6" fill="currentColor"/><circle cx="3" cy="16" r=".6" fill="currentColor"/>
            </svg>
            <span className="tracking-tight">Routes</span>
          </Link>
          <Link
            href={isDriver ? "/driver" : isAdmin ? "/admin" : "/passenger"}
            className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-[#a5f1df] active:scale-95"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5 stroke-[#a5f1df]" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="7" r="4" /><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
            </svg>
            <span className="tracking-tight">{role}</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
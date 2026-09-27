"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BrandMark from "@/components/layout/BrandMark";

export default function RoleLayout({ role, title, links = [], children }) {
  const [activeTab, setActiveTab] = useState("");
  const isDriver = role === "Driver";

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
    <div className={`role-layout min-h-screen min-w-0 bg-canvas lg:grid ${isDriver ? "lg:grid-cols-[280px_minmax(0,1fr)]" : "lg:grid-cols-[250px_minmax(0,1fr)]"}`}>
      <aside className={`sticky top-0 z-[1100] flex min-w-0 flex-col p-4 lg:h-screen lg:overflow-y-auto lg:p-6 ${isDriver ? "driver-sidebar" : "border-b border-slate-200 bg-white/95 shadow-[0_8px_22px_rgba(44,58,105,.07)] backdrop-blur-xl lg:border-b-0 lg:border-r lg:shadow-none"}`}>
        <Link href="/" className={`relative z-10 inline-flex w-fit items-center gap-2 text-sm font-bold ${isDriver ? "driver-brand" : "text-ink"}`}>
          <BrandMark size="sm" tone={isDriver ? "dark" : "light"} />
          <span>Smart Safar <span className={`ml-1 font-medium ${isDriver ? "driver-brand-role" : "text-slate-500"}`}>/ {role}</span></span>
        </Link>

        {isDriver && <div className="driver-sidebar-intro relative z-10 mt-8 hidden lg:block">
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#9feedd]">Faisalabad transit</p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-white">On the move.</h2>
          <p className="mt-1 text-xs leading-5 text-white/65">Your route and shift tools, all in one place.</p>
        </div>}

        <p className={`relative z-10 mb-2 mt-5 px-2 text-[9px] font-bold uppercase tracking-[.2em] ${isDriver ? "driver-sidebar-label lg:mt-9" : "text-[#9aa4ba] lg:mt-8"}`}>Workspace menu</p>
        <nav className={`relative z-10 flex gap-2 overflow-x-auto pb-1 lg:flex-col ${isDriver ? "driver-nav" : ""}`} aria-label={`${role} navigation`}>
          {links.map(({ label, href }, index) => {
            const isActive = linkIsActive(href);
            return <Link key={href} href={href} aria-current={isActive ? "page" : undefined} className={`group inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2.5 text-xs font-semibold transition duration-200 hover:-translate-y-0.5 sm:text-sm lg:w-full ${isDriver ? `driver-nav-link ${isActive ? "is-active" : ""}` : `${isActive ? "border-[#d6def8] bg-gradient-to-r from-[#e9edff] to-[#f4f6fc] text-[#405ba7] shadow-sm" : "border-transparent text-slate-600 hover:border-[#e4e9f7] hover:bg-[#f7f8fc] hover:text-[#405ba7]"} hover:shadow-sm`}`}>
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[9px] font-bold transition ${isDriver ? "driver-nav-index" : isActive ? "bg-[#536bb7] text-white" : "bg-[#f0f2fa] text-[#7381a4] group-hover:bg-[#e9edff] group-hover:text-[#536bb7]"}`}>{String(index + 1).padStart(2, "0")}</span>
              {label}
              {isDriver && <span className="driver-nav-arrow ml-auto" aria-hidden="true">→</span>}
            </Link>;
          })}
        </nav>

        {isDriver && <div className="driver-sidebar-footer relative z-10 mt-auto hidden lg:block">
          <span className="driver-sidebar-pulse" aria-hidden="true" />
          <p className="text-xs font-semibold text-white">Driver workspace</p>
          <p className="mt-1 text-[10px] leading-4 text-white/60">Your shift status and assigned bus are ready to manage.</p>
          <span className="mt-4 block border-t border-white/15 pt-3 text-[9px] font-bold uppercase tracking-[.18em] text-white/45">Smart Safar · Faisalabad</span>
        </div>}
      </aside>
      <main className="workspace-theme min-w-0 p-4 sm:p-8 lg:p-10">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-transit-700">{role} workspace</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">{title}</h1>
        </header>
        {children}
      </main>
    </div>
  );
}
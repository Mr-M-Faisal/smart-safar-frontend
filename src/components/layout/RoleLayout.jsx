"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import BrandMark from "@/components/layout/BrandMark";
import InstallButton from "@/components/app/InstallButton";
import BottomTabBar from "@/components/app/BottomTabBar";
import ProfileMenu from "@/components/layout/ProfileMenu";
import NotificationBell from "@/components/app/NotificationBell";
import DesktopRefreshButton from "@/components/app/DesktopRefreshButton";
import AppIcon from "@/components/app/icons";
import { useAuth } from "@/lib/auth/AuthProvider";
import { homeForRole } from "@/lib/auth/roleHome";
import { revokeAndClearSession } from "@/lib/session";

export default function RoleLayout({ role, title, links = [], children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const auth = useAuth();
  const isDriver = role === "Driver";
  const isAdmin = role === "Administrator";
  const roleKey = isAdmin ? "admin" : isDriver ? "driver" : "commuter";
  const pageTitle = isAdmin && pathname === "/admin" && searchParams.get("tab") === "settings" ? "Settings" : title;
  const [pageMotion, setPageMotion] = useState(false);
  const previousLocation = useRef(null);
  const locationKey = `${pathname}?${searchParams.toString()}`;
  function signOut() {
    void revokeAndClearSession(roleKey);
    router.replace("/login");
  }
  useEffect(() => {
    const previous = previousLocation.current;
    previousLocation.current = locationKey;
    if (!previous || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    setPageMotion(true);
    const timer = window.setTimeout(() => setPageMotion(false), 180);
    return () => window.clearTimeout(timer);
  }, [locationKey]);

  function linkIsActive(href) {
    const target = new URL(href, "https://smartsafar.invalid");
    if (isAdmin) {
      const sameTab = (searchParams.get("tab") || "overview") === (target.searchParams.get("tab") || "overview");
      const currentHash = typeof window === "undefined" ? "" : window.location.hash;
      return pathname === target.pathname && sameTab && (target.hash ? target.hash === currentHash : !["#stops", "#alerts"].includes(currentHash));
    }
    return pathname === (target.pathname.replace(/\/+$/, "") || "/");
  }

  return (
    <div className={`role-layout min-h-screen min-w-0 bg-canvas lg:grid ${isDriver ? "lg:grid-cols-[280px_minmax(0,1fr)]" : "lg:grid-cols-[250px_minmax(0,1fr)]"}`}>
      <aside className={`sticky top-0 z-[1100] hidden min-w-0 flex-col p-4 lg:flex lg:h-screen lg:overflow-y-auto lg:p-6 ${isDriver ? "driver-sidebar" : "border-b border-slate-200 bg-white/95 shadow-[0_8px_22px_rgba(44,58,105,.07)] backdrop-blur-xl lg:border-b-0 lg:border-r lg:shadow-none"}`}>
        <Link href={homeForRole(roleKey)} className={`relative z-10 inline-flex w-fit items-center gap-2 text-sm font-bold ${isDriver ? "driver-brand" : "text-ink"}`}>
          <BrandMark size="sm" tone={isDriver ? "dark" : "light"} />
          <span>Smart Safar <span className={`ml-1 font-medium ${isDriver ? "driver-brand-role" : "text-slate-500"}`}>/ {role}</span></span>
        </Link>

        {isDriver && <div className="driver-sidebar-intro relative z-10 mt-8 hidden lg:block">
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#9feedd]">Faisalabad transit</p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-white">On the move.</h2>
          <p className="mt-1 text-xs leading-5 text-white/65">Your route and shift tools, all in one place.</p>
        </div>}

        <p className={`relative z-10 mb-2 mt-5 hidden px-2 text-[9px] font-bold uppercase tracking-[.2em] lg:block ${isDriver ? "driver-sidebar-label lg:mt-9" : "text-[#9aa4ba] lg:mt-8"}`}>Workspace menu</p>
        <nav className={`relative z-10 flex gap-2 overflow-x-auto pb-1 lg:flex-col ${isDriver ? "driver-nav" : ""}`} aria-label={`${role} navigation`}>
          {links.map(({ label, href }, index) => {
            const isActive = linkIsActive(href);
            const icon = /dashboard|overview/i.test(label) ? "Home" : /bus/i.test(label) ? "Bus" : /route/i.test(label) ? "Routes" : /driver|profile/i.test(label) ? "User" : /stop|map/i.test(label) ? "Map" : /alert|notification/i.test(label) ? "Bell" : /report/i.test(label) ? "Report" : /setting/i.test(label) ? "Sun" : /booking|ticket/i.test(label) ? "Ticket" : "Home";
            return <Link key={href} href={href} scroll={false} onClick={isAdmin ? (event) => { if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); router.replace(href, { scroll: false }); const hash = new URL(href, "https://smartsafar.invalid").hash; if (hash) window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }), 120); } } : undefined} aria-current={isActive ? "page" : undefined} className={`group inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2.5 text-xs font-semibold transition duration-200 hover:-translate-y-0.5 sm:text-sm lg:w-full ${isDriver ? `driver-nav-link ${isActive ? "is-active" : ""}` : `${isActive ? "border-[#d6def8] bg-gradient-to-r from-[#e9edff] to-[#f4f6fc] text-[#405ba7] shadow-sm" : "border-transparent text-slate-600 hover:border-[#e4e9f7] hover:bg-[#f7f8fc] hover:text-[#405ba7]"} hover:shadow-sm`}`}>
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg transition ${isDriver ? "driver-nav-index text-[9px] font-bold" : isAdmin ? (isActive ? "bg-[#536bb7] text-white" : "bg-[#f0f2fa] text-[#7381a4] group-hover:bg-[#e9edff] group-hover:text-[#536bb7]") : "text-[9px] font-bold"}`}>{isAdmin ? <AppIcon name={icon} size={16}/> : String(index + 1).padStart(2, "0")}</span>
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
      <header className="fixed inset-x-0 top-0 z-[1400] flex min-h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur lg:hidden"><Link href={homeForRole(roleKey)} className="flex items-center gap-2"><BrandMark size="sm"/><span className="text-sm font-bold text-[#293553]">Smart Safar <small className="block text-[9px] font-medium text-[#77829a]">{role}</small></span></Link><div className="flex items-center gap-1"><InstallButton/><NotificationBell/>{auth.status === "authenticated" && <ProfileMenu name={auth.user?.name} email={auth.user?.email} role={role} variant="light" homeHref={homeForRole(roleKey)} homeLabel="Open dashboard" dashboardLinks={[{ label: "Profile", href: "/account/profile" }, { label: "Settings", href: "/account/settings" }]} switchAccountHref="/login?switch=1" onSignOut={signOut}/>}</div></header>
      <main className="workspace-theme min-w-0 px-4 pb-24 pt-20 sm:px-8 sm:pb-28 sm:pt-24 lg:p-10">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-transit-700">{role} workspace</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">{pageTitle}</h1>
          </div>
          <div className="hidden items-center gap-2 lg:flex"><DesktopRefreshButton/><InstallButton/><NotificationBell/>{auth.status === "authenticated" && <ProfileMenu name={auth.user?.name} email={auth.user?.email} role={role} variant="light" compact simple={isAdmin} homeHref={homeForRole(roleKey)} homeLabel="Open dashboard" dashboardLinks={[{ label: "Profile", href: "/account/profile" }, { label: "Settings", href: isAdmin ? "/admin?tab=settings" : "/account/settings" }]} switchAccountHref="/login?switch=1" onSignOut={signOut}/>}</div>
        </header>
        <div className={pageMotion ? "ss-desktop-page-in" : ""}>{children}</div>
      </main>
      <BottomTabBar label={`${role} navigation`} items={(isDriver ? [{ label: "Shift", href: "/driver", icon: "Bus" }, { label: "Map", href: "/live-map", icon: "Map" }, { label: "Account", href: "/account/settings", icon: "User" }] : isAdmin ? [{ label: "Dashboard", href: "/admin", icon: "Home" }, { label: "Buses", href: "/admin?tab=buses", icon: "Bus" }, { label: "Routes", href: "/admin?tab=routes", icon: "Routes" }, { label: "Drivers", href: "/admin?tab=drivers", icon: "User" }, { label: "Stops", href: "/admin?tab=routes#stops", icon: "Map" }] : [{ label: "Home", href: "/", icon: "Home" }, { label: "Map", href: "/live-map", icon: "Map" }, { label: "Routes", href: "/routes", icon: "Routes" }, { label: "Book", href: "/passenger", icon: "Ticket" }])} className="ss-role-tabs" />
    </div>
  );
}

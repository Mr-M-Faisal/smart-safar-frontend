"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { clearSessionToken, readSessionToken, revokeAndClearSession } from "@/lib/session";
import ProfileMenu from "@/components/layout/ProfileMenu";
import BookingLink from "@/components/layout/BookingLink";
import BrandMark from "@/components/layout/BrandMark";
import ConnectivityNotice from "@/components/layout/ConnectivityNotice";

const links = [
  ["Home", "/"],
  ["Live map", "/live-map"],
  ["Routes", "/routes"],
  ["Book a seat", "/passenger"],
];

function isNavigationActive(pathname, href) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`)) || (href === "/passenger" && pathname.startsWith("/booking-preview"));
}

export default function PublicLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const signInHref = typeof window === "undefined" ? "/login" : `/login?returnTo=${encodeURIComponent(`${pathname}${window.location.search}${window.location.hash}`)}`;
  const [passenger, setPassenger] = useState(null);
  useEffect(() => {
    let active = true;
    const token = readSessionToken("commuter");
    if (!token) { setPassenger(null); return () => { active = false; }; }
    apiRequest("/auth/profile", { token }).then((user) => { if (active && user.role === "commuter") setPassenger(user); }).catch(() => { if (active) setPassenger(null); });
    return () => { active = false; };
  }, [pathname]);
  return (
    <div className="app-shell">
      {/* Top App Bar - matches status bar #111d3d */}
      <header className="app-bar border-b border-white/10 shadow-sm z-30">
        <div className="flex h-13 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5 active:opacity-80" aria-label="Smart Safar home">
            <BrandMark size="header" className="public-brand-mark !h-8 !w-8" />
            <div>
              <span className="block text-sm font-bold tracking-tight text-white leading-tight">Smart Safar</span>
              <span className="block text-[9px] font-semibold uppercase tracking-[0.16em] text-[#a5f1df] leading-none">Faisalabad Transit</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {passenger ? (
              <ProfileMenu
                name={passenger.name}
                email={passenger.email}
                role="Passenger"
                variant="dark"
                dashboardLinks={[
                  { label: "My bookings", href: "/passenger#history" },
                  { label: "Trip security", href: "/passenger#security" },
                  { label: "Report an issue", href: "/passenger#report" },
                ]}
                onSignOut={() => {
                  void revokeAndClearSession("commuter");
                  setPassenger(null);
                  router.push("/login");
                }}
              />
            ) : (
              <Link
                href={signInHref}
                className="inline-flex h-8 items-center rounded-lg bg-[#536bb7] px-3 text-xs font-semibold text-white shadow-sm active:bg-[#43599f]"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
        <ConnectivityNotice />
      </header>

      {/* Scrollable Viewport Content */}
      <main className="app-content">
        {children}
      </main>

      {/* Full-width Native Bottom Tab Bar */}
      <nav aria-label="Mobile navigation" className="app-bottom-nav z-30">
        <div className="grid grid-cols-4 h-14">
          {links.map(([label, href]) => {
            const active = isNavigationActive(pathname, href);
            const NavLink = href === "/passenger" ? BookingLink : Link;
            const icon = href === "/" ? (
              <><path d="m3.5 10 8.5-7 8.5 7v9a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 19v-9Z"/><path d="M9 20.5v-7h6v7"/></>
            ) : href === "/live-map" ? (
              <><path d="M3 6.5 8.5 4l7 2.5L21 4v13.5L15.5 20l-7-2.5L3 20V6.5Z"/><path d="M8.5 4v13.5M15.5 6.5V20"/></>
            ) : href === "/routes" ? (
              <><path d="M5 4h14M5 10h14M5 16h14"/><circle cx="3" cy="4" r=".6" fill="currentColor"/><circle cx="3" cy="10" r=".6" fill="currentColor"/><circle cx="3" cy="16" r=".6" fill="currentColor"/></>
            ) : (
              <><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M7 5V3m10 2V3M3 10h18M8 14h3m2 0h3"/></>
            );
            return (
              <NavLink
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition active:scale-95 ${
                  active ? "text-[#a5f1df]" : "text-white/60 hover:text-white"
                }`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={`h-5 w-5 ${active ? "stroke-[#a5f1df]" : "stroke-current"}`}
                  strokeWidth={active ? "2.2" : "1.8"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {icon}
                </svg>
                <span className="tracking-tight">{label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}


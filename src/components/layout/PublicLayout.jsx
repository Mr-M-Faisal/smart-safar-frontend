"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { revokeAndClearSession } from "@/lib/session";
import { useAuth } from "@/lib/auth/AuthProvider";
import ProfileMenu from "@/components/layout/ProfileMenu";
import BookingLink from "@/components/layout/BookingLink";
import BrandMark from "@/components/layout/BrandMark";
import ConnectivityNotice from "@/components/layout/ConnectivityNotice";
import InstallButton from "@/components/app/InstallButton";
import BottomTabBar from "@/components/app/BottomTabBar";
import { homeForRole } from "@/lib/auth/roleHome";
import VersionStatus from "@/components/app/VersionStatus";
import DesktopRefreshButton from "@/components/app/DesktopRefreshButton";
import { readBookingSelection } from "@/lib/bookingSelection";

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
  const auth = useAuth();
  const [pageMotion, setPageMotion] = useState(false);
  const previousPath = useRef(null);
  useEffect(() => {
    const previous = previousPath.current;
    previousPath.current = pathname;
    if (!previous || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    setPageMotion(true);
    const timer = window.setTimeout(() => setPageMotion(false), 180);
    return () => window.clearTimeout(timer);
  }, [pathname]);
  const signedIn = auth.status === "authenticated";
  const profile = signedIn ? auth.user : null;
  const roleLabel = auth.role === "admin" ? "Administrator" : auth.role === "driver" ? "Driver" : "Passenger";
  const bookHref = signedIn && auth.role === "commuter" ? "/passenger" : "/booking-preview";
  function openSelectedBooking(event) {
    const saved = readBookingSelection();
    const params = new URLSearchParams(window.location.search);
    const route = params.get("route") || saved.routeId;
    const bus = params.get("bus") || saved.busId;
    const seat = params.get("seat") || saved.seatNumber;
    if (!route) return;
    event.preventDefault();
    const query = new URLSearchParams({ route });
    if (bus) query.set("bus", bus);
    if (seat) query.set("seat", seat);
    router.push(`${bookHref}?${query.toString()}${bookHref === "/passenger" ? "#booking" : ""}`);
  }
  const logoHref = signedIn ? homeForRole(auth.role, false) : "/";
  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col overflow-x-clip bg-night text-white">
      <header className="public-header sticky top-0 z-[1400] border-b border-[#d9def0] bg-[#eef0fa]/95 text-[#25304f] shadow-[0_5px_24px_rgba(40,52,92,.08)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-2 px-[var(--layout-gutter)] py-2.5 sm:gap-4 sm:px-8 sm:py-4 lg:px-12">
          <Link href={logoHref} className="flex min-w-0 items-center gap-2 sm:gap-3" aria-label="Smart Safar home">
            <BrandMark size="header" className="public-brand-mark" />
            <span className="min-w-0">
              <span className="block whitespace-nowrap text-[13px] font-bold tracking-tight text-[#25304f] sm:text-sm">Smart Safar</span>
              <span className="public-brand-tagline block whitespace-nowrap text-[8px] font-semibold uppercase tracking-[.16em] text-[#586fb5] sm:text-[10px] sm:tracking-[0.2em]">Faisalabad Transit</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
            {links.map(([label, href]) => {
              const active = isNavigationActive(pathname, href);
              const NavLink = href === "/passenger" ? BookingLink : Link;
              return <NavLink key={href} href={href} aria-current={active ? "page" : undefined} className={`rounded-full px-3 py-2 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-[#405ba7] hover:shadow-sm ${active ? "bg-white text-[#405ba7] shadow-sm" : "text-[#596681]"}`}>{label}</NavLink>;
            })}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <DesktopRefreshButton />
            <InstallButton />
            {auth.status === "loading" ? <span aria-hidden="true" className="inline-block h-11 w-[4.75rem] rounded-full sm:w-[6.5rem]" /> : signedIn ? <ProfileMenu name={profile?.name} email={profile?.email} role={roleLabel} variant="light" compact homeHref={homeForRole(auth.role, false)} homeLabel="Open dashboard" dashboardLinks={[{ label: "Profile", href: "/account/profile" }, { label: "Settings", href: auth.role === "admin" ? "/admin?tab=settings" : "/account/settings" }, ...(auth.role === "commuter" ? [{ label: "My trips", href: "/passenger?tab=history" }, { label: "Trip security", href: "/passenger?tab=security" }] : [])]} onSignOut={() => { void revokeAndClearSession(auth.role); router.push("/login"); }} /> : <Link href={signInHref} className="rounded-full border border-[#536bb7] bg-[#536bb7] px-3.5 py-2.5 text-xs font-semibold text-white shadow-[0_7px_18px_rgba(83,107,183,.2)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#43599f] hover:shadow-[0_10px_24px_rgba(83,107,183,.3)] sm:px-5 sm:text-sm">Sign in <span aria-hidden="true" className="ml-1 text-[#c7f8ec]">↗</span></Link>}
          </div>
        </div>
      </header>
      <ConnectivityNotice />
      <div className={`flex-1 bg-[#f4f5fb] pb-20 lg:bg-transparent lg:pb-0 ${pageMotion ? "ss-public-page-in" : ""}`}>{children}</div>
      <footer className="public-footer border-t border-white/15 bg-gradient-to-br from-[#344d91] via-[#40599f] to-[#26386e] text-white">
        <div className="mx-auto grid max-w-[1440px] gap-7 px-5 py-8 sm:grid-cols-2 sm:px-8 sm:gap-12 sm:py-12 lg:grid-cols-[1.35fr_.8fr_1fr] lg:px-12 lg:py-16">
          <div>
            <Link href="/" className="inline-flex items-center gap-3" aria-label="Smart Safar home">
              <BrandMark tone="dark" />
              <span><span className="block text-base font-bold">Smart Safar</span><span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[.2em] text-[#b8f5e6]">Faisalabad Transit</span></span>
            </Link>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/75">A student-built transit tracking project to help Faisalabad commuters explore routes, stops, bus availability, and journey updates.</p>
            <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[.08] px-3.5 py-2 text-xs font-medium text-white/85"><span className="h-1.5 w-1.5 rounded-full bg-[#79e3ce]"/> Made for Faisalabad, Pakistan</span>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[.18em] text-[#b8f5e6]">Explore</h2>
            <nav className="footer-explore-list mt-3 flex flex-col items-stretch text-sm text-white/80 sm:mt-4 sm:items-start sm:gap-3" aria-label="Footer navigation">
              {links.map(([label, href]) => { const NavLink = href === "/passenger" ? BookingLink : Link; return <NavLink key={href} href={href} className="footer-explore-link flex min-h-11 items-center border-b border-white/10 transition hover:translate-x-1 hover:text-white sm:min-h-0 sm:border-0">{label}</NavLink>; })}
              <Link href={signInHref} className="footer-explore-link flex min-h-11 items-center border-b border-white/10 transition hover:translate-x-1 hover:text-white sm:min-h-0 sm:border-0">Sign in</Link>
            </nav>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[.18em] text-[#b8f5e6]">What you can explore</h2>
            <ul className="footer-feature-list mt-3 space-y-1 text-sm leading-5 text-white/75 sm:mt-4 sm:space-y-3">
              <li className="flex min-h-11 items-center gap-2 sm:min-h-0"><span className="text-[#a8efdf]">✓</span> Search local routes and stops</li>
              <li className="flex min-h-11 items-center gap-2 sm:min-h-0"><span className="text-[#a8efdf]">✓</span> View buses and seat availability</li>
              <li className="flex min-h-11 items-center gap-2 sm:min-h-0"><span className="text-[#a8efdf]">↗</span> Follow live tracking as it is built</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/15 bg-[#202f60]/35">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-5 py-4 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
            <span>Smart Safar · Final Year Project prototype</span>
            <span>Service details come from live transit data. Any demo details are labeled.</span>
            <VersionStatus compact />
          </div>
        </div>
          <div className="border-t border-white/15 px-5 py-3 text-center text-xs text-white/75 sm:px-8 lg:px-12"><Link href="/app" className="underline decoration-white/40 underline-offset-4 hover:text-white">Get the Smart Safar app</Link></div>
      </footer>
      <BottomTabBar label="Website navigation" items={links.map(([label, href]) => ({ label, href, icon: label === "Home" ? "Home" : label === "Live map" ? "Map" : label === "Routes" ? "Routes" : "Ticket" }))} className="ss-website-tabs" />
      <BottomTabBar label="Smart Safar app navigation" items={[
        { label: "Home", href: "/", icon: "Home", exact: true },
        { label: "Map", href: "/live-map", icon: "Map" },
        { label: "Routes", href: "/routes", icon: "Routes" },
        { label: "Book", href: bookHref, icon: "Ticket", matchPaths: ["/passenger", "/booking-preview"], onClick: openSelectedBooking },
      ]} className="ss-app-tabs" />
    </div>
  );
}

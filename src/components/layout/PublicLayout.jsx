"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { clearSessionToken, readSessionToken, revokeAndClearSession } from "@/lib/session";
import ProfileMenu from "@/components/layout/ProfileMenu";
import BookingLink from "@/components/layout/BookingLink";
import BrandMark from "@/components/layout/BrandMark";

const links = [
  ["Home", "/"],
  ["Live map", "/live-map"],
  ["Routes", "/routes"],
  ["Book a seat", "/passenger"],
];

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
    <div className="min-h-screen w-full min-w-0 overflow-x-clip bg-night text-white">
      <header className="public-header sticky top-0 z-[1200] border-b border-[#d9def0] bg-[#eef0fa]/95 text-[#25304f] shadow-[0_5px_24px_rgba(40,52,92,.08)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-2 px-[var(--layout-gutter)] py-2.5 sm:gap-4 sm:px-8 sm:py-4 lg:px-12">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3" aria-label="Smart Safar home">
            <BrandMark size="header" className="public-brand-mark" />
            <span className="min-w-0">
              <span className="block whitespace-nowrap text-[13px] font-bold tracking-tight text-[#25304f] sm:text-sm">Smart Safar</span>
              <span className="public-brand-tagline block whitespace-nowrap text-[8px] font-semibold uppercase tracking-[.16em] text-[#586fb5] sm:text-[10px] sm:tracking-[0.2em]">Faisalabad Transit</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
            {links.map(([label, href]) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
              const NavLink = href === "/passenger" ? BookingLink : Link;
              return <NavLink key={href} href={href} aria-current={active ? "page" : undefined} className={`rounded-full px-3 py-2 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-[#405ba7] hover:shadow-sm ${active ? "bg-white text-[#405ba7] shadow-sm" : "text-[#596681]"}`}>{label}</NavLink>;
            })}
          </nav>
          <div className="flex shrink-0 items-center">
            {passenger ? <ProfileMenu name={passenger.name} email={passenger.email} role="Passenger" variant="light" dashboardLinks={[{ label: "My bookings", href: "/passenger#history" }, { label: "Trip security", href: "/passenger#security" }, { label: "Report an issue", href: "/passenger#report" }]} onSignOut={() => { void revokeAndClearSession("commuter"); setPassenger(null); router.push("/login"); }} /> : <Link href={signInHref} className="rounded-full border border-[#536bb7] bg-[#536bb7] px-3.5 py-2.5 text-xs font-semibold text-white shadow-[0_7px_18px_rgba(83,107,183,.2)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#43599f] hover:shadow-[0_10px_24px_rgba(83,107,183,.3)] sm:px-5 sm:text-sm">Sign in <span aria-hidden="true" className="ml-1 text-[#c7f8ec]">↗</span></Link>}
          </div>
        </div>
      </header>
      <div className="bg-[#f4f5fb] pb-24 lg:bg-transparent lg:pb-0">{children}</div>
      <nav aria-label="Mobile navigation" className="mobile-tab-bar fixed inset-x-0 bottom-0 z-[1000] px-[var(--layout-gutter)] pb-[max(10px,env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 rounded-[1.35rem] border border-white/80 bg-[#111d38]/95 p-2 text-white shadow-[0_12px_36px_rgba(15,26,53,.3)] backdrop-blur-xl">
          {links.map(([label, href]) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
            const NavLink = href === "/passenger" ? BookingLink : Link;
            const icon = href === "/" ? <><path d="m3.5 10 8.5-7 8.5 7v9a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 19v-9Z"/><path d="M9 20.5v-7h6v7"/></> : href === "/live-map" ? <><path d="M3 6.5 8.5 4l7 2.5L21 4v13.5L15.5 20l-7-2.5L3 20V6.5Z"/><path d="M8.5 4v13.5M15.5 6.5V20"/></> : href === "/routes" ? <><path d="M5 4h14M5 10h14M5 16h14"/><circle cx="3" cy="4" r=".6" fill="currentColor"/><circle cx="3" cy="10" r=".6" fill="currentColor"/><circle cx="3" cy="16" r=".6" fill="currentColor"/></> : <><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M7 5V3m10 2V3M3 10h18M8 14h3m2 0h3"/></>;
            return <NavLink key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-[10px] font-semibold transition ${active ? "bg-[#536bb7] text-white shadow-[0_5px_16px_rgba(83,107,183,.35)]" : "text-white/65 hover:bg-white/10 hover:text-white"}`}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
              <span>{label}</span>
            </NavLink>;
          })}
        </div>
      </nav>
      <footer className="border-t border-white/15 bg-gradient-to-br from-[#344d91] via-[#40599f] to-[#26386e] pb-24 text-white lg:pb-0">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 sm:grid-cols-2 sm:px-8 sm:gap-12 lg:grid-cols-[1.35fr_.8fr_1fr] lg:px-12 lg:py-16">
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
            <span>Demo route and bus details are illustrative when the backend is unavailable.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

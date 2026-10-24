"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import BrandMark from "@/components/layout/BrandMark";
import ConnectivityNotice from "@/components/layout/ConnectivityNotice";
import AppIcon from "@/components/app/icons";
import InstallButton from "@/components/app/InstallButton";
import BottomTabBar from "@/components/app/BottomTabBar";
import ProfileMenu from "@/components/layout/ProfileMenu";
import { revokeAndClearSession } from "@/lib/session";
import { homeForRole } from "@/lib/auth/roleHome";
import SplashScreen from "@/components/app/SplashScreen";
import Onboarding from "@/components/app/Onboarding";
import { useAuth } from "@/lib/auth/AuthProvider";
import NotificationBell from "@/components/app/NotificationBell";
import InstallBanner from "@/components/app/InstallBanner";
import PullToRefresh from "@/components/app/PullToRefresh";
import { AppRefreshProvider } from "@/components/app/AppRefreshContext";

const passengerTabs = [["Home", "/m", "Home"], ["Map", "/m/map", "Map"], ["Routes", "/m/routes", "Routes"], ["Trips", "/m/trips", "Trips"], ["Account", "/m/account", "User"]];
const driverTabs = [["Shift", "/m/driver", "Bus"], ["Map", "/m/map", "Map"], ["Account", "/m/account", "User"]];
const adminTabs = [["Dashboard", "/m/admin", "Home"], ["Buses", "/m/admin/buses", "Bus"], ["Routes", "/m/admin/routes", "Routes"], ["Drivers", "/m/admin/drivers", "User"], ["Stops", "/m/admin/stops", "Map"]];
const pageTitles = [["/m", "Home"], ["/m/map", "Live map"], ["/m/routes", "Routes"], ["/m/book", "Book a seat"], ["/m/trips", "My trips"], ["/m/account", "Account"], ["/m/account/profile", "Profile"], ["/m/login", "Sign in"], ["/m/driver", "Driver shift"]];

function viewCookie(view) {
  document.cookie = `ss-view=${view}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}

export default function AppViewport({ children }) {
  const pathname = usePathname() || "/m";
  const router = useRouter();
  const auth = useAuth();
  const scrollRef = useRef(null);
  const scrollPositions = useRef(new Map());
  const [onboarding, setOnboarding] = useState(false);
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [pageMotion, setPageMotion] = useState("");
  const previousPath = useRef(null);
  const isAdmin = pathname.startsWith("/m/admin") || auth.role === "admin";
  const tabs = isAdmin ? adminTabs : auth.role === "driver" ? driverTabs : passengerTabs;
  const title = pathname.startsWith("/m/admin") ? ({ "/m/admin": "Admin dashboard", "/m/admin/buses": "Buses", "/m/admin/routes": "Routes", "/m/admin/drivers": "Drivers", "/m/admin/stops": "Stops", "/m/admin/settings": "Settings", "/m/admin/bookings": "Bookings", "/m/admin/reports": "Reports" }[pathname] || "Admin") : pageTitles.find(([path]) => path === pathname)?.[1] || (pathname.startsWith("/m/routes/") ? "Route details" : "Smart Safar");
  const isHome = pathname === "/m";
  const hideTabs = ["/m/login", "/m/book"].includes(pathname) || onboarding || keyboardOpen;

  useEffect(() => {
    const content = scrollRef.current;
    if (!content) return;
    const saved = scrollPositions.current.get(pathname) || 0;
    content.scrollTop = saved;
  }, [pathname]);

  useEffect(() => {
    const previous = previousPath.current;
    previousPath.current = pathname;
    if (!previous || window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.querySelector(".ss-splash.is-visible")) { setPageMotion(""); return undefined; }
    const activeItems = isAdmin ? adminTabs : auth.role === "driver" ? driverTabs : passengerTabs;
    const previousIndex = activeItems.findIndex(([, href]) => href === previous);
    const currentIndex = activeItems.findIndex(([, href]) => href === pathname);
    const motion = previousIndex >= 0 && currentIndex >= 0 && previousIndex !== currentIndex ? "ss-page-in-tab" : (pathname.split("/").length > previous.split("/").length ? "ss-page-in-right" : "ss-page-in-left");
    setPageMotion(motion);
    const timer = window.setTimeout(() => setPageMotion(""), 240);
    return () => window.clearTimeout(timer);
  }, [pathname, auth.role, isAdmin]);

  useEffect(() => {
    setIsPreview(new URLSearchParams(window.location.search).get("preview") === "1");
    const setHeight = () => {
      const viewport = window.visualViewport;
      document.documentElement.style.setProperty("--ss-app-height", `${viewport?.height || window.innerHeight}px`);
      const editing = document.activeElement?.matches("input, textarea, select, [contenteditable='true']");
      setKeyboardOpen(Boolean(editing && viewport && window.innerHeight - viewport.height > 120));
    };
    setHeight();
    window.visualViewport?.addEventListener("resize", setHeight);
    window.addEventListener("resize", setHeight);
    document.addEventListener("focusin", setHeight);
    document.addEventListener("focusout", setHeight);
    document.documentElement.classList.add("ss-app-active");
    return () => {
      window.visualViewport?.removeEventListener("resize", setHeight);
      window.removeEventListener("resize", setHeight);
      document.removeEventListener("focusin", setHeight);
      document.removeEventListener("focusout", setHeight);
      document.documentElement.classList.remove("ss-app-active");
      document.documentElement.style.removeProperty("--ss-app-height");
    };
  }, []);

  useEffect(() => {
    try { setOnboarding(!localStorage.getItem("ss-onboarded")); } catch (_error) { setOnboarding(false); }
    setOnboardingReady(true);
  }, []);

  function switchView(view) {
    viewCookie(view);
    if (view === "web") window.location.assign(pathname === "/m" ? "/" : pathname.replace(/^\/m(?:\/|$)/, "/"));
    else window.location.assign(pathname === "/" ? "/m" : pathname.replace(/^\/(?:live-map|routes|passenger|login|driver)/, (path) => ({ "/live-map": "/m/map", "/routes": "/m/routes", "/passenger": "/m/book", "/login": "/m/login", "/driver": "/m/driver" })[path] || "/m"));
  }

  return <div className={`m-app-stage${isPreview ? " is-preview" : ""}`} data-mode={isPreview ? "web" : "app"}>
    {isPreview && <div className="m-app-preview-banner">Mobile app preview · <button type="button" onClick={() => switchView("web")}>Open website</button></div>}
    <div className="m-app-frame app-shell">
      <header className="app-topbar">
        {isHome || (isAdmin && pathname === "/m/admin") ? <Link href={homeForRole(auth.role, true)} className="app-brand" aria-label="Smart Safar home"><BrandMark size="sm"/><span><strong>Smart Safar</strong><small>{isAdmin ? "Administrator" : auth.role === "driver" ? "Driver" : "Faisalabad Transit"}</small></span></Link> : <><button type="button" aria-label="Go back" className="app-icon-button" onClick={() => { if (window.history.length > 1) window.history.back(); else window.location.assign(homeForRole(auth.role, true)); }}><AppIcon name="Back"/></button><h1>{title}</h1></>}
        <div className="flex items-center gap-1"><InstallButton /><NotificationBell/>{auth.status === "authenticated" ? <ProfileMenu name={auth.user?.name} email={auth.user?.email} role={auth.role === "admin" ? "Administrator" : auth.role === "driver" ? "Driver" : "Passenger"} variant="light" homeHref={homeForRole(auth.role, true)} homeLabel="Open dashboard" switchAccountHref="/m/login?switch=1" dashboardLinks={[{ label: "Profile", href: isAdmin ? "/m/admin/settings" : "/m/account" }, { label: "Settings", href: isAdmin ? "/m/admin/settings" : "/m/account" }]} onSignOut={() => { void revokeAndClearSession(auth.role); router.replace("/m/login"); }} /> : <Link href="/m/account" className="app-icon-button" aria-label="Account"><AppIcon name="User"/></Link>}</div>
      </header>
      <AppRefreshProvider><main id="app-content" className={`app-scroll ${pageMotion}`} ref={scrollRef} onScroll={(event) => scrollPositions.current.set(pathname, event.currentTarget.scrollTop)} key={pathname}>{isHome && <InstallBanner/>}<PullToRefresh scrollRef={scrollRef} pathname={pathname}/>{children}</main></AppRefreshProvider>
      {!hideTabs && <BottomTabBar label={isAdmin ? "Admin navigation" : auth.role === "driver" ? "Driver navigation" : "Mobile app navigation"} items={tabs.map(([label, href, icon]) => ({ label, href, icon }))} className="app-tabbar" />}
    </div>
    <ConnectivityNotice />
    <SplashScreen />
    {onboardingReady && onboarding && <Onboarding onDone={() => setOnboarding(false)} />}
    {!isHome && <div className="sr-only"><button onClick={() => switchView("web")}>Use desktop site</button></div>}
  </div>;
}

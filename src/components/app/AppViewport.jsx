"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import BrandMark from "@/components/layout/BrandMark";
import ConnectivityNotice from "@/components/layout/ConnectivityNotice";
import InstallPrompt from "@/components/layout/InstallPrompt";
import AppIcon from "@/components/app/icons";
import SplashScreen from "@/components/app/SplashScreen";
import Onboarding from "@/components/app/Onboarding";
import { useAuth } from "@/lib/auth/AuthProvider";

const passengerTabs = [["Home", "/m", "Home"], ["Map", "/m/map", "Map"], ["Routes", "/m/routes", "Routes"], ["Trips", "/m/trips", "Trips"], ["Account", "/m/account", "User"]];
const driverTabs = [["Shift", "/m/driver", "Bus"], ["Map", "/m/map", "Map"], ["Account", "/m/account", "User"]];
const pageTitles = [["/m", "Home"], ["/m/map", "Live map"], ["/m/routes", "Routes"], ["/m/book", "Book a seat"], ["/m/trips", "My trips"], ["/m/account", "Account"], ["/m/login", "Sign in"], ["/m/driver", "Driver shift"]];

function viewCookie(view) {
  document.cookie = `ss-view=${view}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}

export default function AppViewport({ children }) {
  const pathname = usePathname() || "/m";
  const auth = useAuth();
  const scrollRef = useRef(null);
  const scrollPositions = useRef(new Map());
  const [onboarding, setOnboarding] = useState(false);
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const tabs = auth.role === "driver" ? driverTabs : passengerTabs;
  const title = pageTitles.find(([path]) => path === pathname)?.[1] || (pathname.startsWith("/m/routes/") ? "Route details" : "Smart Safar");
  const isHome = pathname === "/m";

  useEffect(() => {
    const content = scrollRef.current;
    if (!content) return;
    const saved = scrollPositions.current.get(pathname) || 0;
    content.scrollTop = saved;
  }, [pathname]);

  useEffect(() => {
    setIsPreview(new URLSearchParams(window.location.search).get("preview") === "1");
    const setHeight = () => document.documentElement.style.setProperty("--ss-app-height", `${window.visualViewport?.height || window.innerHeight}px`);
    setHeight();
    window.visualViewport?.addEventListener("resize", setHeight);
    window.addEventListener("resize", setHeight);
    document.documentElement.classList.add("ss-app-active");
    return () => {
      window.visualViewport?.removeEventListener("resize", setHeight);
      window.removeEventListener("resize", setHeight);
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
        {isHome ? <Link href="/m" className="app-brand" aria-label="Smart Safar home"><BrandMark size="sm"/><span><strong>Smart Safar</strong><small>Faisalabad Transit</small></span></Link> : <><button type="button" aria-label="Go back" className="app-icon-button" onClick={() => { if (window.history.length > 1) window.history.back(); else window.location.assign("/m"); }}><AppIcon name="Back"/></button><h1>{title}</h1></>}
        <Link href="/m/account" className="app-icon-button" aria-label="Account"><AppIcon name="User"/></Link>
      </header>
      <main id="app-content" className="app-scroll" ref={scrollRef} onScroll={(event) => scrollPositions.current.set(pathname, event.currentTarget.scrollTop)} key={pathname}>{children}</main>
      <nav aria-label="Mobile app navigation" className="app-tabbar">
        {tabs.map(([label, href, icon]) => {
          const active = pathname === href || (href !== "/m" && pathname.startsWith(`${href}/`));
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`app-tab${active ? " active" : ""}`}><AppIcon name={icon}/><span>{label}</span></Link>;
        })}
      </nav>
    </div>
    <ConnectivityNotice />
    {isHome && <InstallPrompt placement="app" />}
    <SplashScreen />
    {onboardingReady && onboarding && <Onboarding onDone={() => setOnboarding(false)} />}
    {!isHome && <div className="sr-only"><button onClick={() => switchView("web")}>Use desktop site</button></div>}
  </div>;
}

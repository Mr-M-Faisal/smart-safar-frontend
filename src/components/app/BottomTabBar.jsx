"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AppIcon from "@/components/app/icons";

export default function BottomTabBar({ items, label = "Mobile navigation", className = "" }) {
  const pathname = usePathname() || "/";
  const activeIndex = Math.max(0, items.findIndex((item) => {
    const target = new URL(item.href, "https://smartsafar.invalid");
    const currentSearch = typeof window === "undefined" ? "" : window.location.search;
    return (pathname === target.pathname && (!target.searchParams.has("tab") || new URLSearchParams(currentSearch).get("tab") === target.searchParams.get("tab"))) || (target.pathname !== "/" && pathname.startsWith(`${target.pathname}/`));
  }));
  return <nav aria-label={label} className={`ss-bottom-tabs ${className}`} style={{ "--tab-count": items.length, "--tab-index": activeIndex }}>
    <span aria-hidden="true" className="ss-tab-indicator" />
    {items.map((item, index) => {
      const active = index === activeIndex;
      return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`ss-tab-link${active ? " is-active" : ""}`} onClick={() => { if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8); }}>
        <span className="ss-tab-icon"><AppIcon name={item.icon || "Home"} size={20}/>{item.badge ? <span className="ss-tab-badge">{item.badge}</span> : null}</span><span className="ss-tab-label">{item.label}</span>
      </Link>;
    })}
  </nav>;
}

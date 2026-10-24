"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AppIcon from "@/components/app/icons";
import { resolveActiveTab } from "./tabLogic.cjs";

export default function BottomTabBar({ items, label = "Mobile navigation", className = "" }) {
  const pathname = usePathname() || "/";
  const search = typeof window === "undefined" ? "" : window.location.search;
  const activeIndex = resolveActiveTab(items, pathname, search);
  return <nav aria-label={label} data-none={activeIndex < 0 ? "true" : undefined} className={`ss-bottom-tabs ${className}`} style={{ "--tab-count": items.length, "--tab-index": Math.max(activeIndex, 0) }}>
    <span aria-hidden="true" className="ss-tab-indicator" />
    {items.map((item, index) => {
      const active = index === activeIndex;
      return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`ss-tab-link${active ? " is-active" : ""}`} onClick={() => { if (typeof navigator !== "undefined" && navigator.vibrate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) navigator.vibrate(8); }}>
        <span className="ss-tab-icon"><AppIcon name={item.icon || "Home"} size={20}/>{item.badge ? <span className="ss-tab-badge">{item.badge}</span> : null}</span><span className="ss-tab-label">{item.label}</span>
      </Link>;
    })}
  </nav>;
}

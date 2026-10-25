"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function label(timestamp) {
  if (!timestamp) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  return minutes < 1 ? "Updated just now" : `Updated ${minutes} min ago`;
}

export default function DesktopRefreshButton() {
  const [updatedAt, setUpdatedAt] = useState(0);
  const [, tick] = useState(0);
  const lastRefresh = useRef(0);
  const refresh = useCallback(() => {
    const now = Date.now();
    if (now - lastRefresh.current < 5000) return;
    lastRefresh.current = now;
    try { sessionStorage.setItem("ss-desktop-refreshed-at", String(now)); } catch {}
    setUpdatedAt(now);
    window.dispatchEvent(new Event("smart-safar:soft-refresh"));
  }, []);
  useEffect(() => {
    let previous = 0;
    try { previous = Number(sessionStorage.getItem("ss-desktop-refreshed-at") || 0); } catch {}
    setUpdatedAt(previous);
    lastRefresh.current = previous;
    const start = window.setTimeout(refresh, 100);
    const automaticRefresh = window.setInterval(() => { if (document.visibilityState === "visible") refresh(); }, 60000);
    const labelTimer = window.setInterval(() => tick((value) => value + 1), 60000);
    const onVisibility = () => { if (document.visibilityState === "visible" && Date.now() - lastRefresh.current >= 60000) refresh(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.clearTimeout(start); window.clearInterval(automaticRefresh); window.clearInterval(labelTimer); document.removeEventListener("visibilitychange", onVisibility); };
  }, [refresh]);
  return <span aria-live="polite" className="hidden whitespace-nowrap text-[10px] text-[#8992a8] lg:inline">{label(updatedAt)}</span>;
}

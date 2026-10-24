"use client";

import { useEffect, useState } from "react";

function label(timestamp) {
  if (!timestamp) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  return minutes < 1 ? "Updated just now" : `Updated ${minutes} min ago`;
}

export default function DesktopRefreshButton() {
  const [updatedAt, setUpdatedAt] = useState(0);
  const [, tick] = useState(0);
  useEffect(() => {
    try { setUpdatedAt(Number(sessionStorage.getItem("ss-desktop-refreshed-at") || 0)); } catch {}
    const timer = window.setInterval(() => tick((value) => value + 1), 60000);
    return () => window.clearInterval(timer);
  }, []);
  function refresh() {
    const now = Date.now();
    try { sessionStorage.setItem("ss-desktop-refreshed-at", String(now)); } catch {}
    setUpdatedAt(now);
    window.location.reload();
  }
  return <div className="hidden items-center gap-2 lg:flex"><span aria-live="polite" className="text-[10px] text-[#8992a8]">{label(updatedAt)}</span><button type="button" onClick={refresh} className="min-h-10 rounded-xl border border-[#dfe4f3] bg-white px-3 text-xs font-semibold text-[#536bb7] hover:bg-[#f6f7fb]">↻ Refresh</button></div>;
}

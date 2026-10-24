"use client";

import { useCallback, useEffect, useState } from "react";
import { getBackendStatus } from "@/lib/api";

export default function ConnectivityNotice() {
  const [status, setStatus] = useState("checking");
  const [checking, setChecking] = useState(false);
  const [staleInfo, setStaleInfo] = useState(null);
  const [headerOffset, setHeaderOffset] = useState(64);

  const refresh = useCallback(async (manual = false) => {
    if (!navigator.onLine) { setStatus("offline"); setChecking(false); return; }
    if (manual) setChecking(true);
    const nextStatus = await getBackendStatus();
    setStatus(nextStatus === "online" ? "online" : "server-unavailable");
    setChecking(false);
  }, []);

  useEffect(() => {
    refresh();
    const onOnline = () => { setStatus("checking"); refresh(); };
    const onOffline = () => setStatus("offline");
    const onSocketStatus = (event) => {
      if (event.detail?.connected) setStatus("online");
      else if (navigator.onLine) { setStatus("checking"); refresh(); }
    };
    const onStaleData = (e) => {
      if (e.detail?.timestamp) {
        const d = new Date(e.detail.timestamp);
        setStaleInfo({
          time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          date: d.toLocaleDateString([], { month: "short", day: "numeric" }),
        });
      }
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("smart-safar:stale-data", onStaleData);
    window.addEventListener("smart-safar:socket-status", onSocketStatus);
    const header = document.querySelector(".public-header");
    const updateHeaderOffset = () => {
      const bottom = header?.getBoundingClientRect().bottom;
      if (bottom != null && bottom > 0) setHeaderOffset(Math.round(bottom));
    };
    updateHeaderOffset();
    window.addEventListener("resize", updateHeaderOffset);
    window.addEventListener("scroll", updateHeaderOffset, { passive: true });

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("smart-safar:stale-data", onStaleData);
      window.removeEventListener("smart-safar:socket-status", onSocketStatus);
      window.removeEventListener("resize", updateHeaderOffset);
      window.removeEventListener("scroll", updateHeaderOffset);
    };
  }, [refresh]);

  if (status === "checking" || status === "online") return null;
  const offline = status === "offline";
  return (
    <div role="status" style={{ top: headerOffset }} className="fixed inset-x-0 z-[1100] flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs leading-5 text-amber-900 shadow-md sm:px-8 lg:px-12">
      <span>
        {offline
          ? (staleInfo
              ? `You’re offline. Showing saved data from ${staleInfo.date} ${staleInfo.time}. Live buses, seat picking, and booking need an active connection.`
              : "You’re offline. Saved routes and stops remain available; live bus tracking, seat picking, and booking require an active connection.")
          : (staleInfo
              ? `Transit server unreachable. Showing saved data from ${staleInfo.date} ${staleInfo.time}; this is not live service information.`
              : "The transit service isn’t responding. Live route and bus information may be unavailable.")}
      </span>
      <button type="button" disabled={checking} onClick={() => refresh(true)} className="min-h-9 shrink-0 rounded-lg bg-white px-3 font-semibold text-amber-900 shadow-sm disabled:opacity-60">{checking ? "Checking…" : "Retry connection"}</button>
    </div>
  );
}

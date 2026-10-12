"use client";

import { useCallback, useEffect, useState } from "react";
import { getBackendStatus } from "@/lib/api";

export default function ConnectivityNotice() {
  const [status, setStatus] = useState("checking");
  const [retryKey, setRetryKey] = useState(0);
  const [checking, setChecking] = useState(false);
  const [staleInfo, setStaleInfo] = useState(null);

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
    const onStaleData = (e) => {
      if (e.detail?.timestamp) {
        const d = new Date(e.detail.timestamp);
        setStaleInfo({
          time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          date: d.toLocaleDateString([], { month: "short", day: "numeric" }),
        });
      }
    };

    let timer = null;
    const startTimer = () => {
      if (!timer) {
        timer = window.setInterval(() => {
          if (document.visibilityState === "visible") refresh();
        }, 60000);
      }
    };
    const stopTimer = () => {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refresh();
        startTimer();
      } else {
        stopTimer();
      }
    };

    startTimer();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("smart-safar:stale-data", onStaleData);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopTimer();
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("smart-safar:stale-data", onStaleData);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh, retryKey]);

  if (status === "checking" || status === "online") return null;
  const offline = status === "offline";
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs leading-5 text-amber-900 sm:px-8 lg:px-12">
      <span>
        {offline
          ? (staleInfo
              ? `You’re offline. Showing saved data from ${staleInfo.date} ${staleInfo.time}. Live buses, seat picking, and booking need an active connection.`
              : "You’re offline. Saved routes and stops remain available; live bus tracking, seat picking, and booking require an active connection.")
          : (staleInfo
              ? `Transit server unreachable. Showing saved data from ${staleInfo.date} ${staleInfo.time}.`
              : "The transit server isn’t responding. Displayed demo data is not live service information.")}
      </span>
      <button type="button" disabled={checking} onClick={() => { setChecking(true); setRetryKey((key) => key + 1); }} className="min-h-9 shrink-0 rounded-lg bg-white px-3 font-semibold text-amber-900 shadow-sm disabled:opacity-60">{checking ? "Checking…" : "Retry connection"}</button>
    </div>
  );
}

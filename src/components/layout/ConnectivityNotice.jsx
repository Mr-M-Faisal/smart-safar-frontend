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
    <div role="status" className="flex items-center justify-between gap-2 border-b border-amber-300/40 bg-amber-500/10 px-3.5 py-1.5 text-[11px] font-medium leading-tight text-amber-200 backdrop-blur-md">
      <span className="truncate">
        {offline
          ? (staleInfo
              ? `Offline · Saved data (${staleInfo.time})`
              : "Offline · Showing saved transit data")
          : (staleInfo
              ? `Server unreachable · Saved data (${staleInfo.time})`
              : "Server unreachable · Offline mode")}
      </span>
      <button type="button" disabled={checking} onClick={() => { setChecking(true); setRetryKey((key) => key + 1); }} className="shrink-0 rounded-md bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-200 active:bg-amber-400/30 disabled:opacity-60">{checking ? "..." : "Retry"}</button>
    </div>
  );
}


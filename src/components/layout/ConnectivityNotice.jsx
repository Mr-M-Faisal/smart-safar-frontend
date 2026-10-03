"use client";

import { useCallback, useEffect, useState } from "react";
import { getBackendStatus } from "@/lib/api";

export default function ConnectivityNotice() {
  const [status, setStatus] = useState("checking");
  const [retryKey, setRetryKey] = useState(0);
  const [checking, setChecking] = useState(false);

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
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    const timer = window.setInterval(() => refresh(), 20000);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh, retryKey]);

  if (status === "checking" || status === "online") return null;
  const offline = status === "offline";
  return <div role="status" className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs leading-5 text-amber-900 sm:px-8 lg:px-12">
    <span>{offline ? "You’re offline. Live transit updates and reservations may be unavailable." : "The transit server isn’t responding. Displayed demo data is not live service information."}</span>
    <button type="button" disabled={checking} onClick={() => { setChecking(true); setRetryKey((key) => key + 1); }} className="min-h-9 shrink-0 rounded-lg bg-white px-3 font-semibold text-amber-900 shadow-sm disabled:opacity-60">{checking ? "Checking…" : "Retry connection"}</button>
  </div>;
}

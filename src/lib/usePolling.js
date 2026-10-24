"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import settingsStore from "@/lib/settings.js";

export default function usePolling(fn, intervalMs, { pauseWhenHidden = true, backoffOnError = true, enabled = true, essential = false } = {}) {
  const fnRef = useRef(fn);
  const [dataSaver, setDataSaver] = useState(false);
  fnRef.current = fn;
  const refresh = useCallback(() => fnRef.current(), []);

  useEffect(() => {
    const update = () => setDataSaver(Boolean(settingsStore.readSettings().dataSaver));
    update();
    window.addEventListener("smart-safar:settings-changed", update);
    window.addEventListener("storage", update);
    return () => { window.removeEventListener("smart-safar:settings-changed", update); window.removeEventListener("storage", update); };
  }, []);
  const effectiveInterval = dataSaver && !essential ? intervalMs * 3 : intervalMs;

  useEffect(() => {
    if (!enabled || effectiveInterval <= 0) return undefined;
    let timer;
    let failures = 0;
    let stopped = false;
    const isPaused = () => pauseWhenHidden && document.visibilityState === "hidden";
    const schedule = (delay) => {
      window.clearTimeout(timer);
      if (!stopped && !isPaused()) timer = window.setTimeout(run, delay);
    };
    const run = async () => {
      if (stopped || isPaused()) return;
      try { await fnRef.current(); failures = 0; }
      catch { failures += 1; }
      schedule(backoffOnError ? Math.min(effectiveInterval * (2 ** Math.min(failures, 4)), effectiveInterval * 16) : effectiveInterval);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") schedule(0);
      else window.clearTimeout(timer);
    };
    schedule(effectiveInterval);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { stopped = true; window.clearTimeout(timer); document.removeEventListener("visibilitychange", onVisibility); };
  }, [effectiveInterval, pauseWhenHidden, backoffOnError, enabled]);

  return refresh;
}

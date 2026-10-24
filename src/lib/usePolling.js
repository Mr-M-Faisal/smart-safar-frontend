"use client";

import { useCallback, useEffect, useRef } from "react";

export default function usePolling(fn, intervalMs, { pauseWhenHidden = true, backoffOnError = true, enabled = true } = {}) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const refresh = useCallback(() => fnRef.current(), []);

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return undefined;
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
      schedule(backoffOnError ? Math.min(intervalMs * (2 ** Math.min(failures, 4)), intervalMs * 16) : intervalMs);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") schedule(0);
      else window.clearTimeout(timer);
    };
    schedule(intervalMs);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { stopped = true; window.clearTimeout(timer); document.removeEventListener("visibilitychange", onVisibility); };
  }, [intervalMs, pauseWhenHidden, backoffOnError, enabled]);

  return refresh;
}

"use client";

import { useEffect, useState } from "react";

export function getLocationFreshness(timestamp, now = Date.now()) {
  const parsed = timestamp ? new Date(timestamp).getTime() : Number.NaN;
  if (!Number.isFinite(parsed)) return { available: false, ageSeconds: null, label: "Location unavailable" };
  const ageSeconds = Math.max(0, Math.floor((now - parsed) / 1000));
  if (ageSeconds > 60) return { available: false, ageSeconds, label: "Location unavailable" };
  return { available: true, ageSeconds, label: `Updated ${ageSeconds} s ago` };
}

export function useLocationClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

"use client";

import { useEffect, useState } from "react";

const INITIAL = { status: "checking", version: process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0", buildId: process.env.NEXT_PUBLIC_BUILD_ID || "development", builtAt: process.env.NEXT_PUBLIC_BUILT_AT || "development", checkedAt: null };
export default function useReleaseStatus() {
  const [release, setRelease] = useState(() => typeof window === "undefined" ? INITIAL : window.__ssReleaseStatus || INITIAL);
  useEffect(() => {
    const sync = (event) => setRelease(event?.detail || window.__ssReleaseStatus || INITIAL);
    sync();
    window.addEventListener("smart-safar:release-status", sync);
    return () => window.removeEventListener("smart-safar:release-status", sync);
  }, []);
  return release;
}

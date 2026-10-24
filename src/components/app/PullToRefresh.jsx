"use client";
import usePullToRefresh from "./usePullToRefresh";
export default function PullToRefresh({ scrollRef, pathname }) {
  const { distance, refreshing } = usePullToRefresh(scrollRef, pathname);
  if (!distance && !refreshing) return null;
  return <div role="status" aria-live="polite" aria-label={refreshing ? "Refreshing" : "Pull to refresh"} className="ss-pull-indicator" style={{ transform: "translate(-50%, " + Math.max(8, distance) + "px)" }}>
    <span className={refreshing ? "ss-pull-spinner is-spinning" : "ss-pull-spinner"} aria-hidden="true">↻</span><span>{refreshing ? "Refreshing…" : distance >= 70 ? "Release to refresh" : "Pull to refresh"}</span>
  </div>;
}

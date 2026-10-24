"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import pullLogic from "@/lib/pullRefreshLogic.cjs";
import { useAppRefreshHandler } from "./AppRefreshContext";
export default function usePullToRefresh(scrollRef, pathname) {
  const refresh = useAppRefreshHandler();
  const start = useRef(null);
  const distanceRef = useRef(0);
  const refreshingRef = useRef(false);
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const ignore = useCallback((target) => {
    if (pathname === "/m/map" || target?.closest?.("[role='dialog'],[data-ptr-ignore],.leaflet-container")) return true;
    const horizontal = target?.closest?.("[data-horizontal-scroll]");
    return Boolean(horizontal);
  }, [pathname]);
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return undefined;
    const onStart = (event) => {
      if (event.touches.length !== 1 || element.scrollTop !== 0 || ignore(event.target)) { start.current = null; return; }
      for (let node = event.target; node && node !== element.parentElement; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.overflowX === "auto" || style.overflowX === "scroll") { start.current = null; return; }
        if (node === element) break;
      }
      start.current = { y: event.touches[0].clientY, x: event.touches[0].clientX };
    };
    const onMove = (event) => {
      if (!start.current || event.touches.length !== 1 || refreshingRef.current) return;
      const dy = event.touches[0].clientY - start.current.y;
      const dx = Math.abs(event.touches[0].clientX - start.current.x);
      if (dy <= 0 || dx > dy) { distanceRef.current = 0; setDistance(0); return; }
      if (element.scrollTop === 0) { event.preventDefault(); distanceRef.current = pullLogic.resistedDistance(dy); setDistance(distanceRef.current); }
    };
    const onEnd = async () => {
      const pulledDistance = distanceRef.current;
      start.current = null;
      distanceRef.current = 0;
      if (pullLogic.shouldRefresh(pulledDistance) && refresh && !refreshingRef.current) {
        refreshingRef.current = true;
        setRefreshing(true);
        try { await refresh(); } finally { refreshingRef.current = false; setRefreshing(false); }
      }
      setDistance(0);
    };
    const onCancel = () => { start.current = null; distanceRef.current = 0; setDistance(0); };
    element.addEventListener("touchstart", onStart, { passive: true });
    element.addEventListener("touchmove", onMove, { passive: false });
    element.addEventListener("touchend", onEnd, { passive: true });
    element.addEventListener("touchcancel", onCancel, { passive: true });
    return () => { element.removeEventListener("touchstart", onStart); element.removeEventListener("touchmove", onMove); element.removeEventListener("touchend", onEnd); element.removeEventListener("touchcancel", onCancel); };
  }, [ignore, pathname, refresh, scrollRef]);
  return { distance, refreshing };
}

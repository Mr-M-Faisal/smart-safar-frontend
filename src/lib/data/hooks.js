"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest, readSavedCache } from "@/lib/api";

function useResource(path, { token, enabled = true, fallbackData } = {}) {
  const [state, setState] = useState(() => {
    const saved = path && !token ? readSavedCache(path) : null;
    return { path, data: saved?.data ?? fallbackData ?? null, cachedAt: saved?.timestamp ?? null, hasCache: Boolean(saved), isLoading: Boolean(enabled && path), error: null };
  });
  const lastRefreshAt = useRef(0);

  const refresh = useCallback(async () => {
    if (!path || !enabled) return null;
    setState((current) => {
      const saved = path && !token ? readSavedCache(path) : null;
      const samePath = current.path === path;
      return { path, data: samePath ? current.data : (saved?.data ?? fallbackData ?? null), cachedAt: samePath ? current.cachedAt : (saved?.timestamp ?? null), hasCache: samePath ? current.hasCache : Boolean(saved), isLoading: !samePath || current.data == null, error: null };
    });
    let lastError;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const data = await apiRequest(path, token ? { token } : {});
        setState({ path, data, cachedAt: token ? null : readSavedCache(path)?.timestamp ?? null, hasCache: false, isLoading: false, error: null });
        return data;
      } catch (error) {
        lastError = error;
        if (error.status >= 400 && error.status < 500) break;
        if (attempt < 2) await new Promise((resolve) => window.setTimeout(resolve, 500 * (2 ** attempt)));
      }
    }
    setState((current) => ({ path, data: current.path === path ? current.data : null, cachedAt: current.path === path ? current.cachedAt : null, hasCache: current.path === path ? current.hasCache : false, isLoading: false, error: lastError }));
    return null;
  }, [path, token, enabled, fallbackData]);

  useEffect(() => {
    if (!enabled || !path) return undefined;
    let current = true;
    const onCacheUpdate = (event) => {
      if (event.detail?.path === path && current) setState({ path, data: event.detail.data, cachedAt: event.detail.timestamp, hasCache: false, isLoading: false, error: null });
    };
    const onStaleData = (event) => {
      if (event.detail?.path === path && current) setState((previous) => ({ ...previous, path, hasCache: true, cachedAt: event.detail.timestamp }));
    };
    window.addEventListener("smart-safar:cache-updated", onCacheUpdate);
    window.addEventListener("smart-safar:stale-data", onStaleData);
    void refresh();
    const revalidate = () => {
      if (Date.now() - lastRefreshAt.current < 5000) return;
      lastRefreshAt.current = Date.now();
      void refresh();
    };
    window.addEventListener("focus", revalidate);
    window.addEventListener("online", revalidate);
    window.addEventListener("smart-safar:soft-refresh", revalidate);
    return () => {
      current = false;
      window.removeEventListener("smart-safar:cache-updated", onCacheUpdate);
      window.removeEventListener("smart-safar:stale-data", onStaleData);
      window.removeEventListener("focus", revalidate);
      window.removeEventListener("online", revalidate);
      window.removeEventListener("smart-safar:soft-refresh", revalidate);
    };
  }, [enabled, path, refresh]);

  const saved = path && !token ? readSavedCache(path) : null;
  const visibleState = state.path === path ? state : { path, data: saved?.data ?? fallbackData ?? null, cachedAt: saved?.timestamp ?? null, hasCache: Boolean(saved), isLoading: Boolean(enabled && path), error: null };
  return { ...visibleState, refresh };
}

export const useRoutes = (options) => useResource("/routes/overview", options);
export const useRouteStops = (routeId, options) => useResource(routeId ? `/stops/route/${encodeURIComponent(routeId)}` : null, options);
export const useBuses = (routeId, options) => useResource(routeId ? `/buses?route=${encodeURIComponent(routeId)}` : "/buses", options);
export const useRouteAlerts = (routeId, options) => useResource(routeId ? `/route-alerts/route/${encodeURIComponent(routeId)}` : null, options);
export const useMyBookings = (token, options = {}) => useResource("/bookings/me", { ...options, token });
export const useMySafetySessions = (token, options = {}) => useResource("/safety/sessions/me", { ...options, token });

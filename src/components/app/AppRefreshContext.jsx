"use client";
import { createContext, useCallback, useContext, useEffect, useRef } from "react";
const AppRefreshContext = createContext(null);
export function AppRefreshProvider({ children }) {
  const handler = useRef(null);
  const register = useCallback((next) => { handler.current = next; return () => { if (handler.current === next) handler.current = null; }; }, []);
  const refresh = useCallback(() => handler.current?.(), []);
  return <AppRefreshContext.Provider value={{ register, refresh }}>{children}</AppRefreshContext.Provider>;
}
export function useAppRefresh(callback) {
  const context = useContext(AppRefreshContext);
  useEffect(() => {
    const unregister = context?.register(callback);
    const handleSoftRefresh = () => { Promise.resolve(callback()).catch((error) => console.warn("Smart Safar background refresh failed:", error)); };
    window.addEventListener("smart-safar:soft-refresh", handleSoftRefresh);
    return () => { unregister?.(); window.removeEventListener("smart-safar:soft-refresh", handleSoftRefresh); };
  }, [callback, context]);
}
export function useAppRefreshHandler() { return useContext(AppRefreshContext)?.refresh; }

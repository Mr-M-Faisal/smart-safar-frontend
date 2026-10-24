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
  useEffect(() => context?.register(callback), [callback, context]);
}
export function useAppRefreshHandler() { return useContext(AppRefreshContext)?.refresh; }

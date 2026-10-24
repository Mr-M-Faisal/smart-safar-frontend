"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { isInstalledApp } from "@/lib/appMode";

const AppModeContext = createContext("web");

export function AppModeProvider({ children }) {
  const [mode, setMode] = useState("web");
  useEffect(() => {
    const nextMode = isInstalledApp() ? "app" : "web";
    document.documentElement.dataset.appMode = nextMode;
    setMode(nextMode);
  }, []);
  return <AppModeContext.Provider value={mode}>{children}</AppModeContext.Provider>;
}

export function useAppMode() {
  return useContext(AppModeContext);
}

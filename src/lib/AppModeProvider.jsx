"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getPreferredView } from "@/lib/viewMode";

const AppModeContext = createContext("web");

export function AppModeProvider({ children }) {
  const [mode, setMode] = useState("web");
  useEffect(() => {
    const preference = document.cookie.split(";").map((value) => value.trim()).find((value) => value.startsWith("ss-view="))?.slice("ss-view=".length);
    const nextMode = getPreferredView(preference, { window, screen });
    document.documentElement.dataset.appMode = nextMode;
    document.documentElement.dataset.view = nextMode;
    setMode(nextMode);
  }, []);
  return <AppModeContext.Provider value={mode}>{children}</AppModeContext.Provider>;
}

export function useAppMode() {
  return useContext(AppModeContext);
}

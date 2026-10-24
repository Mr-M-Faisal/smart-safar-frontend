"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { installInstructions, resolveInstallMode } from "./installMode.cjs";

export const InstallPromptContext = createContext(null);

export default function InstallPromptProvider({ children }) {
  const [promptEvent, setPromptEvent] = useState(null);
  const [isInstalled, setInstalled] = useState(false);
  const [mode, setMode] = useState("desktop-manual");
  const [attentionPulse, setAttentionPulse] = useState(false);

  const syncMode = useCallback((eventAvailable = Boolean(window.__smartSafarInstallPrompt), relatedInstalled = false) => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || Boolean(navigator.standalone);
    const nextMode = resolveInstallMode({ userAgent: navigator.userAgent, platform: navigator.platform, maxTouchPoints: navigator.maxTouchPoints, standalone, hasPromptEvent: eventAvailable, relatedAppInstalled: relatedInstalled });
    setInstalled(nextMode === "installed");
    setMode(nextMode);
  }, []);

  useEffect(() => {
    let active = true;
    syncMode();
    const updateRelatedApps = async () => {
      try {
        const apps = await navigator.getInstalledRelatedApps?.();
        if (active) syncMode(Boolean(window.__smartSafarInstallPrompt), Boolean(apps?.length));
      } catch {}
    };
    void updateRelatedApps();
    try {
      if (!sessionStorage.getItem("ss-install-pulse-shown")) {
        sessionStorage.setItem("ss-install-pulse-shown", "1");
        setAttentionPulse(true);
        window.setTimeout(() => setAttentionPulse(false), 3000);
      }
    } catch {}
    const beforeInstall = (event) => { event.preventDefault(); window.__smartSafarInstallPrompt = event; setPromptEvent(event); syncMode(true); };
    const syncEarlyPrompt = () => { const event = window.__smartSafarInstallPrompt; setPromptEvent(event || null); syncMode(Boolean(event)); };
    const installed = () => { window.__smartSafarInstallPrompt = null; setPromptEvent(null); setInstalled(true); setMode("installed"); };
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const onDisplayMode = () => syncMode();
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("smart-safar:install-prompt-ready", syncEarlyPrompt);
    window.addEventListener("appinstalled", installed);
    displayMode.addEventListener?.("change", onDisplayMode);
    return () => {
      active = false;
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("smart-safar:install-prompt-ready", syncEarlyPrompt);
      window.removeEventListener("appinstalled", installed);
      displayMode.removeEventListener?.("change", onDisplayMode);
    };
  }, [syncMode]);

  const install = useCallback(async () => {
    const event = promptEvent || window.__smartSafarInstallPrompt;
    if (!event) return false;
    await event.prompt();
    const choice = await event.userChoice;
    setPromptEvent(null);
    window.__smartSafarInstallPrompt = null;
    if (choice?.outcome === "accepted") { setInstalled(true); setMode("installed"); }
    else syncMode(false);
    return choice?.outcome === "accepted";
  }, [promptEvent, syncMode]);

  const value = useMemo(() => ({
    mode, isInstalled, canInstall: mode === "prompt", attentionPulse, install,
    instructions: installInstructions({ mode, userAgent: typeof navigator === "undefined" ? "" : navigator.userAgent }),
  }), [mode, isInstalled, attentionPulse, install]);
  return <InstallPromptContext.Provider value={value}>{children}</InstallPromptContext.Provider>;
}

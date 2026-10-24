"use client";

import { createContext, useEffect, useMemo, useState } from "react";

export const InstallPromptContext = createContext(null);

export default function InstallPromptProvider({ children }) {
  const [promptEvent, setPromptEvent] = useState(null);
  const [isInstalled, setInstalled] = useState(false);
  const [isIOS, setIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [attentionPulse, setAttentionPulse] = useState(false);

  useEffect(() => {
    const standalone = () => window.matchMedia("(display-mode: standalone)").matches || Boolean(navigator.standalone);
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) && /Safari/i.test(navigator.userAgent) && !/(CriOS|FxiOS|EdgiOS|OPiOS)/i.test(navigator.userAgent);
    setInstalled(standalone());
    setIOS(ios);
    try { setDismissed(sessionStorage.getItem("ss-install-dismissed") === "1"); } catch (_error) {}
    try {
      if (!sessionStorage.getItem("ss-install-pulse-shown")) {
        sessionStorage.setItem("ss-install-pulse-shown", "1");
        setAttentionPulse(true);
        window.setTimeout(() => setAttentionPulse(false), 3000);
      }
    } catch (_error) { setAttentionPulse(true); window.setTimeout(() => setAttentionPulse(false), 3000); }
    const beforeInstall = (event) => { event.preventDefault(); setPromptEvent(event); };
    const installed = () => { setInstalled(true); setPromptEvent(null); };
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const onDisplayMode = () => setInstalled(standalone());
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", installed);
    displayMode.addEventListener?.("change", onDisplayMode);
    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", installed);
      displayMode.removeEventListener?.("change", onDisplayMode);
    };
  }, []);

  async function install() {
    if (!promptEvent) return false;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setPromptEvent(null);
    if (choice?.outcome === "accepted") setInstalled(true);
    return choice?.outcome === "accepted";
  }
  const value = useMemo(() => ({ canInstall: Boolean(promptEvent), isInstalled, isIOS, install, dismissed, attentionPulse, dismiss: () => { setDismissed(true); try { sessionStorage.setItem("ss-install-dismissed", "1"); } catch (_error) {} } }), [promptEvent, isInstalled, isIOS, dismissed, attentionPulse]);
  return <InstallPromptContext.Provider value={value}>{children}</InstallPromptContext.Provider>;
}

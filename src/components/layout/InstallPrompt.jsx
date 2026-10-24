"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isInstalledApp } from "@/lib/appMode";

const DISMISS_KEY = "smart-safar-install-dismissed-until";
const DISMISS_DAYS = 14;

function isIosSafari() {
  const agent = navigator.userAgent || "";
  return /iPhone|iPad|iPod/.test(agent) && /Safari/i.test(agent) && !/(CriOS|FxiOS|EdgiOS|OPiOS)/i.test(agent);
}

function isSmallScreen() {
  return window.matchMedia("(max-width: 1023px)").matches;
}

export default function InstallPrompt({ placement = "website" }) {
  const pathname = usePathname();
  const [installEvent, setInstallEvent] = useState(null);
  const [promptMode, setPromptMode] = useState("");
  const [dismissed, setDismissed] = useState(true);
  const [showIosSteps, setShowIosSteps] = useState(false);

  useEffect(() => {
    let dismissedUntil = 0;
    try { dismissedUntil = Number(window.localStorage.getItem(DISMISS_KEY) || 0); }
    catch (_error) {}
    setDismissed(dismissedUntil > Date.now());
    if (!isSmallScreen() || isInstalledApp()) return undefined;

    if (isIosSafari()) setPromptMode("ios");
    else if (placement === "app") setPromptMode("manual");

    const onBeforeInstall = (event) => {
      event.preventDefault();
      setInstallEvent(event);
      setPromptMode("install");
    };
    const onInstalled = () => {
      setInstallEvent(null);
      setPromptMode("");
      setDismissed(true);
      window.localStorage.removeItem(DISMISS_KEY);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [pathname, placement]);

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice?.outcome === "accepted") {
      setInstallEvent(null);
      setPromptMode("");
      setDismissed(true);
    }
  }

  function dismiss() {
    try { window.localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000)); }
    catch (_error) {}
    setDismissed(true);
  }

  if (typeof window === "undefined") return null;
  if (placement === "app" && pathname !== "/m") return null;
  if (placement === "website" && pathname?.startsWith("/m")) return null;
  if (dismissed || !promptMode || !isSmallScreen()) return null;

  const bottomPosition = placement === "app" ? "bottom-[calc(env(safe-area-inset-bottom)+5rem)]" : "bottom-[max(1rem,env(safe-area-inset-bottom))]";
  return <aside aria-label="Install Smart Safar" className={`fixed inset-x-3 ${bottomPosition} z-[1300] mx-auto max-w-md rounded-2xl border border-[#dce2f1] bg-white p-4 text-[#293553] shadow-[0_16px_42px_rgba(35,49,87,.2)] sm:inset-x-5`}>
    <div className="flex items-start gap-3">
      <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e9edff] text-lg text-[#536bb7]">↗</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3"><h2 className="text-sm font-semibold">{placement === "app" ? "Install the app" : "Get the Smart Safar app"}</h2><button type="button" aria-label="Dismiss install prompt" onClick={dismiss} className="-mr-2 -mt-2 grid h-11 w-11 shrink-0 place-items-center rounded-lg text-lg text-[#74809a] hover:bg-[#f4f5fb]">×</button></div>
        {promptMode === "ios" ? <><p className="mt-1 text-xs leading-5 text-[#68738e]">Add Smart Safar to your Home Screen for a more app-like experience.</p><button type="button" onClick={() => setShowIosSteps((value) => !value)} className="mt-2 min-h-11 rounded-lg bg-[#536bb7] px-3 text-xs font-semibold text-white">{showIosSteps ? "Hide steps" : "How to install"}</button>{showIosSteps && <p className="mt-2 rounded-xl bg-[#f4f5fb] p-3 text-xs leading-5 text-[#596681]">Tap Share <span aria-hidden="true">□↑</span>, then choose <strong>Add to Home Screen</strong>.</p>}</> : promptMode === "install" ? <><p className="mt-1 text-xs leading-5 text-[#68738e]">Open Smart Safar from your Home Screen.</p><button type="button" onClick={install} className="mt-2 min-h-11 rounded-lg bg-[#536bb7] px-3 text-xs font-semibold text-white">Get the app</button></> : <><p className="mt-1 text-xs leading-5 text-[#68738e]">Use your browser menu and choose “Add to Home Screen” to install Smart Safar.</p>{placement === "website" && <a href="/m" className="mt-2 inline-flex min-h-11 items-center rounded-lg bg-[#536bb7] px-3 text-xs font-semibold text-white">Open the app preview</a>}</>}
      </div>
    </div>
  </aside>;
}

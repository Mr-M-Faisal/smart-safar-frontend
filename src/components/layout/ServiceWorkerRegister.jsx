"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function ServiceWorkerRegister() {
  const pathname = usePathname();
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const reloadAfterUpdate = useRef(false);
  const isAppRoute = pathname === "/m" || pathname?.startsWith("/m/");

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return undefined;

    let registration;
    let updateTimer;
    let disposed = false;
    let registrationStarted = false;
    const announce = (status, detail = {}) => window.dispatchEvent(new CustomEvent("smart-safar:update-status", { detail: { status, ...detail } }));
    const applyWorker = (worker, force = false) => {
      if (!worker || reloadAfterUpdate.current) return;
      if (!force && Number(window.__ssDirtyForms || 0) > 0) { setWaitingWorker(worker); announce("waiting"); return; }
      setWaitingWorker(null);
      setIsUpdating(true);
      reloadAfterUpdate.current = true;
      worker.postMessage({ type: "SKIP_WAITING" });
      announce("applying");
    };
    const syncWaitingWorker = () => {
      if (disposed) return;
      if (registration?.waiting && navigator.serviceWorker.controller) {
        setWaitingWorker(registration.waiting);
        applyWorker(registration.waiting);
      } else {
        setWaitingWorker(null);
      }
    };
    const checkForUpdate = async () => {
      if (disposed || document.visibilityState !== "visible") return;
      if (!registration) { announce("error"); return; }
      try {
        announce("checking");
        await registration.update();
        if (registration.waiting) { setWaitingWorker(registration.waiting); if (Number(window.__ssDirtyForms || 0) > 0) announce("waiting"); else applyWorker(registration.waiting); }
        else announce("current");
      } catch (error) { announce("error"); console.warn("Service worker update check failed:", error); }
    };
    const onControllerChange = () => {
      syncWaitingWorker();
      if (!reloadAfterUpdate.current) return;
      reloadAfterUpdate.current = false;
      try { if (sessionStorage.getItem("ss-sw-reloaded") === "1") return; sessionStorage.setItem("ss-sw-reloaded", "1"); } catch {}
      window.location.reload();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (registration?.waiting && Number(window.__ssDirtyForms || 0) === 0) applyWorker(registration.waiting);
        void checkForUpdate();
      }
    };
    const onDirtyFormsChanged = (event) => { if ((event.detail?.count ?? window.__ssDirtyForms ?? 0) === 0 && registration?.waiting) applyWorker(registration.waiting); };
    const onLoad = () => {
      if (registrationStarted) return;
      registrationStarted = true;
      try { sessionStorage.removeItem("ss-sw-reloaded"); } catch {}
      navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" })
        .then((value) => {
          registration = value;
          if (disposed) return;
          syncWaitingWorker();
          registration.addEventListener("updatefound", () => {
            const installingWorker = registration.installing;
            installingWorker?.addEventListener("statechange", syncWaitingWorker);
          });
          void checkForUpdate();
          updateTimer = window.setInterval(checkForUpdate, 60 * 60 * 1000);
        })
        .catch((error) => console.warn("Service worker registration failed:", error));
    };

    window.addEventListener("load", onLoad, { once: true });
    window.__smartSafarCheckForUpdates = checkForUpdate;
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("smart-safar:dirty-forms-changed", onDirtyFormsChanged);
    if (document.readyState === "complete") onLoad();
    return () => {
      window.removeEventListener("load", onLoad);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("smart-safar:dirty-forms-changed", onDirtyFormsChanged);
      if (window.__smartSafarCheckForUpdates === checkForUpdate) delete window.__smartSafarCheckForUpdates;
      disposed = true;
      if (updateTimer) window.clearInterval(updateTimer);
    };
  }, []);

  function applyUpdate() { if (!waitingWorker) return; setIsUpdating(true); reloadAfterUpdate.current = true; waitingWorker.postMessage({ type: "SKIP_WAITING" }); }

  const bottomPosition = isAppRoute
    ? "bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] sm:bottom-[calc(env(safe-area-inset-bottom)+5.25rem)]"
    : "bottom-[calc(env(safe-area-inset-bottom)+1rem)] sm:bottom-5";

  return waitingWorker && <aside role="status" aria-live="polite" aria-busy={isUpdating} className={`fixed inset-x-3 ${bottomPosition} z-[1400] mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-[#dce2f1] border-l-4 border-l-[#536bb7] bg-white/95 p-3 text-[#293553] shadow-[0_16px_42px_rgba(35,49,87,.2)] backdrop-blur sm:inset-x-5 sm:gap-4 sm:p-4`}>
    <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef1fc] text-lg font-semibold text-[#536bb7]">↻</span>
    <div className="min-w-0 flex-1"><p className="text-sm font-semibold">Smart Safar update available</p><p className="mt-1 text-xs leading-5 text-[#68738e]">{Number(typeof window !== "undefined" && window.__ssDirtyForms || 0) > 0 ? "Your changes are protected. Update now when you are ready." : "A new version is ready to use."}</p></div>
    <button type="button" onClick={applyUpdate} disabled={isUpdating} className="min-h-11 shrink-0 rounded-xl bg-[#536bb7] px-3 text-xs font-semibold text-white transition hover:bg-[#43599f] disabled:cursor-wait disabled:opacity-70 sm:px-4">{isUpdating ? "Updating…" : "Update app"}</button>
  </aside>;
}

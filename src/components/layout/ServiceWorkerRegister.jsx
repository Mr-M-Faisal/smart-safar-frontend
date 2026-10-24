"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const CURRENT_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0";
const CURRENT_BUILD = process.env.NEXT_PUBLIC_BUILD_ID || "development";

export default function ServiceWorkerRegister() {
  const pathname = usePathname();
  const isInstalledPwa = typeof document !== "undefined" && document.documentElement.dataset.installed === "true";
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const reloadAfterUpdate = useRef(false);
  const isAppRoute = isInstalledPwa || pathname === "/m" || pathname?.startsWith("/m/");
  const isWorkspaceRoute = isInstalledPwa || isAppRoute || pathname === "/admin" || pathname?.startsWith("/admin") || pathname === "/driver" || pathname?.startsWith("/driver");

  useEffect(() => {
    let registration;
    let updateTimer;
    let disposed = false;
    let registrationStarted = false;
    let newest = null;
    let currentWaitingWorker = null;
    const publish = (status, detail = {}) => {
      const snapshot = { status, version: CURRENT_VERSION, buildId: CURRENT_BUILD, builtAt: process.env.NEXT_PUBLIC_BUILT_AT || "development", checkedAt: Date.now(), latest: newest, ...detail };
      window.__ssReleaseStatus = snapshot;
      window.dispatchEvent(new CustomEvent("smart-safar:release-status", { detail: snapshot }));
    };
    const rememberUpdate = (version) => { try { localStorage.setItem("ss-update-target-version", version || CURRENT_VERSION); } catch {} };
    const applyWorker = (worker, force = false) => {
      if (!worker || reloadAfterUpdate.current) return;
      currentWaitingWorker = worker;
      if (!force && Number(window.__ssDirtyForms || 0) > 0) { setWaitingWorker(worker); publish("update-available", { dirtyForms: true }); return; }
      setWaitingWorker(null);
      setIsUpdating(true);
      rememberUpdate(newest?.version || CURRENT_VERSION);
      reloadAfterUpdate.current = true;
      worker.postMessage({ type: "SKIP_WAITING" });
      publish("updating", { latest: newest });
    };
    const checkForUpdate = async () => {
      if (disposed || document.visibilityState !== "visible") return;
      publish("checking");
      try {
        const response = await fetch("/version.json", { cache: "no-store", headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error(`Version check returned ${response.status}`);
        const remote = await response.json();
        if (disposed) return;
        if (!remote?.version || !remote?.buildId) throw new Error("Version metadata is incomplete.");
        newest = remote;
        setLatestVersion(remote);
        const differs = remote.version !== CURRENT_VERSION || remote.buildId !== CURRENT_BUILD;
        if (differs) {
          setUpdateAvailable(true);
          try { localStorage.setItem("ss-release-status", JSON.stringify(remote)); } catch {}
          publish("update-available", { latest: remote });
          if (registration) {
            try { await registration.update(); } catch (error) { console.warn("Service worker update check failed:", error); }
            if (registration.waiting) { currentWaitingWorker = registration.waiting; setUpdateAvailable(true); setWaitingWorker(registration.waiting); applyWorker(registration.waiting); }
          }
          return;
        }
        setUpdateAvailable(false);
        setLatestVersion(remote);
        let target = null;
        try { target = localStorage.getItem("ss-update-target-version"); } catch {}
        if (target && target === CURRENT_VERSION) publish("just-updated", { latest: remote });
        else publish("current", { latest: remote });
        if (registration?.waiting && navigator.serviceWorker?.controller) { currentWaitingWorker = registration.waiting; setUpdateAvailable(true); setWaitingWorker(registration.waiting); applyWorker(registration.waiting); }
      } catch (error) {
        publish("error", { message: error.message, offline: !navigator.onLine });
      }
    };
    const syncWaitingWorker = () => {
      if (disposed || !registration?.waiting || !navigator.serviceWorker?.controller) return;
      currentWaitingWorker = registration.waiting;
      setUpdateAvailable(true);
      setWaitingWorker(registration.waiting);
      if (Number(window.__ssDirtyForms || 0) > 0) publish("update-available", { dirtyForms: true });
      else applyWorker(registration.waiting);
    };
    const onControllerChange = () => {
      if (!reloadAfterUpdate.current) return;
      reloadAfterUpdate.current = false;
      try { if (sessionStorage.getItem("ss-sw-reloaded") === "1") return; sessionStorage.setItem("ss-sw-reloaded", "1"); } catch {}
      window.location.reload();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") { if (registration?.waiting && Number(window.__ssDirtyForms || 0) === 0) applyWorker(registration.waiting); void checkForUpdate(); }
    };
    const onDirtyFormsChanged = (event) => { if ((event.detail?.count ?? window.__ssDirtyForms ?? 0) === 0 && registration?.waiting) applyWorker(registration.waiting); };
    const onLoad = () => {
      if (registrationStarted) return;
      registrationStarted = true;
      try { sessionStorage.removeItem("ss-sw-reloaded"); } catch {}
      void checkForUpdate();
      if (process.env.NODE_ENV === "production") updateTimer = window.setInterval(checkForUpdate, 30 * 60 * 1000);
      if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
      navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then((value) => {
        registration = value;
        if (disposed) return;
        syncWaitingWorker();
        registration.addEventListener("updatefound", () => registration.installing?.addEventListener("statechange", syncWaitingWorker));
        void checkForUpdate();
      }).catch((error) => console.warn("Service worker registration failed:", error));
    };
    window.addEventListener("load", onLoad, { once: true });
    window.__smartSafarCheckForUpdates = checkForUpdate;
    window.__smartSafarApplyUpdate = () => {
      if (currentWaitingWorker) applyWorker(currentWaitingWorker, true);
      else { rememberUpdate(newest?.version || CURRENT_VERSION); publish("updating", { latest: newest }); window.location.reload(); }
    };
    if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", checkForUpdate);
    window.addEventListener("smart-safar:dirty-forms-changed", onDirtyFormsChanged);
    if (document.readyState === "complete") onLoad();
    return () => {
      disposed = true;
      window.removeEventListener("load", onLoad);
      if ("serviceWorker" in navigator) navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", checkForUpdate);
      window.removeEventListener("smart-safar:dirty-forms-changed", onDirtyFormsChanged);
      if (window.__smartSafarCheckForUpdates === checkForUpdate) delete window.__smartSafarCheckForUpdates;
      delete window.__smartSafarApplyUpdate;
      if (updateTimer) window.clearInterval(updateTimer);
    };
  }, []);

  function applyUpdate() {
    if (waitingWorker) { setIsUpdating(true); window.__smartSafarApplyUpdate?.(); }
    else window.__smartSafarApplyUpdate?.();
  }

  return isWorkspaceRoute && updateAvailable && <aside role="status" aria-live="polite" aria-busy={isUpdating} className={`ss-release-banner ${isAppRoute ? "is-app" : ""}`}>
    <span className="h-2 w-2 shrink-0 rounded-full bg-[#20bba5]" aria-hidden="true" />
    <p className="min-w-0 flex-1 text-xs font-semibold">A new version{latestVersion?.version ? ` (${latestVersion.version})` : ""} is available</p>
    <button type="button" onClick={applyUpdate} disabled={isUpdating} className="min-h-10 shrink-0 rounded-lg bg-[#536bb7] px-3 text-xs font-semibold text-white disabled:opacity-60">{isUpdating ? "Updating…" : waitingWorker ? "Update now" : "Reload to update"}</button>
  </aside>;
}

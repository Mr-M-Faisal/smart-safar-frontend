"use client";

import { useEffect, useRef, useState } from "react";

export default function ServiceWorkerRegister() {
  const [waitingWorker, setWaitingWorker] = useState(null);
  const reloadAfterUpdate = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return undefined;

    let registration;
    const onControllerChange = () => {
      if (!reloadAfterUpdate.current) return;
      reloadAfterUpdate.current = false;
      window.location.reload();
    };
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js")
        .then((value) => {
          registration = value;
          if (registration.waiting && navigator.serviceWorker.controller) setWaitingWorker(registration.waiting);
          registration.addEventListener("updatefound", () => {
            const installingWorker = registration.installing;
            installingWorker?.addEventListener("statechange", () => {
              if (installingWorker.state === "installed" && navigator.serviceWorker.controller) setWaitingWorker(installingWorker);
            });
          });
        })
        .catch((error) => console.warn("Service worker registration failed:", error));
    };

    window.addEventListener("load", onLoad, { once: true });
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    if (document.readyState === "complete") onLoad();
    return () => {
      window.removeEventListener("load", onLoad);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  function applyUpdate() {
    if (!waitingWorker) return;
    reloadAfterUpdate.current = true;
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }

  return waitingWorker && <aside role="status" aria-live="polite" className="fixed inset-x-3 bottom-4 z-[1400] mx-auto flex max-w-lg items-center justify-between gap-4 rounded-2xl border border-[#dce2f1] bg-white p-4 text-[#293553] shadow-[0_16px_42px_rgba(35,49,87,.2)] sm:inset-x-5">
    <div><p className="text-sm font-semibold">New version available</p><p className="mt-1 text-xs text-[#68738e]">Reload to use the latest Smart Safar updates.</p></div>
    <button type="button" onClick={applyUpdate} className="min-h-11 shrink-0 rounded-xl bg-[#536bb7] px-4 text-xs font-semibold text-white hover:bg-[#43599f]">Reload</button>
  </aside>;
}

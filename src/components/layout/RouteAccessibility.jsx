"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function currentEntryKey() {
  return window.history.state?.key || `${window.location.pathname}${window.location.search}`;
}

export default function RouteAccessibility() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [announcement, setAnnouncement] = useState("");
  const pendingRestore = useRef(null);
  const lastPathname = useRef(null);

  useEffect(() => {
    const saveScroll = () => {
      try { sessionStorage.setItem(`ss-scroll:${currentEntryKey()}`, JSON.stringify({ x: window.scrollX, y: window.scrollY })); }
      catch (_error) {}
    };
    const rememberBackEntry = () => { pendingRestore.current = currentEntryKey(); };
    window.addEventListener("scroll", saveScroll, { passive: true });
    window.addEventListener("popstate", rememberBackEntry);
    return () => {
      window.removeEventListener("scroll", saveScroll);
      window.removeEventListener("popstate", rememberBackEntry);
    };
  }, []);

  useEffect(() => {
    const heading = document.querySelector("main h1, h1");
    const title = heading?.textContent?.trim() || document.title;
    // Do not steal focus on first load. Only move it after an in-app route change.
    // Tracking the pathname also avoids focusing the heading when only query state changes.
    if (lastPathname.current !== null && lastPathname.current !== pathname && heading) {
      if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
    lastPathname.current = pathname;
    setAnnouncement("");
    const announceTimer = window.setTimeout(() => setAnnouncement(title), 30);
    const restoreKey = pendingRestore.current;
    pendingRestore.current = null;
    let firstFrame;
    let secondFrame;
    if (restoreKey) {
      try {
        const saved = JSON.parse(sessionStorage.getItem(`ss-scroll:${restoreKey}`) || "null");
        if (saved && Number.isFinite(saved.y)) {
          firstFrame = window.requestAnimationFrame(() => {
            secondFrame = window.requestAnimationFrame(() => window.scrollTo(saved.x || 0, saved.y));
          });
        }
      } catch (_error) {}
    }
    return () => {
      window.clearTimeout(announceTimer);
      if (firstFrame) window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [pathname, search]);

  return <span className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</span>;
}

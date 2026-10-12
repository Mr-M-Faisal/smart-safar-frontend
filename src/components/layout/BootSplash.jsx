"use client";

import { useEffect, useState } from "react";
import BrandMark from "@/components/layout/BrandMark";

const SESSION_KEY = "smart-safar:boot-splash-seen";

export default function BootSplash() {
  const [mounted, setMounted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) {
        return;
      }
      sessionStorage.setItem(SESSION_KEY, "true");
    } catch {
      // In case sessionStorage is blocked or unavailable
    }

    setMounted(true);
    // Start fading out after 200ms
    const fadeTimer = window.setTimeout(() => setHydrated(true), 200);
    // Completely unmount after 450ms (total visible time <= 500ms)
    const removeTimer = window.setTimeout(() => setMounted(false), 450);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div aria-hidden="true" className={`boot-splash${hydrated ? " is-hydrated" : ""}`}>
      <div className="boot-splash-brand">
        <BrandMark size="header" tone="dark" className="boot-splash-mark" />
        <span>Smart Safar</span>
        <small>FAISALABAD TRANSIT</small>
      </div>
    </div>
  );
}

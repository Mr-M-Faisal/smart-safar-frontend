"use client";

import { useEffect, useState } from "react";
import BrandMark from "@/components/layout/BrandMark";

export default function BootSplash() {
  const [hydrated, setHydrated] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!hydrated) return undefined;
    const timeout = window.setTimeout(() => setDismissed(true), 380);
    return () => window.clearTimeout(timeout);
  }, [hydrated]);

  if (dismissed) return null;
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

"use client";

import { useEffect, useState } from "react";
import useInstallPrompt from "@/lib/pwa/useInstallPrompt";

const KEY = "ss-install-banner-dismissed";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function InstallBanner() {
  const { isInstalled } = useInstallPrompt();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (isInstalled) return;
    try {
      const dismissedAt = Number(localStorage.getItem(KEY) || 0);
      setVisible(!dismissedAt || Date.now() - dismissedAt >= WEEK_MS);
    } catch { setVisible(true); }
  }, [isInstalled]);
  if (!visible || isInstalled) return null;
  return <aside className="mb-4 flex items-center gap-3 rounded-2xl border border-[#dfe6f8] bg-white p-3 shadow-sm">
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef1fc] text-[#536bb7]" aria-hidden="true">⇩</span>
    <div className="min-w-0 flex-1"><p className="text-xs font-bold text-[#34405d]">Install Smart Safar</p><p className="mt-0.5 text-[10px] text-[#77829a]">Keep your routes and trips one tap away.</p></div>
    <button type="button" onClick={() => document.querySelector(".ss-install-button")?.click()} className="min-h-10 rounded-lg bg-[#536bb7] px-3 text-[10px] font-bold text-white">Install</button>
    <button type="button" aria-label="Dismiss install suggestion for 7 days" onClick={() => { try { localStorage.setItem(KEY, String(Date.now())); } catch {} setVisible(false); }} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-lg text-[#77829a]">×</button>
  </aside>;
}

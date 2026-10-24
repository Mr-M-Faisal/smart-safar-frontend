"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import BottomSheet from "@/components/app/BottomSheet";
import useInstallPrompt from "@/lib/pwa/useInstallPrompt";

export default function InstallButton() {
  const pathname = usePathname() || "";
  const { mode, isInstalled, install, attentionPulse, instructions } = useInstallPrompt();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const isMobileShell = pathname === "/m" || pathname.startsWith("/m/");
  if (isInstalled || mode === "installed") return null;

  async function handleClick() {
    if (mode === "prompt") { await install(); return; }
    setOpen(true);
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); }
    catch { setCopied(false); }
  }

  return <>
    <button type="button" aria-label="Install Smart Safar app" onClick={() => void handleClick()} className={`ss-install-button${attentionPulse ? " is-attention" : ""}${isMobileShell ? "" : " website-install-button"}`} title="Install Smart Safar app">
      <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3"/></svg><span>Install</span>
    </button>
    <BottomSheet open={open} title="Install Smart Safar" onClose={() => setOpen(false)}>
      <p className="text-sm text-[#68738e]">{mode === "ios-other" ? "Open this page in Safari to install Smart Safar." : "Install Smart Safar for faster access from your home screen."}</p>
      <ol className="mt-4 space-y-3 text-sm text-[#34405d]">{instructions.map((instruction, index) => <li key={instruction} className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#eef1fc] text-xs font-bold text-[#536bb7]">{index + 1}</span><span>{instruction}</span></li>)}</ol>
      {mode === "ios-other" && <button type="button" onClick={() => void copyLink()} className="app-primary mt-5 w-full">{copied ? "Link copied" : "Copy link"}</button>}
      <button type="button" onClick={() => setOpen(false)} className="app-secondary mt-3 w-full">Close</button>
    </BottomSheet>
  </>;
}

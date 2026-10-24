"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import BottomSheet from "@/components/app/BottomSheet";
import QrCode from "@/components/app/QrCode";
import useInstallPrompt from "@/lib/pwa/useInstallPrompt";

export default function InstallButton() {
  const pathname = usePathname() || "";
  const { mode, isInstalled, install, attentionPulse, instructions } = useInstallPrompt();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("computer");
  const [copied, setCopied] = useState(false);
  const [appUrl, setAppUrl] = useState("/app");
  const isMobileShell = pathname === "/m" || pathname.startsWith("/m/");
  useEffect(() => { setAppUrl(`${window.location.origin}/app`); }, []);
  if (isInstalled || mode === "installed") return null;

  async function handleClick() {
    if (isMobileShell && mode === "prompt") { await install(); return; }
    setOpen(true);
  }

  async function copyLink() {
    const url = `${window.location.origin}/app`;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
      else {
        const field = document.createElement("textarea"); field.value = url; field.style.position = "fixed"; field.style.opacity = "0";
        document.body.appendChild(field); field.select(); const ok = document.execCommand("copy"); field.remove(); if (!ok) throw new Error("Copy failed");
      }
      setCopied(true);
    } catch { setCopied(false); }
  }

  return <>
    <button type="button" aria-label="Install Smart Safar app" onClick={() => void handleClick()} className={`ss-install-button${attentionPulse ? " is-attention" : ""}${isMobileShell ? "" : " website-install-button"}`} title="Install Smart Safar app">
      <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3"/></svg><span>Install</span>
    </button>
    <BottomSheet open={open} title="Get the Smart Safar app" onClose={() => setOpen(false)}>
      <div role="tablist" aria-label="Install options" className="grid grid-cols-2 rounded-xl bg-[#f1f3fa] p-1">
        {[ ["computer", "On this computer"], ["phone", "On your phone"] ].map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} type="button" onClick={() => setTab(id)} className={`min-h-10 rounded-lg px-2 text-xs font-semibold ${tab === id ? "bg-white text-[#40599f] shadow-sm" : "text-[#77829a]"}`}>{label}</button>)}
      </div>
      {tab === "computer" ? <section role="tabpanel" className="pt-4">
        {mode === "prompt" ? <><p className="text-sm text-[#68738e]">Install Smart Safar in this browser for faster access.</p><button type="button" onClick={() => void install()} className="app-primary mt-4 w-full">Install Smart Safar</button></> : <>
          <p className="text-sm text-[#68738e]">{mode === "ios-other" ? "Open this page in Safari to install Smart Safar." : "Install Smart Safar for faster access from your home screen."}</p>
          <ol className="mt-4 space-y-3 text-sm text-[#34405d]">{instructions.map((instruction, index) => <li key={instruction} className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#eef1fc] text-xs font-bold text-[#536bb7]">{index + 1}</span><span>{instruction}</span></li>)}</ol>
          {mode === "ios-other" && <button type="button" onClick={() => void copyLink()} className="app-primary mt-4 w-full">{copied ? "Link copied" : "Copy link"}</button>}
          {mode === "desktop-manual" && <p className="mt-4 rounded-xl bg-[#f6f7fb] p-3 text-xs leading-5 text-[#77829a]">Safari and Firefox desktop do not currently offer Smart Safar installation.</p>}
        </>}
      </section> : <section role="tabpanel" className="pt-4 text-center">
        <p className="text-sm text-[#68738e]">Scan this code with your phone camera to open the app.</p>
        <div className="my-3 inline-block rounded-2xl border border-[#e5e9f3] bg-white p-2"><QrCode value={appUrl} /></div>
        <p className="break-all text-[10px] text-[#77829a]">{appUrl}</p>
        <button type="button" onClick={() => void copyLink()} className="app-primary mt-3 w-full">{copied ? "Link copied" : "Copy link"}</button>
        <div className="mt-4 grid gap-2 text-left text-xs text-[#596681] sm:grid-cols-2"><p className="rounded-xl bg-[#f6f7fb] p-3"><strong className="block text-[#34405d]">Android</strong>Chrome ⋮ → Install app</p><p className="rounded-xl bg-[#f6f7fb] p-3"><strong className="block text-[#34405d]">iPhone</strong>Safari Share → Add to Home Screen</p></div>
      </section>}
      <button type="button" onClick={() => setOpen(false)} className="app-secondary mt-3 w-full">Close</button>
    </BottomSheet>
  </>;
}

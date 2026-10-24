"use client";

import { useState } from "react";
import AppIcon from "@/components/app/icons";
import useInstallPrompt from "@/lib/pwa/useInstallPrompt";

export default function InstallButton() {
  const { canInstall, isInstalled, isIOS, install, dismissed, dismiss, attentionPulse } = useInstallPrompt();
  const [showIOS, setShowIOS] = useState(false);
  if (isInstalled || dismissed || (!canInstall && !isIOS)) return null;
  const startInstall = async () => { if (isIOS) setShowIOS(true); else await install(); };
  return <>
    <button type="button" aria-label="Install Smart Safar app" onClick={startInstall} className={`ss-install-button${attentionPulse ? " is-attention" : ""}`} title="Install Smart Safar app"><svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3"/></svg><span>Install</span></button>
    {showIOS && <div className="fixed inset-0 z-[2400] flex items-end justify-center bg-[#101a35]/45 p-3 sm:items-center" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowIOS(false); }}><section role="dialog" aria-modal="true" aria-labelledby="ios-install-title" className="w-full max-w-md rounded-[24px] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-[#293553] shadow-2xl"><div className="flex items-center justify-between"><h2 id="ios-install-title" className="text-lg font-bold">Install Smart Safar</h2><button aria-label="Close install instructions" className="grid h-11 w-11 place-items-center rounded-xl text-lg" onClick={() => setShowIOS(false)}>×</button></div><p className="mt-1 text-sm text-[#68738e]">Add Smart Safar to your Home Screen:</p><ol className="mt-4 space-y-3 text-sm"><li className="flex items-center gap-3"><AppIcon name="Share"/><span>Tap <strong>Share</strong> in Safari.</span></li><li className="flex items-center gap-3"><span aria-hidden="true" className="w-6 text-center">＋</span><span>Choose <strong>Add to Home Screen</strong>.</span></li><li className="flex items-center gap-3"><span aria-hidden="true" className="w-6 text-center">✓</span><span>Tap <strong>Add</strong> to finish.</span></li></ol><button className="app-secondary mt-5 w-full" onClick={() => { dismiss(); setShowIOS(false); }}>Got it</button></section></div>}
  </>;
}

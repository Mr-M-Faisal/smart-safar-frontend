"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useInstallPrompt from "@/lib/pwa/useInstallPrompt";
import { mapWebToApp } from "@/lib/appModeRedirect";

const DISMISS_KEY = "ss-open-app-pill-dismissed";

export default function MobileAppPill() {
  const pathname = usePathname() || "/";
  const { isInstalled } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(true);
  const [href, setHref] = useState("/m");
  useEffect(() => {
    try { setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1"); } catch { setDismissed(false); }
    setHref(mapWebToApp(pathname, window.location.search) || "/m");
  }, [pathname]);
  if (isInstalled || dismissed) return null;
  return <aside className="ss-open-app-pill" aria-label="Open the Smart Safar mobile app">
    <Link href={href} onClick={(event) => {
      event.preventDefault();
      document.cookie = `ss-view=app; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      window.location.assign(href);
    }}>Open mobile app <span aria-hidden="true">↗</span></Link>
    <button type="button" aria-label="Dismiss mobile app link for this session" onClick={() => {
      try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch {}
      setDismissed(true);
    }}>×</button>
  </aside>;
}

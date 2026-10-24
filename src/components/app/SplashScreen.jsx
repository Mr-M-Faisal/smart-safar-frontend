"use client";

import { useEffect, useRef, useState } from "react";
import BrandMark from "@/components/layout/BrandMark";
import { useAuth } from "@/lib/auth/AuthProvider";
import splashPolicy from "@/lib/splashPolicy.cjs";

export default function SplashScreen() {
  const auth = useAuth();
  const authStatus = useRef(auth.status);
  authStatus.current = auth.status;
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    try {
      if (!splashPolicy.shouldShowSplash(sessionStorage.getItem("ss-splash-shown"))) { setVisible(false); return undefined; }
      sessionStorage.setItem("ss-splash-shown", "1");
    } catch (_error) {}
    const startedAt = Date.now();
    const check = () => {
      const elapsed = Date.now() - startedAt;
      if (elapsed >= 3000 || (elapsed >= 1200 && authStatus.current !== "loading")) setVisible(false);
    };
    const timer = window.setInterval(check, 80);
    return () => window.clearInterval(timer);
  }, []);
  return <div className={`ss-splash ${visible ? "is-visible" : "is-hidden"}`} role="status" aria-live="polite" aria-hidden={!visible}>
    <span className="sr-only">Loading Smart Safar</span>
    <div className="ss-splash-brand"><BrandMark size="header" className="ss-splash-mark" /><span><strong className="ss-splash-wordmark">Smart Safar</strong><small className="ss-splash-tagline">Faisalabad Transit</small></span></div>
    <div className="ss-splash-route" aria-hidden="true"><svg className="ss-splash-bus" viewBox="0 0 32 20" width="30" height="19" fill="none"><rect x="2" y="2" width="25" height="13" rx="3" fill="#60ead0"/><path d="M5 5h7v5H5zm10 0h8v5h-8z" fill="#26386e"/><circle cx="8" cy="16" r="2" fill="#fff"/><circle cx="22" cy="16" r="2" fill="#fff"/></svg></div>
    <div className="ss-splash-progress" aria-hidden="true"><span /></div>
  </div>;
}

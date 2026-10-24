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
    <div className="ss-splash-brand"><BrandMark size="header" className="ss-splash-mark" /><span><strong>Smart Safar</strong><small>Faisalabad Transit</small></span></div>
    <div className="ss-splash-route" aria-hidden="true"><span className="ss-splash-bus">▰</span></div>
    <div className="ss-splash-progress" aria-hidden="true"><span /></div>
  </div>;
}

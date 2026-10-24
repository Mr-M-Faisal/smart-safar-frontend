import { Suspense } from "react";

export default function MobileAdminLayout({ children }) {
  return <Suspense fallback={<div className="app-screen"><div className="app-empty">Loading admin workspace…</div></div>}>{children}</Suspense>;
}

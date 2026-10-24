"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import InstallPrompt from "@/components/layout/InstallPrompt";
import { useAppMode } from "@/lib/AppModeProvider";

export default function AppViewport({ children }) {
  const mode = useAppMode();
  const pathname = usePathname();
  const tabs = [["Home", "/m"], ["Map", "/m/map"], ["Routes", "/m/routes"], ["Book", "/m/book"]];
  return <div className="m-app-stage" data-mode={mode}>
    <div className="m-app-frame">
      <div className="m-app-preview-banner">You are viewing the mobile app. <Link href="/">Open the website instead.</Link></div>
      <div id="app-content" className="m-app-content pb-24">{children}</div>
    </div>
    <nav aria-label="Mobile app navigation" className="fixed inset-x-0 bottom-0 z-[1100] mx-auto w-full max-w-[430px] border-t border-[#e0e5f2] bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(35,49,87,.1)] backdrop-blur-xl">
      <div className="grid grid-cols-4 gap-1">
        {tabs.map(([label, href]) => {
          const active = pathname === href || (href !== "/m" && pathname.startsWith(`${href}/`));
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-[10px] font-semibold transition ${active ? "bg-[#eef1fc] text-[#40599f]" : "text-[#77829a] hover:bg-[#f6f7fb] hover:text-[#40599f]"}`}><span aria-hidden="true" className="text-base leading-4">{href === "/m" ? "⌂" : href === "/m/map" ? "⌖" : href === "/m/routes" ? "☷" : "▣"}</span>{label}</Link>;
        })}
      </div>
    </nav>
    <InstallPrompt placement="app" />
  </div>;
}

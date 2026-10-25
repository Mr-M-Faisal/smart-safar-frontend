"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AppIcon from "@/components/app/icons";
import BottomSheet from "@/components/app/BottomSheet";
import InstallButton from "@/components/app/InstallButton";
import { useAuth } from "@/lib/auth/AuthProvider";
import { revokeAndClearSession } from "@/lib/session";
import settingsStore from "@/lib/settings.js";
import packageInfo from "../../../package.json";
import { useAppRefresh } from "@/components/app/AppRefreshContext";
import VersionStatus from "@/components/app/VersionStatus";

const colors = ["#536bb7", "#16866f", "#b85c49", "#7257b5"];

function settingRow(icon, title, subtitle, content) {
  return <div className="flex min-h-14 items-center gap-3 px-4 py-3"><span className="app-action-icon h-9 w-9"><AppIcon name={icon} size={17}/></span><span className="min-w-0 flex-1"><strong className="block text-xs text-[#34405d]">{title}</strong>{subtitle && <small className="mt-0.5 block text-[10px] text-[#8992a8]">{subtitle}</small>}</span>{content}</div>;
}

export default function SettingsScreen({ admin = false, desktop = false }) {
  const auth = useAuth();
  useAppRefresh(auth.refreshAuth);
  const router = useRouter();
  const pathname = usePathname() || "/m/account";
  const profileHref = desktop ? "/account/profile" : "/m/account/profile";
  const switchAccountHref = desktop ? "/login?switch=1" : "/m/login?switch=1";
  const [settings, setSettings] = useState(settingsStore.DEFAULT_SETTINGS);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [cacheMessage, setCacheMessage] = useState("");
  const buildId = process.env.NEXT_PUBLIC_BUILD_ID || "development";
  useEffect(() => setSettings(settingsStore.readSettings()), []);
  function update(patch) {
    const next = settingsStore.saveSettings(patch);
    setSettings(next);
    const appliedTheme = next.theme === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : next.theme;
    document.documentElement.dataset.theme = appliedTheme;
    document.documentElement.style.setProperty("--color-accent", next.accent);
  }
  function switchToWeb() {
    document.cookie = `ss-view=web; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    const target = desktop ? "/app" : admin || pathname.startsWith("/m/admin") ? "/admin" : auth.role === "driver" ? "/driver" : "/";
    if (!desktop && (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true)) window.open(target, "_blank", "noopener,noreferrer");
    else window.location.assign(target);
  }
  async function clearCache() {
    try {
      for (let index = localStorage.length - 1; index >= 0; index -= 1) {
        const key = localStorage.key(index);
        if (key?.startsWith("ss-cache-v1:")) localStorage.removeItem(key);
      }
      if ("caches" in window) for (const key of await caches.keys()) if (key.startsWith("smart-safar-tiles-")) await caches.delete(key);
      setCacheMessage("Saved route and map data cleared. Your sign-in is unchanged.");
    } catch { setCacheMessage("Could not clear saved data on this device."); }
  }
  async function signOut() {
    await revokeAndClearSession(auth.role);
    router.replace(desktop ? "/login" : "/m/login");
  }
  return <div className={desktop ? "ss-desktop-settings workspace-theme grid w-full max-w-none gap-6" : "app-screen space-y-4"}>
    <section className="app-card p-4"><p className="app-eyebrow">Profile</p><div className="mt-3 flex items-center gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e9edff] text-sm font-bold text-[#536bb7]">{(auth.user?.name || auth.role || "S").split(/\s+/).slice(0,2).map((part)=>part[0]).join("").toUpperCase()}</span><div className="min-w-0"><h2 className="truncate text-sm font-bold text-[#293553]">{auth.user?.name || "Smart Safar user"}</h2><p className="truncate text-xs text-[#77829a]">{auth.user?.email || "Guest account"}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#edf0f6] pt-3 text-[10px] text-[#77829a]"><p>Role <strong className="block text-[#34405d]">{auth.role || "Guest"}</strong></p><p>Phone <strong className="block text-[#34405d]">{auth.user?.phone || "Not provided"}</strong></p></div></section>
    <section className="app-card divide-y divide-[#edf0f6] overflow-hidden"><h2 className="px-4 pt-4 text-[10px] font-bold uppercase tracking-wide text-[#8992a8]">Account</h2><Link href={profileHref} className="flex min-h-14 items-center px-4 text-xs font-semibold text-[#34405d]">Profile <span className="ml-auto">→</span></Link><Link href={`${profileHref}?password=1`} className="flex min-h-14 items-center px-4 text-xs font-semibold text-[#34405d]">Change password <span className="ml-auto">→</span></Link><Link href={switchAccountHref} className="flex min-h-14 items-center px-4 text-xs font-semibold text-[#34405d]">Switch account <span className="ml-auto">→</span></Link></section><section className="app-card overflow-hidden"><h2 className="px-4 pt-4 text-[10px] font-bold uppercase tracking-wide text-[#8992a8]">Personalization</h2>{settingRow("Sun","Appearance","Choose a theme and accent color.",<select aria-label="Appearance" value={settings.theme} onChange={(event)=>update({theme:event.target.value})} className="min-h-10 rounded-lg border border-[#e2e6f1] bg-white px-2 text-xs"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select>)}{settingRow("Sun","Accent color",null,<div className="flex gap-2">{colors.map((color)=><button key={color} type="button" aria-label={`Accent ${color}`} aria-pressed={settings.accent===color} onClick={()=>update({accent:color})} className="h-7 w-7 rounded-full border-2" style={{backgroundColor:color,borderColor:settings.accent===color?"#293553":"white"}}/>)}</div>)}{settingRow("Map","Data Saver","Slower nonessential updates; safety tracking stays active.",<button type="button" role="switch" aria-checked={settings.dataSaver} onClick={()=>update({dataSaver:!settings.dataSaver})} className={`h-7 w-12 rounded-full p-1 transition ${settings.dataSaver?"bg-[#536bb7]":"bg-slate-300"}`}><span className={`block h-5 w-5 rounded-full bg-white transition-transform ${settings.dataSaver?"translate-x-5":""}`}/></button>)}{settingRow("Bell","Notifications","In-app service updates are available from the bell in the top bar.",<span className="text-[10px] text-[#8992a8]">In app</span>)}{settingRow("Routes","Language","English",<span className="text-[10px] text-[#8992a8]">English</span>)}</section>
    <section className="app-card divide-y divide-[#edf0f6] overflow-hidden"><h2 className="px-4 pt-4 text-[10px] font-bold uppercase tracking-wide text-[#8992a8]">App</h2><div className="flex min-h-14 items-center justify-between px-4"><span className="text-xs font-semibold text-[#34405d]">Install app</span><InstallButton/></div>{!desktop && <button onClick={switchToWeb} className="flex min-h-14 w-full items-center px-4 text-left text-xs font-semibold text-[#34405d]">Use desktop site <span className="ml-auto text-[10px] font-normal text-[#8992a8]">Only for this session</span></button>}<button onClick={()=>void clearCache()} className="flex min-h-14 w-full items-center px-4 text-left text-xs font-semibold text-[#34405d]">Clear cached data <span className="ml-auto">→</span></button>{settingRow("Map","Offline status",typeof navigator!=="undefined"&&!navigator.onLine?"Offline":"Online",<span className={`h-2 w-2 rounded-full ${typeof navigator!=="undefined"&&!navigator.onLine?"bg-amber-500":"bg-emerald-500"}`}/>)}{cacheMessage && <p role="status" className="px-4 pb-3 text-[10px] text-[#536bb7]">{cacheMessage}</p>}</section>
        {admin && <section className="app-card divide-y divide-[#edf0f6] overflow-hidden"><h2 className="px-4 pt-4 text-[10px] font-bold uppercase tracking-wide text-[#8992a8]">Operations</h2>{(desktop ? [["Bookings","/admin?tab=bookings"],["Reports","/admin?tab=reports"],["Alerts","/admin?tab=alerts"]] : [["Bookings","/m/admin/bookings"],["Reports","/m/admin/reports"],["Alerts","/m/admin/alerts"]]).map(([label,href])=><Link key={href} href={href} className="flex min-h-14 items-center px-4 text-xs font-semibold text-[#34405d]">{label}<span className="ml-auto">→</span></Link>)}</section>}
    <section className="app-card divide-y divide-[#edf0f6] overflow-hidden"><h2 className="px-4 pt-4 text-[10px] font-bold uppercase tracking-wide text-[#8992a8]">Help and about</h2><Link href="/m/trips" className="flex min-h-14 items-center px-4 text-xs font-semibold text-[#34405d]">Report an issue <span className="ml-auto">→</span></Link>{settingRow("Home","About Smart Safar",`Version ${packageInfo.version} · build ${buildId}`,<span className="text-[10px] text-[#8992a8]">ℹ</span>)}<div className="px-4 pb-3"><VersionStatus/></div></section>
    {auth.status === "authenticated" && <button type="button" onClick={()=>setLogoutOpen(true)} className="min-h-12 w-full rounded-xl border border-rose-200 bg-white text-sm font-bold text-rose-700">Log out</button>}
    <BottomSheet open={logoutOpen} title="Log out?" onClose={()=>setLogoutOpen(false)}><p className="text-sm text-[#68738e]">This signs out this account on this device.</p><button className="mt-4 min-h-12 w-full rounded-xl bg-rose-600 text-sm font-bold text-white" onClick={()=>void signOut()}>Log out</button><button className="mt-2 min-h-11 w-full text-xs font-semibold text-[#536bb7]" onClick={()=>setLogoutOpen(false)}>Cancel</button></BottomSheet>
  </div>;
}

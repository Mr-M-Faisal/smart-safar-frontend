"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { revokeAndClearSession } from "@/lib/session";
import AppIcon from "@/components/app/icons";

function setViewCookie(view) {
  document.cookie = `ss-view=${view}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}

export default function MobileAccountPage() {
  const auth = useAuth();
  const router = useRouter();
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    try { const value = localStorage.getItem("smart-safar-theme"); setTheme(value === "dark" ? "dark" : "light"); } catch (_error) {}
  }, []);
  function chooseTheme(value) {
    setTheme(value);
    document.documentElement.dataset.theme = value;
    try { localStorage.setItem("smart-safar-theme", value); } catch (_error) {}
  }
  async function signOut() {
    await revokeAndClearSession(auth.role);
    router.replace("/m/login");
  }
  function desktopSite() {
    setViewCookie("web");
    window.location.assign("/");
  }
  return <div className="app-screen">
    <section className="rounded-[22px] bg-gradient-to-br from-[#263a70] to-[#536bb7] p-5 text-white shadow-lg"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#b8f5e6]">Your profile</p><h2 className="mt-2 text-xl font-bold">{auth.user?.name || (auth.status === "authenticated" ? "Smart Safar user" : "Welcome to Smart Safar")}</h2><p className="mt-1 break-all text-xs text-white/75">{auth.user?.email || "Sign in to manage bookings and account settings."}</p><p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-white/70">{auth.role || "Passenger"} account</p></section>
    {auth.status !== "authenticated" && <Link href={`/m/login?returnTo=${encodeURIComponent("/m/account")}`} className="app-primary mt-4 w-full">Sign in or create account</Link>}
    <section className="app-card mt-4 p-4"><div className="flex items-center gap-3"><span className="app-action-icon"><AppIcon name={theme === "dark" ? "Moon" : "Sun"}/></span><div><h3 className="text-sm font-bold text-[#34405d]">Appearance</h3><p className="mt-1 text-[11px] text-[#77829a]">Choose your app theme.</p></div></div><div className="mt-3 grid grid-cols-2 gap-2">{["light", "dark"].map((value) => <button key={value} type="button" aria-pressed={theme === value} onClick={() => chooseTheme(value)} className={`min-h-11 rounded-xl border text-xs font-bold capitalize ${theme === value ? "border-[#536bb7] bg-[#eef1fc] text-[#40599f]" : "border-[#e2e6f1] bg-white text-[#77829a]"}`}>{value === "light" ? "☀ Light" : "☾ Dark"}</button>)}</div></section>
    <section className="app-card mt-3 divide-y divide-[#edf0f6] overflow-hidden"><Link href="/m/trips" className="flex min-h-14 items-center gap-3 px-4 text-sm font-semibold text-[#46516d]"><AppIcon name="Trips" size={18}/><span className="flex-1">My bookings and safety</span><span>→</span></Link><Link href="/m/routes" className="flex min-h-14 items-center gap-3 px-4 text-sm font-semibold text-[#46516d]"><AppIcon name="Routes" size={18}/><span className="flex-1">About Smart Safar</span><span>→</span></Link><button type="button" onClick={desktopSite} className="flex min-h-14 w-full items-center gap-3 px-4 text-left text-sm font-semibold text-[#46516d]"><span className="flex-1">Use desktop site</span><span>↗</span></button></section>
    {auth.status === "authenticated" && <button type="button" onClick={() => void signOut()} className="mt-3 min-h-12 w-full rounded-xl border border-rose-200 bg-white text-sm font-bold text-rose-700">Sign out</button>}
    <p className="mt-5 text-center text-[10px] text-[#8992a8]">Smart Safar · Faisalabad Transit</p>
  </div>;
}

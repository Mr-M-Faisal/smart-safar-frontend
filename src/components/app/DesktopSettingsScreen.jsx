"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import settingsStore from "@/lib/settings.js";
import VersionStatus from "@/components/app/VersionStatus";
import { useAppRefresh } from "@/components/app/AppRefreshContext";

const accents = ["#536bb7", "#16866f", "#b85c49", "#7257b5"];

export default function DesktopSettingsScreen() {
  const auth = useAuth();
  useAppRefresh(auth.refreshAuth);
  const [settings, setSettings] = useState(settingsStore.readSettings());
  const [aboutOpen, setAboutOpen] = useState(false);
  const initials = (auth.user?.name || "S").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const save = (patch) => {
    const next = settingsStore.saveSettings(patch);
    setSettings(next);
    const resolvedTheme = next.theme === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : next.theme;
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.setProperty("--color-accent", next.accent);
  };

  return <div className="mx-auto max-w-5xl space-y-7 pb-8">
    <section aria-label="Profile summary" className="rounded-2xl border border-[#d6e3f4] bg-white p-5 shadow-[0_8px_24px_rgba(39,74,122,.05)]">
      <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#5579a5]">Profile</p>
      <div className="mt-3 flex items-center gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#e6f0fb] text-sm font-bold text-[#1764a7]">{initials}</span>
        <div className="min-w-0"><h2 className="truncate text-lg font-semibold text-[#123c70]">{auth.user?.name || "System Admin"}</h2><p className="mt-1 truncate text-sm text-[#607892]">{auth.user?.email || ""}</p></div>
      </div>
    </section>

    <section aria-labelledby="settings-account-title">
      <h2 id="settings-account-title" className="mb-2 px-3 text-xs font-bold uppercase tracking-[.12em] text-[#567087]">Account</h2>
      <Link href="/account/profile" className="flex min-h-[76px] items-center gap-4 rounded-2xl border border-[#cbdced] bg-white px-5 transition hover:border-[#8eb5d8] hover:shadow-sm">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e9f2fb] text-[#1764a7]" aria-hidden="true">♙</span><span className="min-w-0 flex-1"><strong className="block text-sm font-semibold text-[#123c70]">Profile</strong><small className="mt-1 block text-sm text-[#607892]">View and edit your account</small></span><span aria-hidden="true" className="text-xl text-[#1764a7]">›</span>
      </Link>
    </section>

    <section aria-labelledby="settings-personalization-title">
      <h2 id="settings-personalization-title" className="mb-2 px-3 text-xs font-bold uppercase tracking-[.12em] text-[#567087]">Personalization</h2>
      <div className="divide-y divide-[#dce7f2] overflow-hidden rounded-2xl border border-[#cbdced] bg-white">
        <div className="flex min-h-[88px] flex-wrap items-center gap-4 px-5 py-4 sm:flex-nowrap">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e9f2fb] text-lg text-[#1764a7]" aria-hidden="true">◉</span>
          <span className="min-w-0 flex-1"><strong className="block text-sm font-semibold text-[#123c70]">Appearance</strong><small className="mt-1 block text-sm text-[#607892]">Light, dark and accent colours</small></span>
          <select aria-label="Appearance" value={settings.theme} onChange={(event) => save({ theme: event.target.value })} className="min-h-10 rounded-lg border border-[#cfdeed] bg-white px-3 text-sm text-[#264b71] outline-none focus:border-[#4388c1]">
            <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>
          </select>
          <div className="flex items-center gap-2" role="group" aria-label="Accent colour">{accents.map((color) => <button key={color} type="button" aria-label={`Accent ${color}`} aria-pressed={settings.accent === color} onClick={() => save({ accent: color })} className="h-7 w-7 rounded-full border-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1764a7]" style={{ backgroundColor: color, borderColor: settings.accent === color ? "#17345c" : "white", boxShadow: "0 0 0 1px #d6e2ee" }} />)}</div>
        </div>
        <div className="flex min-h-[82px] items-center gap-4 px-5 py-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e9f2fb] text-[#1764a7]" aria-hidden="true">☷</span>
          <span className="min-w-0 flex-1"><strong className="block text-sm font-semibold text-[#123c70]">Data Saver</strong><small className="mt-1 block text-sm text-[#607892]">Control nonessential data use</small></span>
          <button type="button" role="switch" aria-label="Data Saver" aria-checked={settings.dataSaver} onClick={() => save({ dataSaver: !settings.dataSaver })} className={`h-7 w-12 rounded-full p-1 transition ${settings.dataSaver ? "bg-[#1764a7]" : "bg-[#cbd7e3]"}`}><span className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${settings.dataSaver ? "translate-x-5" : "translate-x-0"}`} /></button>
        </div>
      </div>
    </section>

    <section aria-labelledby="settings-help-title">
      <h2 id="settings-help-title" className="mb-2 px-3 text-xs font-bold uppercase tracking-[.12em] text-[#567087]">Help</h2>
      <div className="divide-y divide-[#dce7f2] overflow-hidden rounded-2xl border border-[#cbdced] bg-white">
        <Link href="/admin?tab=reports" className="flex min-h-[70px] items-center gap-4 px-5 transition hover:bg-[#f8fbfe]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e9f2fb] text-[#1764a7]" aria-hidden="true">▤</span><strong className="flex-1 text-sm font-semibold text-[#123c70]">Report an issue</strong><span aria-hidden="true" className="text-xl text-[#1764a7]">›</span></Link>
        <button type="button" aria-expanded={aboutOpen} onClick={() => setAboutOpen((value) => !value)} className="flex min-h-[70px] w-full items-center gap-4 px-5 text-left transition hover:bg-[#f8fbfe]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e9f2fb] text-lg text-[#1764a7]" aria-hidden="true">ⓘ</span><strong className="flex-1 text-sm font-semibold text-[#123c70]">About Smart Safar</strong><span aria-hidden="true" className="text-xl text-[#1764a7]">{aboutOpen ? "⌄" : "›"}</span></button>
        {aboutOpen && <div className="border-t border-[#dce7f2] px-5 py-4"><p className="mb-3 text-sm text-[#607892]">Version {process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0"} · build {process.env.NEXT_PUBLIC_BUILD_ID || "development"}</p><VersionStatus/></div>}
      </div>
    </section>
  </div>;
}

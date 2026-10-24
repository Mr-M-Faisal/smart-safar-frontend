"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import settingsStore from "@/lib/settings.js";
import BottomSheet from "@/components/app/BottomSheet";

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  settingsStore.saveSettings({ theme });
}

export function ThemeBootstrap() {
  useEffect(() => {
    const saved = settingsStore.readSettings();
    const apply = () => {
      const current = settingsStore.readSettings();
      document.documentElement.dataset.theme = current.theme === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : current.theme;
      document.documentElement.style.setProperty("--color-accent", current.accent);
    };
    apply();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener?.("change", apply);
    window.addEventListener("smart-safar:settings-changed", apply);
    return () => { media.removeEventListener?.("change", apply); window.removeEventListener("smart-safar:settings-changed", apply); };
  }, []);
  return null;
}

export default function ProfileMenu({ name, email, role, onSignOut, variant = "dark", dashboardLinks = [], homeHref = "/", homeLabel = "Home", switchAccountHref = "/login?switch=1" }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const menuRef = useRef(null);
  const light = variant === "light";

  useEffect(() => {
    setTheme(settingsStore.readSettings().theme || "system");
    function onPointerDown(event) {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function chooseTheme(nextTheme) {
    const resolved = nextTheme === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : nextTheme;
    applyTheme(resolved);
    settingsStore.saveSettings({ theme: nextTheme });
    setTheme(nextTheme);
  }

  const initials = (name || role || "S").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <div ref={menuRef} className="relative z-[1300]">
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)} className={`inline-flex min-h-11 items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-left shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${light ? "border-[#dfe4f3] bg-white text-[#293553] hover:bg-[#f8f9fc] focus-visible:outline-[#536bb7]" : "border-white/30 bg-white/15 text-white backdrop-blur hover:bg-white/25 focus-visible:outline-white"}`}>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#a8efdf] text-xs font-bold text-[#26386e]">{initials}</span>
        <span className="hidden max-w-32 truncate text-xs font-semibold sm:block">{name || role || "Profile"}</span>
        <span aria-hidden="true" className={`text-xs ${light ? "text-[#74809a]" : "text-white/75"}`}>⌄</span>
      </button>
      {open && <div role="menu" className="absolute right-0 top-[calc(100%+10px)] w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#dfe4f3] bg-white p-2 text-[#293553] shadow-[0_22px_65px_rgba(28,42,83,.24)]">
        <div className="rounded-xl bg-[#f4f6fc] px-3.5 py-3">
          <p className="truncate text-sm font-semibold">{name || role}</p>
          {email && <p className="mt-0.5 truncate text-xs text-[#74809a]">{email}</p>}
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#536bb7]">{role} account</p>
        </div>
        {dashboardLinks.length > 0 && <div className="border-b border-[#edf0f6] py-1">{dashboardLinks.map((item) => <Link key={item.href} role="menuitem" href={item.href} onClick={() => setOpen(false)} className="block rounded-lg px-3.5 py-2.5 text-xs font-semibold text-[#596681] transition hover:bg-[#f4f6fc] hover:text-[#405ba7]">{item.label}<span aria-hidden="true" className="float-right">→</span></Link>)}</div>}
        <div className="px-3.5 pb-2 pt-3">
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#8992a8]">Appearance</p>
          <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-label="Choose color theme">
          {["light", "dark", "system"].map((value) => <button key={value} type="button" aria-pressed={theme === value} onClick={() => chooseTheme(value)} className={`min-h-10 rounded-lg border px-3 text-xs font-semibold capitalize transition ${theme === value ? "border-[#7185c6] bg-[#e9edff] text-[#405ba7]" : "border-[#e4e7f1] text-[#66728e] hover:bg-[#f8f9fc]"}`}>{value === "light" ? "☀ Light" : value === "dark" ? "☾ Dark" : "System"}</button>)}
          </div>
        </div>
        <div className="border-t border-[#edf0f6] pt-1">
          <Link role="menuitem" href={homeHref} onClick={() => setOpen(false)} className="block rounded-lg px-3.5 py-2.5 text-xs font-semibold text-[#596681] transition hover:bg-[#f4f6fc] hover:text-[#405ba7]">{homeLabel} <span aria-hidden="true" className="float-right">⌂</span></Link>
          <Link role="menuitem" href={switchAccountHref} onClick={() => setOpen(false)} className="block rounded-lg px-3.5 py-2.5 text-xs font-semibold text-[#596681] transition hover:bg-[#f4f6fc] hover:text-[#405ba7]">Switch account</Link>
          <button role="menuitem" type="button" onClick={() => { setOpen(false); setConfirmSignOut(true); }} className="block min-h-10 w-full rounded-lg px-3.5 text-left text-xs font-semibold text-[#a65348] transition hover:bg-[#fff5f2]">Log out</button>
        </div>
      </div>}
      <BottomSheet open={confirmSignOut} title="Log out?" onClose={() => setConfirmSignOut(false)}><p className="text-sm text-[#68738e]">This signs out this account on this device.</p><button className="mt-4 min-h-12 w-full rounded-xl bg-rose-600 text-sm font-bold text-white" onClick={() => { setConfirmSignOut(false); onSignOut?.(); }}>Log out</button><button className="mt-2 min-h-11 w-full text-xs font-semibold text-[#536bb7]" onClick={() => setConfirmSignOut(false)}>Cancel</button></BottomSheet>
    </div>
  );
}

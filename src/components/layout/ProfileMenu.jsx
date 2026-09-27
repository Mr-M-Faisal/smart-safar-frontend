"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem("smart-safar-theme", theme);
}

export function ThemeBootstrap() {
  useEffect(() => {
    const saved = window.localStorage.getItem("smart-safar-theme");
    if (saved === "dark" || saved === "light") document.documentElement.dataset.theme = saved;
  }, []);
  return null;
}

export default function ProfileMenu({ name, email, role, onSignOut, variant = "dark", dashboardLinks = [] }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const menuRef = useRef(null);
  const light = variant === "light";

  useEffect(() => {
    setTheme(window.localStorage.getItem("smart-safar-theme") || document.documentElement.dataset.theme || "light");
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
    applyTheme(nextTheme);
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
            {["light", "dark"].map((value) => <button key={value} type="button" aria-pressed={theme === value} onClick={() => chooseTheme(value)} className={`min-h-10 rounded-lg border px-3 text-xs font-semibold capitalize transition ${theme === value ? "border-[#7185c6] bg-[#e9edff] text-[#405ba7]" : "border-[#e4e7f1] text-[#66728e] hover:bg-[#f8f9fc]"}`}>{value === "light" ? "☀ Light" : "☾ Dark"}</button>)}
          </div>
        </div>
        <div className="border-t border-[#edf0f6] pt-1">
          <Link role="menuitem" href="/" onClick={() => setOpen(false)} className="block rounded-lg px-3.5 py-2.5 text-xs font-semibold text-[#596681] transition hover:bg-[#f4f6fc] hover:text-[#405ba7]">Back to public site <span aria-hidden="true" className="float-right">↗</span></Link>
          <button role="menuitem" type="button" onClick={() => { setOpen(false); onSignOut?.(); }} className="block min-h-10 w-full rounded-lg px-3.5 text-left text-xs font-semibold text-[#a65348] transition hover:bg-[#fff5f2]">Sign out</button>
        </div>
      </div>}
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function BottomSheet({ open, title, onClose, dirty = false, fullHeight = false, children }) {
  const startY = useRef(null);
  const dialogRef = useRef(null);
  function close() { if (!dirty || window.confirm("Discard your unsaved changes?")) onClose(); }
  useEffect(() => {
    if (!open) return undefined;
    dialogRef.current?.querySelector("button, input, select, textarea, a[href]")?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") { close(); return; }
      if (event.key !== "Tab") return;
      const controls = [...(dialogRef.current?.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])") || [])];
      if (!controls.length) { event.preventDefault(); return; }
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);
  if (!open || typeof document === "undefined") return null;
  return createPortal(<div className="fixed inset-0 z-[2300] flex items-end justify-center bg-[#101a35]/45 sm:items-center" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-label={title} className={`ss-bottom-sheet flex w-full max-w-xl flex-col rounded-t-[24px] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[24px] ${fullHeight ? "h-[100dvh] max-h-[100dvh] rounded-none pt-[max(1.25rem,env(safe-area-inset-top))] sm:h-auto sm:max-h-[90dvh] sm:rounded-[24px]" : ""}`} onTouchStart={(event) => { startY.current = event.touches[0]?.clientY; }} onTouchEnd={(event) => { const delta = event.changedTouches[0]?.clientY - startY.current; if (startY.current != null && delta > 90) close(); startY.current = null; }}>
      <button type="button" aria-label="Close sheet" className="mx-auto mb-4 block h-8 w-16 touch-none before:mx-auto before:block before:h-1.5 before:w-10 before:rounded-full before:bg-[#cbd3e4]" onClick={close}/>
      <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-[#293553]">{title}</h2><button type="button" aria-label="Close sheet" onClick={close} className="grid h-11 w-11 place-items-center rounded-xl text-xl text-[#77829a]">×</button></div>
      <div className={fullHeight ? "min-h-0 flex-1 overflow-y-auto" : "max-h-[min(70dvh,620px)] overflow-y-auto"}>{children}</div>
    </section>
  </div>, document.body);
}

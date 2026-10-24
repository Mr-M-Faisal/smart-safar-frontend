"use client";

import { useEffect } from "react";

export default function DirtyFormTracker() {
  useEffect(() => {
    const dirtyForms = new Set();
    const change = (form, dirty) => {
      if (dirty && !dirtyForms.has(form)) { dirtyForms.add(form); window.__ssDirtyForms = (window.__ssDirtyForms || 0) + 1; }
      if (!dirty && dirtyForms.has(form)) { dirtyForms.delete(form); window.__ssDirtyForms = Math.max(0, (window.__ssDirtyForms || 0) - 1); }
      window.dispatchEvent(new CustomEvent("smart-safar:dirty-forms-changed", { detail: { count: window.__ssDirtyForms || 0 } }));
    };
    const onInput = (event) => { const form = event.target?.closest?.("form[data-ss-dirty-form]"); if (form) change(form, true); };
    const onClean = (event) => { const form = event.target?.closest?.("form[data-ss-dirty-form]"); if (form) change(form, false); };
    document.addEventListener("input", onInput, true);
    document.addEventListener("change", onInput, true);
    document.addEventListener("submit", onClean, true);
    document.addEventListener("reset", onClean, true);
    const observer = new MutationObserver(() => dirtyForms.forEach((form) => { if (!form.isConnected) change(form, false); }));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); document.removeEventListener("input", onInput, true); document.removeEventListener("change", onInput, true); document.removeEventListener("submit", onClean, true); document.removeEventListener("reset", onClean, true); dirtyForms.forEach((form) => change(form, false)); };
  }, []);
  return null;
}

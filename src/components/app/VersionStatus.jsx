"use client";

import useReleaseStatus from "./useReleaseStatus";

function checkedLabel(checkedAt) {
  if (!checkedAt) return "Checking…";
  const minutes = Math.max(0, Math.floor((Date.now() - checkedAt) / 60000));
  return minutes < 1 ? "just checked" : `${minutes} min ago`;
}

export default function VersionStatus({ compact = false, showCheck = true }) {
  const status = useReleaseStatus();
  const label = status.status === "current" ? "✓ Up to date" : status.status === "checking" ? "Checking…" : status.status === "update-available" ? "Update available" : status.status === "updating" ? "Updating…" : status.status === "just-updated" ? "Updated" : status.status === "error" ? (typeof navigator !== "undefined" && !navigator.onLine ? "Offline" : "Check failed") : "Not checked";
  function check() { window.__smartSafarCheckForUpdates?.(); }
  return <div className={compact ? "text-[10px] text-white/70" : "text-[10px] text-[#77829a]"}>
    <p className="flex flex-wrap items-center gap-x-1">Version {status.version} · build {String(status.buildId || "—").slice(0, 10)} · {status.status === "update-available" && <span aria-label="Update available" className="inline-block h-2 w-2 rounded-full bg-[#e49353]"/>}{label}{status.checkedAt ? ` · checked ${checkedLabel(status.checkedAt)}` : ""}</p>
    {showCheck && <button type="button" onClick={check} className={`mt-1 min-h-8 text-[10px] font-semibold underline underline-offset-2 ${compact ? "text-[#b8f5e6]" : "text-[#536bb7]"}`}>Check for updates</button>}
  </div>;
}

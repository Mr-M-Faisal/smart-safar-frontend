"use client";

import { useEffect, useState } from "react";
import BottomSheet from "@/components/app/BottomSheet";
import changelog from "@/content/changelog.json";
import useReleaseStatus from "./useReleaseStatus";

export default function ReleaseNotesDialog() {
  const release = useReleaseStatus();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (release.status !== "just-updated" || !release.version) return;
    try { setOpen(localStorage.getItem("ss-last-seen-version") !== release.version); }
    catch { setOpen(true); }
  }, [release.status, release.version]);
  const notes = changelog.find((item) => item.version === release.version)?.notes || ["Smart Safar has been updated."];
  return <BottomSheet open={open} title={`Updated to v${release.version} — What’s new`} onClose={() => setOpen(false)} footer={<button type="button" onClick={() => { try { localStorage.setItem("ss-last-seen-version", release.version); } catch {} setOpen(false); }} className="app-primary w-full">Got it</button>}>
    <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-[#596681]">{notes.map((note) => <li key={note}>{note}</li>)}</ul>
  </BottomSheet>;
}

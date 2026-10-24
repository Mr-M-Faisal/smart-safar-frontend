"use client";
import { useState } from "react";
import Link from "next/link";
import AppIcon from "@/components/app/icons";
import BottomSheet from "@/components/app/BottomSheet";
import { useAuth } from "@/lib/auth/AuthProvider";
import useNotifications from "@/features/notifications/useNotifications";
function relativeTime(value) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return minutes + " min ago";
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? hours + " hr ago" : Math.floor(hours / 24) + " d ago";
}
export default function NotificationBell() {
  const auth = useAuth();
  const { items, unread, markAllRead, markOneRead } = useNotifications(auth);
  const [open, setOpen] = useState(false);
  if (auth.status !== "authenticated") return null;
  const badge = unread > 9 ? "9+" : String(unread);
  return <>
    <button type="button" onClick={() => setOpen(true)} className="relative grid h-11 w-11 place-items-center rounded-xl text-[#526186] hover:bg-[#f1f3fb]" aria-label={"Notifications, " + unread + " unread"}>
      <AppIcon name="Bell"/>{unread > 0 && <span aria-hidden="true" className="absolute right-1 top-1 grid min-h-[17px] min-w-[17px] place-items-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white">{badge}</span>}
    </button>
    <BottomSheet open={open} title="Notifications" onClose={() => setOpen(false)}>
      <div className="mb-3 flex justify-end"><button type="button" disabled={!unread} onClick={markAllRead} className="min-h-9 text-xs font-bold text-[#536bb7] disabled:opacity-40">Mark all read</button></div>
      {items.length === 0 ? <p className="rounded-2xl bg-[#f6f7fb] p-6 text-center text-sm text-[#77829a]">You’re all caught up.</p> : <div className="divide-y divide-[#edf0f6]">{items.map((item) => <Link key={item.id} href={item.href} onClick={() => { markOneRead(item.id); setOpen(false); }} className="flex gap-3 py-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef1fc] text-[#536bb7]"><AppIcon name={item.icon} size={18}/></span><span className="min-w-0 flex-1"><strong className="block text-xs text-[#34405d]">{item.title}</strong><span className="mt-1 block line-clamp-2 text-[11px] text-[#77829a]">{item.detail}</span><small className="mt-1 block text-[9px] text-[#9aa3b7]">{relativeTime(item.time)}</small></span><span aria-hidden="true" className="text-[#9aa3b7]">→</span></Link>)}</div>}
    </BottomSheet>
  </>;
}

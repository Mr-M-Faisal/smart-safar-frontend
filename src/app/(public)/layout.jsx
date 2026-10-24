"use client";

import { usePathname } from "next/navigation";
import PublicLayout from "@/components/layout/PublicLayout";

export default function PublicGroupLayout({ children }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/safety/track")) return <main className="min-h-dvh bg-[#f4f5fb] px-4 py-6 sm:px-8">{children}</main>;
  return <PublicLayout>{children}</PublicLayout>;
}

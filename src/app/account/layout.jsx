"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import BrandMark from "@/components/layout/BrandMark";
import InstallButton from "@/components/app/InstallButton";
import NotificationBell from "@/components/app/NotificationBell";
import ProfileMenu from "@/components/layout/ProfileMenu";
import { RequireAuth, useAuth } from "@/lib/auth/AuthProvider";
import { homeForRole } from "@/lib/auth/roleHome";
import { revokeAndClearSession } from "@/lib/session";

export default function AccountLayout({ children }) {
  const auth = useAuth();
  const pathname = usePathname() || "/account/profile";
  const router = useRouter();
  const role = auth.role === "admin" ? "Administrator" : auth.role === "driver" ? "Driver" : "Passenger";
  const homeHref = homeForRole(auth.role, false);
  useEffect(() => {
    if (auth.role === "admin" && pathname === "/account/settings") router.replace("/admin?tab=settings");
  }, [auth.role, pathname, router]);
  function signOut() {
    void revokeAndClearSession(auth.role);
    router.replace("/login");
  }
  return <RequireAuth><div className="min-h-screen bg-[#f4f5fb] text-[#293553]">
    <header className="sticky top-0 z-[1400] flex min-h-16 items-center justify-between border-b border-[#dfe4f3] bg-white/95 px-4 shadow-sm backdrop-blur sm:px-8">
      <Link href={homeHref} className="flex items-center gap-2"><BrandMark size="sm"/><span className="text-sm font-bold">Smart Safar <small className="ml-1 font-medium text-[#77829a]">/ Account</small></span></Link>
      <div className="flex items-center gap-1"><InstallButton/><NotificationBell/><ProfileMenu name={auth.user?.name} email={auth.user?.email} role={role} variant="light" compact simple={auth.role === "admin"} homeHref={homeHref} homeLabel="Open dashboard" dashboardLinks={[{ label: "Profile", href: "/account/profile" }, { label: "Settings", href: auth.role === "admin" ? "/admin?tab=settings" : "/account/settings" }]} switchAccountHref="/login?switch=1" onSignOut={signOut}/></div>
    </header>
    <main className="mx-auto grid max-w-6xl gap-5 px-4 py-6 sm:px-8 sm:py-10 md:grid-cols-[220px_minmax(0,1fr)]">
      <nav aria-label="Account sections" className="h-fit rounded-2xl border border-[#e0e5f1] bg-white p-2 shadow-sm">
        {[["Profile", "/account/profile"], ["Settings", "/account/settings"]].map(([label, href]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={`mb-1 flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold ${pathname === href ? "bg-[#eef1fc] text-[#40599f]" : "text-[#596681] hover:bg-[#f7f8fc]"}`}>{label}<span className="ml-auto">→</span></Link>)}
      </nav>
      <section className="min-w-0"><h1 className="mb-4 text-2xl font-bold tracking-tight">{pathname === "/account/settings" ? "Account settings" : "Your profile"}</h1>{children}</section>
    </main>
  </div></RequireAuth>;
}

import RoleLayout from "./RoleLayout";
import { Suspense } from "react";

export default function AdminLayout({ children }) {
  return <Suspense fallback={null}><RoleLayout role="Administrator" title="Operations center" links={[{ label: "Overview", href: "/admin?tab=overview" }, { label: "Drivers & shifts", href: "/admin?tab=drivers" }, { label: "Routes & alerts", href: "/admin?tab=routes" }, { label: "Bookings & tickets", href: "/admin?tab=bookings" }, { label: "Buses", href: "/admin?tab=buses" }, { label: "Reports", href: "/admin?tab=reports" }, { label: "Settings", href: "/admin?tab=settings" }]}>{children}</RoleLayout></Suspense>;
}

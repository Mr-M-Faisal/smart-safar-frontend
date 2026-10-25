import RoleLayout from "./RoleLayout";
import { Suspense } from "react";

export default function AdminLayout({ children }) {
  return <Suspense fallback={null}><RoleLayout role="Administrator" title="Operations center" links={[{ label: "Dashboard", href: "/admin?tab=overview" }, { label: "Buses", href: "/admin?tab=buses" }, { label: "Routes", href: "/admin?tab=routes" }, { label: "Driver Management", href: "/admin?tab=drivers" }, { label: "Stops", href: "/admin?tab=stops" }, { label: "Alerts", href: "/admin?tab=alerts" }, { label: "Bookings", href: "/admin?tab=bookings" }, { label: "Reports", href: "/admin?tab=reports" }, { label: "Settings", href: "/admin?tab=settings" }]}>{children}</RoleLayout></Suspense>;
}

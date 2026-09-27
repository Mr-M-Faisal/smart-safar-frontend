import RoleLayout from "./RoleLayout";

export default function AdminLayout({ children }) {
  return <RoleLayout role="Administrator" title="Operations center" links={[{ label: "Overview", href: "/admin#overview" }, { label: "Drivers & shifts", href: "/admin#drivers" }, { label: "Routes & alerts", href: "/admin#routes" }, { label: "Bookings & tickets", href: "/admin#bookings" }, { label: "Buses", href: "/admin#buses" }, { label: "Reports", href: "/admin#reports" }]}>{children}</RoleLayout>;
}

import RoleLayout from "./RoleLayout";

export default function DriverLayout({ children }) {
  return <RoleLayout role="Driver" title="Driver workspace" links={[{ label: "My shift", href: "/driver" }]}>{children}</RoleLayout>;
}

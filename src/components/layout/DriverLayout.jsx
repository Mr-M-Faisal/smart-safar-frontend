import RoleLayout from "./RoleLayout";
import { Suspense } from "react";

export default function DriverLayout({ children }) {
  return <Suspense fallback={null}><RoleLayout role="Driver" title="Driver workspace" links={[{ label: "My shift", href: "/driver" }]}>{children}</RoleLayout></Suspense>;
}

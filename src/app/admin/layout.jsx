import AdminLayout from "@/components/layout/AdminLayout";
import { RequireRole } from "@/lib/auth/AuthProvider";

export default function AdminRootLayout({ children }) {
  return <RequireRole roles="admin"><div className="admin-screen-notice">For the full admin workspace, use a larger screen.</div><AdminLayout>{children}</AdminLayout></RequireRole>;
}

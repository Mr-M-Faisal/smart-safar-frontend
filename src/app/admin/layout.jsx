import AdminLayout from "@/components/layout/AdminLayout";
import { RequireRole } from "@/lib/auth/AuthProvider";

export default function AdminRootLayout({ children }) {
  return <RequireRole roles="admin"><AdminLayout>{children}</AdminLayout></RequireRole>;
}

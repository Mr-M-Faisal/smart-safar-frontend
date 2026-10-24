import DriverLayout from "@/components/layout/DriverLayout";
import { RequireRole } from "@/lib/auth/AuthProvider";

export default function DriverRootLayout({ children }) {
  return <RequireRole roles="driver"><DriverLayout>{children}</DriverLayout></RequireRole>;
}

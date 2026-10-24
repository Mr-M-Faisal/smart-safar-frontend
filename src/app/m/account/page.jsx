"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import SettingsScreen from "@/components/app/SettingsScreen";

export default function MobileAccountPage() {
  const auth = useAuth();
  return <SettingsScreen admin={auth.role === "admin"}/>;
}

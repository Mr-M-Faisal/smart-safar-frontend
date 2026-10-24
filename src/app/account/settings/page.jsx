"use client";
import SettingsScreen from "@/components/app/SettingsScreen";
import { useAuth } from "@/lib/auth/AuthProvider";
export default function DesktopSettingsPage() { const auth = useAuth(); return <SettingsScreen admin={auth.role === "admin"} desktop/>; }

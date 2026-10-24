"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import BottomSheet from "@/components/app/BottomSheet";
import { apiRequest } from "@/lib/api";
import { useAuth, updateAuthUser } from "@/lib/auth/AuthProvider";
import { storeCachedProfile, storeRotatedSession } from "@/lib/session";
import { useAppRefresh } from "@/components/app/AppRefreshContext";
import HeroCard from "@/components/ui/brand/HeroCard";
import Surface from "@/components/ui/brand/Surface";

export default function ProfileScreen() {
  const auth = useAuth();
  useAppRefresh(auth.refreshAuth);
  const search = useSearchParams();
  const pathname = usePathname() || "/m/account/profile";
  const accountSettingsHref = pathname.startsWith("/m/") ? (auth.role === "admin" ? "/m/admin/settings" : "/m/account") : "/account/settings";
  const [name, setName] = useState(auth.user?.name || "");
  const [phone, setPhone] = useState(auth.user?.phone || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);

  useEffect(() => {
    if (search.get("password") === "1") setPasswordOpen(true);
  }, [search]);
  useEffect(() => { setName(auth.user?.name || ""); setPhone(auth.user?.phone || ""); }, [auth.user]);

  async function saveProfile(event) {
    event.preventDefault();
    if (busy) return;
    const cleanName = name.trim();
    if (cleanName.length < 2) { setMessage("Enter a name with at least 2 characters."); return; }
    if (phone.trim() && !/^[0-9+()\s-]{6,20}$/.test(phone.trim())) { setMessage("Enter a valid phone number."); return; }
    setBusy(true); setMessage("");
    try {
      const profile = await apiRequest("/auth/profile", { method: "PATCH", token: auth.token, body: JSON.stringify({ name: cleanName, phone: phone.trim() }) });
      storeCachedProfile(profile); updateAuthUser(profile); setMessage("Profile saved.");
    } catch (error) { setMessage(error.message || "Could not save your profile."); }
    finally { setBusy(false); }
  }

  async function changePassword(event) {
    event.preventDefault();
    if (passwordBusy) return;
    if (passwords.newPassword !== passwords.confirm) { setMessage("The new passwords do not match."); return; }
    if (passwords.newPassword.length < 6) { setMessage("Use at least 6 characters for the new password."); return; }
    setPasswordBusy(true); setMessage("");
    try {
      const result = await apiRequest("/auth/change-password", { method: "POST", token: auth.token, body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }) });
      storeRotatedSession(auth.role, result.token, result.refreshToken);
      if (result.profile) { storeCachedProfile(result.profile); updateAuthUser(result.profile, result.token); }
      setPasswords({ currentPassword: "", newPassword: "", confirm: "" });
      setPasswordOpen(false); setMessage("Password changed. Other sessions have been signed out.");
    } catch (error) {
      const friendly = { PASSWORD_LOGIN_UNAVAILABLE: "This account uses Google sign-in and has no password to change.", CURRENT_PASSWORD_INCORRECT: "Your current password is incorrect.", PASSWORD_UNCHANGED: "Choose a password different from your current one." };
      setMessage(friendly[error.code] || error.message || "Could not change your password.");
    } finally { setPasswordBusy(false); }
  }

  const passwordStrength = passwords.newPassword.length < 6 ? "Use at least 6 characters" : passwords.newPassword.length >= 12 && /[A-Z]/.test(passwords.newPassword) && /\d/.test(passwords.newPassword) ? "Strong password" : "Good start — add length, a number, or a capital letter";
  const roleLabel = auth.role === "admin" ? "Administrator" : auth.role === "driver" ? "Driver" : "Passenger";
  const initials = (auth.user?.name || "S").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return <div className="app-screen space-y-4">
    <Link href={accountSettingsHref} className="inline-flex min-h-10 items-center text-xs font-semibold text-[#536bb7]">← Account settings</Link>
    <HeroCard eyebrow="Account profile" title={auth.user?.name || "Smart Safar user"} description={auth.user?.email || "Profile details"} facts={[roleLabel, auth.user?.phone || "Phone not provided"]}><span className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-sm font-bold text-[#a5f1df]">{initials}</span></HeroCard>
    <Surface as="section" className="p-5">
      <form onSubmit={saveProfile} className="grid gap-3">
        <label className="grid gap-1 text-xs font-semibold text-[#596681]">Full name<input required minLength={2} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="app-input"/></label>
        <label className="grid gap-1 text-xs font-semibold text-[#596681]">Phone<input type="tel" inputMode="tel" autoComplete="tel" pattern="[0-9+()\s-]{6,20}" value={phone} onChange={(event) => setPhone(event.target.value)} className="app-input"/></label>
        <label className="grid gap-1 text-xs font-semibold text-[#596681]">Email address<input type="email" value={auth.user?.email || ""} readOnly aria-readonly="true" className="app-input bg-slate-50"/></label>
        <p className="text-[10px] text-[#77829a]">Member since {auth.user?.createdAt ? new Intl.DateTimeFormat("en-PK", { dateStyle: "medium" }).format(new Date(auth.user.createdAt)) : "—"}</p>
        {auth.user?.connectedGoogle && <p className="rounded-xl bg-[#f6f7fb] p-3 text-xs font-medium text-[#596681]">✓ Connected Google account</p>}
        <button disabled={busy} className="app-primary w-full">{busy ? "Saving…" : "Save profile"}</button>
      </form>
      <button type="button" onClick={() => setPasswordOpen(true)} className="mt-3 min-h-12 w-full rounded-xl border border-[#dfe3f1] bg-white text-sm font-semibold text-[#536bb7]">Change password</button>
      {message && <p role="status" className="mt-3 rounded-xl bg-[#f4f6fc] p-3 text-xs text-[#536bb7]">{message}</p>}
    </Surface>
    <BottomSheet open={passwordOpen} title="Change password" onClose={() => setPasswordOpen(false)} dirty={Boolean(passwords.currentPassword || passwords.newPassword || passwords.confirm)}>
      <form data-ss-dirty-form onSubmit={changePassword} className="grid gap-3">
        {["currentPassword", "newPassword", "confirm"].map((field, index) => <label key={field} className="grid gap-1 text-xs font-semibold text-[#596681]">{["Current password", "New password", "Confirm new password"][index]}<input required minLength={index ? 6 : undefined} autoComplete={index ? "new-password" : "current-password"} type={showPasswords ? "text" : "password"} value={passwords[field]} onChange={(event) => setPasswords((current) => ({ ...current, [field]: event.target.value }))} className="app-input"/></label>)}
        <button type="button" onClick={() => setShowPasswords((value) => !value)} className="min-h-10 justify-self-start text-xs font-semibold text-[#536bb7]">{showPasswords ? "Hide passwords" : "Show passwords"}</button>
        <p className="text-[10px] text-[#77829a]">{passwordStrength}</p>
        <button disabled={passwordBusy} className="app-primary w-full">{passwordBusy ? "Updating…" : "Update password"}</button>
      </form>
    </BottomSheet>
  </div>;
}

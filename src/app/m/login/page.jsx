"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { saveSessionToken, storeCachedProfile } from "@/lib/session";
import safeReturnTo from "@/lib/auth/safeReturnTo.cjs";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function MobileLoginPage() {
  const router = useRouter();
  const buttonRef = useRef(null);
  const callbackRef = useRef(null);
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [returnTo, setReturnTo] = useState("/m/trips");

  const finish = useCallback((result) => {
    if (!result?.token || !["commuter", "driver", "admin"].includes(result.role)) { setError("The server returned an invalid account response."); return; }
    saveSessionToken(result.token, result.role, result.refreshToken);
    storeCachedProfile(result);
    const requested = safeReturnTo(returnTo, "/m/trips");
    const destination = result.role === "admin" ? "/admin" : result.role === "driver" ? "/m/driver" : (requested.startsWith("/m/") ? requested : "/m/trips");
    router.replace(destination);
  }, [returnTo, router]);

  const googleLogin = useCallback(async (credential) => {
    if (!credential || busy) return;
    setBusy(true); setError("");
    try { const result = await apiRequest("/auth/google", { method: "POST", body: JSON.stringify({ credential }) }); if (result.role !== "commuter") throw new Error("Google sign-in is for passenger accounts."); finish(result); }
    catch (requestError) { setError(requestError.message || "Google sign-in failed."); }
    finally { setBusy(false); }
  }, [busy, finish]);
  callbackRef.current = googleLogin;

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("returnTo");
    if (requested) setReturnTo(safeReturnTo(requested, "/m/trips"));
  }, []);
  useEffect(() => {
    if (!googleClientId || !googleLoaded || !window.google?.accounts?.id || !buttonRef.current) return;
    buttonRef.current.replaceChildren();
    window.google.accounts.id.initialize({ client_id: googleClientId, callback: (response) => callbackRef.current?.(response.credential) });
    window.google.accounts.id.renderButton(buttonRef.current, { type: "standard", theme: "outline", size: "large", text: "continue_with", shape: "pill", width: 320 });
  }, [googleLoaded, mode]);

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const result = mode === "signup"
        ? await apiRequest("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password, ...(phone.trim() ? { phone } : {}) }) })
        : await apiRequest("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      finish(result);
    } catch (requestError) { setError(requestError.message || "Sign-in failed. Check your details and try again."); }
    finally { setBusy(false); }
  }

  return <div className="app-screen">
    {googleClientId && <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setGoogleLoaded(true)} />}
    <section className="app-card mx-auto max-w-md p-5">
      <p className="app-eyebrow">Passenger access</p><h2 className="mt-2 text-xl font-bold text-[#293553]">{mode === "signup" ? "Create your account" : "Welcome back"}</h2><p className="app-muted mt-1">Sign in to book seats and manage your journeys.</p>
      {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}
      <form className="mt-5 grid gap-3" onSubmit={submit}>
        {mode === "signup" && <><label className="grid gap-1 text-xs font-semibold text-[#596681]">Full name<input autoComplete="name" required className="app-input" value={name} onChange={(event) => setName(event.target.value)} /></label><label className="grid gap-1 text-xs font-semibold text-[#596681]">Phone (optional)<input autoComplete="tel" className="app-input" value={phone} onChange={(event) => setPhone(event.target.value)} /></label></>}
        <label className="grid gap-1 text-xs font-semibold text-[#596681]">Email address<input type="email" autoComplete="email" required className="app-input" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label className="grid gap-1 text-xs font-semibold text-[#596681]">Password<input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={mode === "signup" ? 8 : undefined} required className="app-input" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <button disabled={busy} className="app-primary mt-1 w-full">{busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}</button>
      </form>
      {googleClientId && <><div className="my-4 text-center text-[10px] text-[#8992a8]">OR CONTINUE WITH</div><div className="flex justify-center" ref={buttonRef}/></>}
      <p className="mt-5 text-center text-xs text-[#77829a]">{mode === "signup" ? "Already have an account?" : "New to Smart Safar?"} <button className="font-bold text-[#536bb7]" onClick={() => setMode((value) => value === "signup" ? "login" : "signup")}>{mode === "signup" ? "Sign in" : "Create account"}</button></p>
    </section>
    <Link href="/m/routes" className="mx-auto mt-4 block w-fit min-h-11 content-center text-xs font-bold text-[#536bb7]">Continue browsing routes →</Link>
  </div>;
}

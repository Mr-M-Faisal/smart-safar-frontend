"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import BrandMark from "@/components/layout/BrandMark";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { clearSessionToken, saveSessionToken } from "@/lib/session";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function LoginPage() {
  const router = useRouter();
  const googleButtonRef = useRef(null);
  const googleCallbackRef = useRef(null);
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [testRole, setTestRole] = useState("driver");
  const testLoginEnabled = process.env.NEXT_PUBLIC_ENABLE_LOCAL_TEST_LOGIN === "true";

  const finishSignIn = useCallback((result) => {
    if (!result?.token || !["commuter", "driver", "admin"].includes(result.role)) {
      clearSessionToken();
      setError("The server returned an invalid account response. Please try again.");
      return;
    }
    saveSessionToken(result.token);
    const params = new URLSearchParams(window.location.search);
    const requestedBookingRoute = params.get("bookingRoute");
    const commuterDestination = requestedBookingRoute ? `/passenger?routeId=${encodeURIComponent(requestedBookingRoute)}#booking` : params.get("booking") === "1" ? "/passenger#booking" : "/passenger";
    router.replace(result.role === "admin" ? "/admin" : result.role === "driver" ? "/driver" : commuterDestination);
  }, [router]);

  const handleGoogleCredential = useCallback(async (credential) => {
    if (!credential || submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const result = await apiRequest("/auth/google", { method: "POST", body: JSON.stringify({ credential }) });
      if (result.role !== "commuter") throw new Error("Google sign-in is available for passenger accounts only.");
      finishSignIn(result);
    } catch (requestError) {
      setError(requestError.message || "Google sign-in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [finishSignIn, submitting]);
  googleCallbackRef.current = handleGoogleCredential;

  useEffect(() => {
    if (!googleClientId || !googleLoaded || !window.google?.accounts?.id || !googleButtonRef.current) return;
    googleButtonRef.current.replaceChildren();
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response) => googleCallbackRef.current?.(response.credential),
    });
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      type: "standard", theme: "outline", size: "large", text: "continue_with", shape: "pill", width: Math.min(360, Math.floor(googleButtonRef.current.getBoundingClientRect().width || 320)),
    });
  }, [googleLoaded, mode]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = mode === "signup"
        ? await apiRequest("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password, ...(phone.trim() ? { phone } : {}) }) })
        : await apiRequest("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      finishSignIn(result);
    } catch (requestError) {
      setError(requestError.message || (mode === "signup" ? "Could not create your passenger account." : "Sign-in failed. Check your credentials."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLocalTestLogin(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await apiRequest("/auth/dev-login", { method: "POST", body: JSON.stringify({ role: testRole, username: email, password }) });
      finishSignIn(result);
    } catch (requestError) {
      setError(requestError.message || "Local test access is unavailable. Enable it on the development backend.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {googleClientId && <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setGoogleLoaded(true)} />}
      <main className="relative min-h-[78vh] overflow-hidden bg-[radial-gradient(circle_at_10%_15%,#dce5fb,transparent_35%),linear-gradient(145deg,#f4f5fb,#e8ecf8)] px-4 py-10 text-[#25304f] sm:px-8 sm:py-14">
        <div className="pointer-events-none absolute -right-24 top-20 h-72 w-72 rounded-full bg-[#b7c5ed]/40 blur-3xl" />
        <div className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/25 shadow-[0_24px_70px_rgba(53,67,112,.18)] backdrop-blur-xl md:grid-cols-[.9fr_1.1fr]">
          <section className="relative isolate flex min-h-72 flex-col justify-between overflow-hidden p-7 text-white sm:p-9 md:min-h-[610px]">
            <img src="/images/faisalabad-clock-tower.jpg" alt="Ghanta Ghar Clock Tower in Faisalabad at sunset" className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#101d3c]/95 via-[#18284e]/55 to-[#233868]/35" />
            <Link href="/" className="inline-flex w-fit items-center gap-3 text-sm font-bold"><BrandMark size="sm" tone="dark" />Smart Safar</Link>
            <div className="mt-10"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#a8efdf]">Faisalabad transit</p><h1 className="mt-3 max-w-sm text-3xl font-semibold tracking-tight sm:text-4xl">Find your way through the city.</h1><p className="mt-4 max-w-sm text-sm leading-6 text-white/85">Explore a route first. When you are ready to reserve a seat, sign in and continue your booking.</p></div>
            <p className="mt-8 text-xs text-white/55">Smart Safar · Public transit</p>
          </section>

          <section className="bg-white/75 p-6 backdrop-blur-2xl sm:p-10 md:p-12">
            <div className="max-w-md"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#536bb7]">Passenger access</p><h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#25304f] sm:text-3xl">{mode === "signup" ? "Create your account" : "Welcome back"}</h2><p className="mt-2 text-sm leading-6 text-[#68738e]">{mode === "signup" ? "Create a passenger account to book and manage your rides." : "Sign in to manage bookings and passenger features."}</p></div>

            <form onSubmit={handleSubmit} className="mt-7 max-w-md space-y-4">
              {mode === "signup" && <>
                <label className="block"><span className="text-xs font-semibold text-[#4b5877]">Full name</span><input required minLength={2} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="mt-2 min-h-12 w-full rounded-xl border border-[#dfe3f1] bg-[#fbfcff] px-4 text-sm outline-none transition placeholder:text-[#a1a9bc] focus:border-[#8093d1] focus:bg-white focus:ring-4 focus:ring-[#536bb7]/10" /></label>
                <label className="block"><span className="text-xs font-semibold text-[#4b5877]">Phone <span className="font-normal text-[#8992a8]">· optional</span></span><input type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="03xx xxxxxxx" className="mt-2 min-h-12 w-full rounded-xl border border-[#dfe3f1] bg-[#fbfcff] px-4 text-sm outline-none transition placeholder:text-[#a1a9bc] focus:border-[#8093d1] focus:bg-white focus:ring-4 focus:ring-[#536bb7]/10" /></label>
              </>}
              <label className="block"><span className="text-xs font-semibold text-[#4b5877]">Email address</span><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 min-h-12 w-full rounded-xl border border-[#dfe3f1] bg-[#fbfcff] px-4 text-sm outline-none transition placeholder:text-[#a1a9bc] focus:border-[#8093d1] focus:bg-white focus:ring-4 focus:ring-[#536bb7]/10" /></label>
              <label className="block"><span className="text-xs font-semibold text-[#4b5877]">Password</span><input required minLength={mode === "signup" ? 6 : undefined} type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "signup" ? "At least 6 characters" : "Enter your password"} className="mt-2 min-h-12 w-full rounded-xl border border-[#dfe3f1] bg-[#fbfcff] px-4 text-sm outline-none transition placeholder:text-[#a1a9bc] focus:border-[#8093d1] focus:bg-white focus:ring-4 focus:ring-[#536bb7]/10" /></label>
              {error && <p role="alert" className="rounded-xl border border-[#f1c9c2] bg-[#fff5f2] px-4 py-3 text-sm leading-5 text-[#9a5146]">{error}</p>}
              <button disabled={submitting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#536bb7] px-5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(83,107,183,.2)] transition hover:-translate-y-0.5 hover:bg-[#43599f] disabled:cursor-wait disabled:opacity-65">{submitting ? (mode === "signup" ? "Creating account…" : "Signing in…") : (mode === "signup" ? "Create passenger account" : "Sign in")}<span aria-hidden="true">→</span></button>
            </form>

            <div className="my-5 flex max-w-md items-center gap-3 text-[10px] font-medium uppercase tracking-[.14em] text-[#9aa3b7]"><span className="h-px flex-1 bg-[#e8eaf2]"/>or<span className="h-px flex-1 bg-[#e8eaf2]"/></div>
            {googleClientId ? <div ref={googleButtonRef} className="min-h-11 w-full max-w-md" aria-label="Continue with Google"/> : <button type="button" disabled className="flex min-h-12 w-full max-w-md items-center justify-center gap-3 rounded-xl border border-[#dfe3f1] bg-[#f8f9fc] px-4 text-sm font-semibold text-[#7d88a1] disabled:cursor-not-allowed"><span className="grid h-5 w-5 place-items-center rounded-full bg-white font-bold text-[#4285f4] shadow-sm" aria-hidden="true">G</span>Continue with Google</button>}
            {!googleClientId && <p className="mt-2 max-w-md text-[10px] leading-4 text-[#8992a8]">Google sign-in needs the same Web Client ID configured in the frontend and backend. Until then, use email and password.</p>}
            {googleClientId && !googleLoaded && <p className="mt-2 text-[10px] text-[#8992a8]">Loading Google sign-in…</p>}

            <p className="mt-6 max-w-md text-sm text-[#68738e]">{mode === "signup" ? "Already have a passenger account?" : "New to Smart Safar?"} <button type="button" onClick={() => { setError(""); setMode(mode === "signup" ? "login" : "signup"); }} className="font-semibold text-[#536bb7] underline decoration-[#b9c5eb] underline-offset-4 hover:text-[#43599f]">{mode === "signup" ? "Sign in" : "Create account"}</button></p>
            <p className="mt-5 max-w-md text-[10px] leading-4 text-[#8992a8]">Driver and administrator accounts are provisioned by the transit administrator and use the same sign-in form.</p>
            {testLoginEnabled && mode === "login" && <form onSubmit={handleLocalTestLogin} className="mt-6 max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-bold text-amber-900">Local testing only</p><p className="mt-1 text-[11px] leading-5 text-amber-800">Use any text in the email and password fields above, choose a workspace, then start a local demo session. This option is available only when explicitly enabled on the development frontend and backend.</p><div className="mt-3 flex gap-2"><select aria-label="Test workspace" value={testRole} onChange={(event) => setTestRole(event.target.value)} className="min-h-10 flex-1 rounded-lg border border-amber-200 bg-white px-3 text-xs text-[#34405d]"><option value="driver">Driver</option><option value="admin">Administrator</option></select><button disabled={submitting || !email.trim() || !password} className="min-h-10 rounded-lg bg-amber-800 px-4 text-xs font-semibold text-white disabled:opacity-50">{submitting ? "Opening…" : "Open test workspace"}</button></div></form>}
          </section>
        </div>
      </main>
    </>
  );
}

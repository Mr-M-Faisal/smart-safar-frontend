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
      setError("The server returned an invalid account response. Please try again.");
      return;
    }
    saveSessionToken(result.token, result.role, result.refreshToken);
    const params = new URLSearchParams(window.location.search);
    const requestedBookingRoute = params.get("bookingRoute") || params.get("route");
    const requestedBookingBus = params.get("bookingBus") || params.get("bus");
    const requestedBookingSeat = params.get("bookingSeat") || params.get("seat");
    const requestedReturnTo = params.get("returnTo");
    const commuterDestination = requestedBookingRoute ? `/passenger?route=${encodeURIComponent(requestedBookingRoute)}${requestedBookingBus ? `&bus=${encodeURIComponent(requestedBookingBus)}` : ""}${requestedBookingSeat ? `&seat=${encodeURIComponent(requestedBookingSeat)}` : ""}#booking` : params.get("booking") === "1" ? "/passenger#booking" : "/passenger";
    const safeReturnTo = requestedReturnTo?.startsWith("/") && !requestedReturnTo.startsWith("//") && !requestedReturnTo.startsWith("/login") ? requestedReturnTo : null;
    router.replace(result.role === "admin" ? "/admin" : result.role === "driver" ? "/driver" : safeReturnTo || commuterDestination);
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
      <div className="p-4 max-w-sm mx-auto flex flex-col min-h-full justify-center pb-8 pt-4">
        {/* Mobile Header Banner */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <BrandMark size="sm" tone="light" />
            <span className="text-base font-bold text-[#111d3d]">Smart Safar</span>
          </Link>
          <h1 className="text-xl font-bold text-[#111d3d]">
            {mode === "signup" ? "Create passenger account" : "Welcome back"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {mode === "signup"
              ? "Reserve seats and manage your transit trips"
              : "Sign in with your email and password"}
          </p>
        </div>

        {/* Auth Form with 16px font inputs */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <>
              <label className="block">
                <span className="text-[11px] font-bold uppercase text-slate-500">Full name</span>
                <input
                  required
                  minLength={2}
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  className="mt-1 h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base text-[#111d3d] outline-none focus:border-[#536bb7] shadow-2xs"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-bold uppercase text-slate-500">Phone (optional)</span>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="0300 1234567"
                  className="mt-1 h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base text-[#111d3d] outline-none focus:border-[#536bb7] shadow-2xs"
                />
              </label>
            </>
          )}

          <label className="block">
            <span className="text-[11px] font-bold uppercase text-slate-500">Email address</span>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-1 h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base text-[#111d3d] outline-none focus:border-[#536bb7] shadow-2xs"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-bold uppercase text-slate-500">Password</span>
            <input
              required
              minLength={mode === "signup" ? 6 : undefined}
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="mt-1 h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base text-[#111d3d] outline-none focus:border-[#536bb7] shadow-2xs"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </p>
          )}

          <button
            disabled={submitting}
            className="mt-2 h-12 w-full rounded-xl bg-[#536bb7] text-sm font-bold text-white shadow-xs active:bg-[#43599f] disabled:opacity-50"
          >
            {submitting ? "Signing in..." : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setError("");
              setMode(mode === "signup" ? "login" : "signup");
            }}
            className="text-xs font-semibold text-[#536bb7] active:opacity-75"
          >
            {mode === "signup" ? "Already have an account? Sign in" : "New commuter? Create account"}
          </button>
        </div>

        {/* Test login support if enabled */}
        {testLoginEnabled && mode === "login" && (
          <form onSubmit={handleLocalTestLogin} className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs">
            <p className="font-bold text-amber-900">Dev Test Mode</p>
            <div className="mt-2 flex gap-2">
              <select
                aria-label="Test workspace"
                value={testRole}
                onChange={(e) => setTestRole(e.target.value)}
                className="h-10 flex-1 rounded-lg border border-amber-200 bg-white px-2.5 text-xs text-slate-700"
              >
                <option value="driver">Driver</option>
                <option value="admin">Administrator</option>
                <option value="commuter">Passenger</option>
              </select>
              <button
                disabled={submitting}
                className="h-10 rounded-lg bg-amber-800 px-3 font-semibold text-white active:bg-amber-900"
              >
                Open role
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

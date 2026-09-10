"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

type Mode = "password" | "otp-email" | "otp-code" | "set-password";

export default function LoginPage() {
  const router = useRouter();
  const { requestOtp, verifyOtp, login, setPassword } = useAuth();

  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPasswordInput] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function goToOtp(withNotice?: string) {
    setError(null);
    setNotice(withNotice ?? null);
    setMode("otp-email");
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.message === "PASSWORD_NOT_SET") {
        setBusy(true);
        try {
          const res = await requestOtp(email, name || undefined);
          setDevCode(res.dev_code);
          setNotice("First time signing in — we've emailed you a code to verify your account.");
          setMode("otp-code");
        } catch (otpErr) {
          setError(otpErr instanceof ApiError ? otpErr.message : "Could not send code");
        }
      } else {
        setError(err instanceof ApiError ? err.message : "Invalid email or password");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await requestOtp(email, name || undefined);
      setDevCode(res.dev_code);
      setMode("otp-code");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send code");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const user = await verifyOtp(email, code, name || undefined);
      if (!user.has_password) {
        setNotice(null);
        setMode("set-password");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setBusy(true);
    try {
      await setPassword(newPassword);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not set password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-50 p-4">
      <div className="w-full max-w-sm rounded-4xl bg-gradient-to-br from-brand-500 to-brand-800 p-8 text-white shadow-panel">
        <Link href="/" className="text-xs font-medium text-white/70 hover:text-white">
          ← Back to calendar
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Log in to AdmissionMate</h1>
        <p className="mt-1 text-sm text-white/70">
          {mode === "password" && "Enter your email and password."}
          {mode === "otp-email" && "We'll email you a one-time code."}
          {mode === "otp-code" && `Enter the code sent to ${email}.`}
          {mode === "set-password" && "Almost done — create a password for next time."}
        </p>

        {notice && <p className="mt-4 rounded-xl bg-white/10 px-3 py-2 text-sm text-white/80">{notice}</p>}
        {error && <p className="mt-4 rounded-xl bg-red-500/20 px-3 py-2 text-sm text-red-100">{error}</p>}

        {mode === "password" && (
          <form className="mt-6 flex flex-col gap-3" onSubmit={handlePasswordLogin}>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-2xl bg-white/15 px-4 py-3 text-sm placeholder-white/50 outline-none ring-white/30 focus:ring-2"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="rounded-2xl bg-white/15 px-4 py-3 text-sm placeholder-white/50 outline-none ring-white/30 focus:ring-2"
            />
            <button
              type="submit"
              disabled={busy}
              className="mt-2 rounded-full bg-accent-400 px-5 py-3 text-sm font-semibold text-brand-950 shadow-card transition hover:bg-accent-300 disabled:opacity-60"
            >
              {busy ? "Please wait…" : "Log in"}
            </button>
            <div className="mt-1 flex items-center justify-between text-xs">
              <button type="button" onClick={() => goToOtp()} className="font-medium text-white/70 hover:text-white">
                Forgot password?
              </button>
              <button type="button" onClick={() => goToOtp()} className="font-medium text-white/70 hover:text-white">
                First time? Verify by email
              </button>
            </div>
          </form>
        )}

        {mode === "otp-email" && (
          <form className="mt-6 flex flex-col gap-3" onSubmit={handleRequestOtp}>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-2xl bg-white/15 px-4 py-3 text-sm placeholder-white/50 outline-none ring-white/30 focus:ring-2"
            />
            <input
              type="text"
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-2xl bg-white/15 px-4 py-3 text-sm placeholder-white/50 outline-none ring-white/30 focus:ring-2"
            />
            <button
              type="submit"
              disabled={busy}
              className="mt-2 rounded-full bg-accent-400 px-5 py-3 text-sm font-semibold text-brand-950 shadow-card transition hover:bg-accent-300 disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send code"}
            </button>
            <button
              type="button"
              onClick={() => setMode("password")}
              className="text-xs font-medium text-white/70 hover:text-white"
            >
              ← Back to password login
            </button>
          </form>
        )}

        {mode === "otp-code" && (
          <form className="mt-6 flex flex-col gap-3" onSubmit={handleVerify}>
            {devCode && (
              <p className="rounded-xl bg-white/10 px-3 py-2 text-xs text-white/70">
                Dev mode: your code is <span className="font-mono font-semibold text-white">{devCode}</span>
              </p>
            )}
            <input
              type="text"
              required
              inputMode="numeric"
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="rounded-2xl bg-white/15 px-4 py-3 text-center text-lg tracking-[0.5em] placeholder-white/50 outline-none ring-white/30 focus:ring-2"
            />
            <button
              type="submit"
              disabled={busy}
              className="mt-2 rounded-full bg-accent-400 px-5 py-3 text-sm font-semibold text-brand-950 shadow-card transition hover:bg-accent-300 disabled:opacity-60"
            >
              {busy ? "Verifying…" : "Verify & continue"}
            </button>
            <button
              type="button"
              onClick={() => setMode("otp-email")}
              className="text-xs font-medium text-white/70 hover:text-white"
            >
              Use a different email
            </button>
          </form>
        )}

        {mode === "set-password" && (
          <form className="mt-6 flex flex-col gap-3" onSubmit={handleSetPassword}>
            <input
              type="password"
              required
              placeholder="New password (min. 8 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="rounded-2xl bg-white/15 px-4 py-3 text-sm placeholder-white/50 outline-none ring-white/30 focus:ring-2"
            />
            <input
              type="password"
              required
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="rounded-2xl bg-white/15 px-4 py-3 text-sm placeholder-white/50 outline-none ring-white/30 focus:ring-2"
            />
            <button
              type="submit"
              disabled={busy}
              className="mt-2 rounded-full bg-accent-400 px-5 py-3 text-sm font-semibold text-brand-950 shadow-card transition hover:bg-accent-300 disabled:opacity-60"
            >
              {busy ? "Saving…" : "Set password & continue"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";

type Mode = "password" | "otp-email" | "otp-code" | "set-password";

export default function LoginPage() {
  const router = useRouter();
  const { requestOtp, verifyOtp, login, setPassword } = useAuth();

  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPasswordInput] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const passwordChecks = {
    minLength: newPassword.length >= 8,
    hasLower: /[a-z]/.test(newPassword),
    hasUpper: /[A-Z]/.test(newPassword),
    hasNumberAndSpecial: /\d/.test(newPassword) && /[^A-Za-z0-9\s]/.test(newPassword),
    matches: newPassword.length > 0 && newPassword === confirmPassword,
  };
  const passwordIsValid = Object.values(passwordChecks).every(Boolean);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError && err.message === "PASSWORD_NOT_SET") {
        try {
          const res = await requestOtp(email);
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
      const res = await requestOtp(email);
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
      const user = await verifyOtp(email, code);
      if (!user.has_password) {
        setNotice(null);
        setMode("set-password");
      } else {
        router.push("/");
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
    if (!passwordIsValid) {
      setError("Please meet all password requirements");
      return;
    }
    setBusy(true);
    try {
      await setPassword(newPassword);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not set password");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "set-password") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-panel dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`h-1 w-8 rounded-full ${
                    i < 2 ? "bg-slate-900 dark:bg-white" : "bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              ))}
            </div>
            <ThemeToggle variant="header" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">Create a password</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create a strong password to finish set up.</p>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </p>
          )}

          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSetPassword}>
            <label className="flex flex-col gap-1.5 text-sm text-slate-600 dark:text-slate-300">
              Password
              <PasswordField
                value={newPassword}
                onChange={setNewPassword}
                show={showNewPassword}
                onToggleShow={() => setShowNewPassword((v) => !v)}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-slate-600 dark:text-slate-300">
              Re-enter password
              <PasswordField
                value={confirmPassword}
                onChange={setConfirmPassword}
                show={showConfirmPassword}
                onToggleShow={() => setShowConfirmPassword((v) => !v)}
              />
            </label>

            <ul className="flex flex-col gap-1.5 text-sm">
              <RequirementRow met={passwordChecks.minLength} label="Minimum 8 characters" />
              <RequirementRow met={passwordChecks.hasLower} label="At least 1 lower case letter" />
              <RequirementRow met={passwordChecks.hasUpper} label="At least 1 upper case letter" />
              <RequirementRow
                met={passwordChecks.hasNumberAndSpecial}
                label="At least 1 number and 1 special character, excluding spaces"
              />
              <RequirementRow met={passwordChecks.matches} label="Passwords must match" />
            </ul>

            <button
              type="submit"
              disabled={busy || !passwordIsValid}
              className="mt-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {busy ? "Saving…" : "Continue"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-50 p-4 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-4xl bg-gradient-to-br from-brand-500 to-brand-800 p-8 text-white shadow-panel dark:from-indigo-500 dark:via-violet-600 dark:to-slate-900">
        <div className="flex items-start justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-white/70">AdmissionMate</p>
          <ThemeToggle variant="header" />
        </div>
        <h1 className="mt-2 text-2xl font-bold">Admin sign in</h1>
        <p className="mt-1 text-sm text-white/70">
          {mode === "password" && "Enter your admin email and password."}
          {mode === "otp-email" && "We'll email you a one-time code."}
          {mode === "otp-code" && `Enter the code sent to ${email}.`}
        </p>

        {notice && <p className="mt-4 rounded-xl bg-white/10 px-3 py-2 text-sm text-white/80">{notice}</p>}
        {error && <p className="mt-4 rounded-xl bg-red-500/20 px-3 py-2 text-sm text-red-100">{error}</p>}

        {mode === "password" && (
          <form className="mt-6 flex flex-col gap-3" onSubmit={handlePasswordLogin}>
            <input
              type="email"
              required
              placeholder="admin@example.com"
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
              <button
                type="button"
                onClick={() => setMode("otp-email")}
                className="font-medium text-white/70 hover:text-white"
              >
                Forgot password?
              </button>
              <button
                type="button"
                onClick={() => setMode("otp-email")}
                className="font-medium text-white/70 hover:text-white"
              >
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
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

      </div>
    </main>
  );
}

function RequirementRow({ met, label }: { met: boolean; label: string }) {
  return (
    <li
      className={`flex items-start gap-2 ${
        met ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"
      }`}
    >
      <svg viewBox="0 0 20 20" fill="none" className="mt-0.5 h-4 w-4 shrink-0">
        <circle cx="10" cy="10" r="9" className={met ? "fill-emerald-100 dark:fill-emerald-500/20" : "fill-slate-100 dark:fill-slate-800"} />
        <path
          d="M6 10.5l2.5 2.5L14 7.5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </li>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M6.6 6.6C4.2 8.1 2 12 2 12s3.5 7 10 7c1.9 0 3.5-.5 4.9-1.3M9.9 4.2A10.6 10.6 0 0 1 12 4c6.5 0 10 7 10 7-.5 1-1.3 2.2-2.4 3.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PasswordField({
  value,
  onChange,
  show,
  onToggleShow,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
}) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500"
      />
      <button
        type="button"
        onClick={onToggleShow}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
      >
        <EyeIcon open={show} />
      </button>
    </div>
  );
}

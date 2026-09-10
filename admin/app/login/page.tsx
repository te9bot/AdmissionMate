"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

type Step = "email" | "code";

export default function LoginPage() {
  const router = useRouter();
  const { requestOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await requestOtp(email);
      setDevCode(res.dev_code);
      setStep("code");
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
      await verifyOtp(email, code);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-50 p-4">
      <div className="w-full max-w-sm rounded-4xl bg-gradient-to-br from-brand-500 to-brand-800 p-8 text-white shadow-panel">
        <p className="text-xs font-medium uppercase tracking-wide text-white/70">AdmissionMate</p>
        <h1 className="mt-2 text-2xl font-bold">Admin sign in</h1>
        <p className="mt-1 text-sm text-white/70">
          {step === "email" ? "We'll email you a one-time code." : `Enter the code sent to ${email}.`}
        </p>

        {error && <p className="mt-4 rounded-xl bg-red-500/20 px-3 py-2 text-sm text-red-100">{error}</p>}

        {step === "email" ? (
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
          </form>
        ) : (
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
              {busy ? "Verifying…" : "Verify & log in"}
            </button>
            <button
              type="button"
              onClick={() => setStep("email")}
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

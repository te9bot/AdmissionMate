"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { LogoutIcon, ShieldIcon } from "@/components/icons";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "admin") router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-50">
        <p className="text-sm text-brand-700">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between rounded-3xl bg-gradient-to-r from-brand-500 to-brand-800 px-5 py-4 text-white shadow-panel">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/70">
              <ShieldIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-white/70">AdmissionMate</p>
              <p className="text-sm font-semibold">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-white/80 sm:inline">{user.email}</span>
            <button
              onClick={logout}
              aria-label="Log out"
              className="flex h-9 w-9 items-center justify-center rounded-2xl text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <LogoutIcon className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="mt-6">{children}</main>
      </div>
    </div>
  );
}

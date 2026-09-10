"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ActivityIcon, CalendarIcon, GridIcon, LogoutIcon, ShieldIcon, UsersIcon } from "@/components/icons";

const NAV_ITEMS = [
  { href: "#overview", label: "Overview", Icon: GridIcon },
  { href: "#exams", label: "Exams", Icon: CalendarIcon },
  { href: "#users", label: "Users", Icon: UsersIcon },
  { href: "#audit", label: "Audit log", Icon: ActivityIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "admin") router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-50 dark:bg-slate-950">
        <p className="text-sm text-brand-700 dark:text-slate-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-50 dark:bg-slate-950">
      <div className="mx-auto flex max-w-7xl gap-4 p-4 sm:p-6">
        <aside className="hidden w-56 shrink-0 flex-col gap-6 rounded-4xl bg-gradient-to-b from-brand-500 to-brand-800 py-6 shadow-panel sm:flex dark:from-slate-900 dark:to-slate-950 dark:shadow-none dark:ring-1 dark:ring-white/10">
          <div className="flex items-center gap-2.5 px-6">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white/70">
              <ShieldIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-white/70">AdmissionMate</p>
              <p className="text-sm font-semibold text-white">Admin</p>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1 px-3">
            {NAV_ITEMS.map(({ href, label, Icon }) => (
              <a
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                <Icon className="h-4 w-4" />
                {label}
              </a>
            ))}
          </nav>

          <div className="px-3">
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              <LogoutIcon className="h-4 w-4" />
              Log out
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-between rounded-3xl bg-gradient-to-r from-brand-500 to-brand-800 px-5 py-4 text-white shadow-panel sm:hidden dark:from-slate-900 dark:to-slate-950 dark:shadow-none dark:ring-1 dark:ring-white/10">
            <div className="flex items-center gap-3">
              <ShieldIcon className="h-5 w-5 text-white" />
              <p className="text-sm font-semibold">Admin Dashboard</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle variant="header" />
              <button onClick={logout} aria-label="Log out" className="flex h-9 w-9 items-center justify-center rounded-2xl text-white/80 hover:bg-white/10 hover:text-white">
                <LogoutIcon className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="mb-4 mt-4 hidden items-center justify-between sm:mt-0 sm:flex">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-brand-500 dark:text-slate-400">Welcome back</p>
              <p className="text-lg font-semibold text-brand-950 dark:text-slate-50">{user.email}</p>
            </div>
            <ThemeToggle />
          </div>

          <main className="flex flex-col gap-6 sm:mt-0">{children}</main>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/lib/auth";

export function AppShell({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (requireAdmin && user.role !== "admin") router.replace("/dashboard");
  }, [loading, user, requireAdmin, router]);

  if (loading || !user || (requireAdmin && user.role !== "admin")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-50">
        <p className="text-sm text-brand-700">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-50 p-4 sm:p-6">
      <div className="mx-auto flex max-w-7xl gap-4">
        <div className="hidden sm:block">
          <Sidebar />
        </div>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

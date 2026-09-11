"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CountdownClock } from "@/components/CountdownClock";
import { ExamCard } from "@/components/ExamCard";
import { Parallax } from "@/components/Parallax";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { useInfiniteReveal } from "@/lib/useInfiniteReveal";
import { EXAM_CATEGORIES, type Exam, type ExamCategory } from "@/lib/types";

type Filter = ExamCategory | "all";

export default function PublicCalendarPage() {
  const { user, loading } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setFetching(true);
    api
      .get<Exam[]>(filter === "all" ? "/exams" : `/exams?category=${filter}`)
      .then((data) => !cancelled && setExams(data))
      .catch((err) => !cancelled && setError(err instanceof ApiError ? err.message : "Failed to load exams"))
      .finally(() => !cancelled && setFetching(false));
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const nearest = useMemo(() => {
    const upcoming = exams.filter((e) => e.days_left >= 0).sort((a, b) => a.days_left - b.days_left);
    return upcoming[0];
  }, [exams]);

  const { visibleCount, sentinelRef, hasMore } = useInfiniteReveal(exams.length, 6);

  return (
    <main className="min-h-screen bg-brand-50 p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <section className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 p-6 text-white shadow-panel sm:p-10">
          <Parallax speed={0.2} className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-400/20 blur-3xl" />
          <Parallax speed={0.12} className="pointer-events-none absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-white/70">AdmissionMate</p>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Exam Calendar</h1>
              <p className="mt-2 max-w-md text-sm text-white/80">
                Live countdowns for HSC, SSC, and admission tests. No login needed to browse.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs font-medium text-white/70">Exams tracked</p>
                <p className="text-2xl font-semibold">{exams.length}</p>
              </div>
              {!loading &&
                (user ? (
                  <Link
                    href="/dashboard"
                    className="rounded-full bg-brand-950 px-5 py-2.5 text-sm font-semibold shadow-card transition hover:bg-brand-900"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="rounded-full bg-brand-950 px-5 py-2.5 text-sm font-semibold shadow-card transition hover:bg-brand-900"
                  >
                    Log in
                  </Link>
                ))}
            </div>
          </div>

          {nearest && (
            <div className="relative mt-8 flex flex-col items-start gap-4 rounded-3xl bg-black/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-white/60">Next up</p>
                <p className="mt-1 text-base font-semibold">{nearest.title}</p>
              </div>
              <CountdownClock targetDate={nearest.exam_date} />
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-2">
            <FilterChip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
            {EXAM_CATEGORIES.map((c) => (
              <FilterChip key={c.value} label={c.label} active={filter === c.value} onClick={() => setFilter(c.value)} />
            ))}
          </div>
        </section>

        <section className="mt-8">
          {error && <p className="rounded-2xl bg-red-100 p-4 text-sm text-red-700">{error}</p>}
          {!error && fetching && <p className="text-sm text-brand-700">Loading exams…</p>}
          {!error && !fetching && exams.length === 0 && (
            <p className="rounded-2xl bg-white p-6 text-sm text-brand-700 shadow-card">
              No exams in this category yet. Check back soon.
            </p>
          )}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {exams.slice(0, visibleCount).map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-6">
              <p className="text-xs text-brand-500">Loading more…</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active ? "bg-accent-400 text-brand-950" : "bg-white/15 text-white/80 hover:bg-white/25"
      }`}
    >
      {label}
    </button>
  );
}

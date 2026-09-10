"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StatTile } from "@/components/StatTile";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useInfiniteReveal } from "@/lib/useInfiniteReveal";
import { CATEGORY_STYLES, EXAM_CATEGORIES, type AuditLogEntry, type Exam, type ExamCategory, type User } from "@/lib/types";
import { ActivityIcon, CalendarIcon, UsersIcon } from "@/components/icons";

export default function AdminDashboardPage() {
  const { accessToken } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ExamCategory>("hsc");
  const [examDate, setExamDate] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  function refresh() {
    if (!accessToken) return;
    api.get<Exam[]>("/exams").then(setExams).catch(() => {});
    api.get<User[]>("/admin/users", accessToken).then(setUsers).catch(() => {});
    api.get<AuditLogEntry[]>("/admin/audit-logs", accessToken).then(setAuditLogs).catch(() => {});
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const activeUsers = useMemo(() => users.filter((u) => u.is_active).length, [users]);
  const examsReveal = useInfiniteReveal(exams.length, 10);
  const usersReveal = useInfiniteReveal(users.length, 10);

  async function handleCreateExam(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setError(null);
    setCreating(true);
    try {
      await api.post(
        "/admin/exams",
        { title, category, exam_date: examDate, description: description || null },
        accessToken
      );
      setTitle("");
      setExamDate("");
      setDescription("");
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create exam");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteExam(examId: string) {
    if (!accessToken) return;
    await api.delete(`/admin/exams/${examId}`, accessToken);
    refresh();
  }

  async function handleResend(examId: string) {
    if (!accessToken) return;
    await api.post(`/admin/exams/${examId}/resend-notifications`, undefined, accessToken);
  }

  async function handleToggleUser(user: User) {
    if (!accessToken) return;
    await api.patch(`/admin/users/${user.id}`, { is_active: !user.is_active }, accessToken);
    refresh();
  }

  return (
    <AppShell>
      <section id="overview" className="scroll-mt-6 rounded-4xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 p-6 text-white shadow-panel sm:p-8 dark:from-indigo-500 dark:via-violet-600 dark:to-slate-900">
        <p className="text-sm font-medium uppercase tracking-wide text-white/70">Admin</p>
        <h1 className="mt-2 text-3xl font-bold">Manage exams &amp; users</h1>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Total exams" value={exams.length} icon={<CalendarIcon className="h-5 w-5" />} />
        <StatTile label="Active users" value={`${activeUsers} / ${users.length}`} icon={<UsersIcon className="h-5 w-5" />} accent="accent" />
        <StatTile label="Audit events" value={auditLogs.length} icon={<ActivityIcon className="h-5 w-5" />} />
      </section>

      <section id="exams" className="scroll-mt-6 rounded-3xl bg-white p-6 shadow-card dark:bg-slate-900 dark:shadow-none dark:ring-1 dark:ring-white/10">
        <p className="mb-4 text-sm font-semibold text-brand-950 dark:text-slate-50">Create exam</p>
        {error && <p className="mb-3 rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">{error}</p>}
        <form onSubmit={handleCreateExam} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            required
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-2xl border border-brand-200 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-500 lg:col-span-2 dark:border-white/10 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-brand-400"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExamCategory)}
            className="rounded-2xl border border-brand-200 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-brand-400"
          >
            {EXAM_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value} className="dark:bg-slate-900">
                {c.label}
              </option>
            ))}
          </select>
          <input
            required
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="rounded-2xl border border-brand-200 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:text-slate-100 dark:[color-scheme:dark] dark:focus:border-brand-400"
          />
          <input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-2xl border border-brand-200 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-brand-400"
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-2xl bg-brand-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:opacity-60 sm:col-span-2 lg:col-span-5 dark:bg-brand-500 dark:hover:bg-brand-400"
          >
            {creating ? "Creating…" : "Create exam"}
          </button>
        </form>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-card dark:bg-slate-900 dark:shadow-none dark:ring-1 dark:ring-white/10">
        <p className="mb-4 text-sm font-semibold text-brand-950 dark:text-slate-50">Exams</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-brand-500 dark:text-slate-500">
                <th className="pb-2">Title</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Days left</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {exams.slice(0, examsReveal.visibleCount).map((exam) => (
                <tr key={exam.id} className="border-t border-brand-100 dark:border-white/10">
                  <td className="py-2.5 text-brand-900 dark:text-slate-100">{exam.title}</td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs ${CATEGORY_STYLES[exam.category].chip}`}>
                      {exam.category}
                    </span>
                  </td>
                  <td className="py-2.5 text-brand-700 dark:text-slate-400">{exam.exam_date}</td>
                  <td className="py-2.5 text-brand-700 dark:text-slate-400">{exam.days_left}</td>
                  <td className="py-2.5 text-right">
                    <button onClick={() => handleResend(exam.id)} className="mr-3 text-xs font-medium text-brand-600 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200">
                      Resend
                    </button>
                    <button onClick={() => handleDeleteExam(exam.id)} className="text-xs font-medium text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {exams.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-xs text-brand-500 dark:text-slate-500">
                    No exams yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {examsReveal.hasMore && (
            <div ref={examsReveal.sentinelRef} className="py-3 text-center text-xs text-brand-500 dark:text-slate-500">
              Loading more…
            </div>
          )}
        </div>
      </section>

      <section id="users" className="scroll-mt-6 rounded-3xl bg-white p-6 shadow-card dark:bg-slate-900 dark:shadow-none dark:ring-1 dark:ring-white/10">
        <p className="mb-4 text-sm font-semibold text-brand-950 dark:text-slate-50">Users</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-brand-500 dark:text-slate-500">
                <th className="pb-2">Email</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Status</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {users.slice(0, usersReveal.visibleCount).map((u) => (
                <tr key={u.id} className="border-t border-brand-100 dark:border-white/10">
                  <td className="py-2.5 text-brand-900 dark:text-slate-100">{u.email}</td>
                  <td className="py-2.5 text-brand-700 dark:text-slate-400">{u.role}</td>
                  <td className="py-2.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs ${
                        u.is_active
                          ? "bg-accent-400/30 text-brand-900 dark:bg-accent-400/15 dark:text-accent-400"
                          : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                      }`}
                    >
                      {u.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <button onClick={() => handleToggleUser(u)} className="text-xs font-medium text-brand-600 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200">
                      {u.is_active ? "Disable" : "Reactivate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {usersReveal.hasMore && (
            <div ref={usersReveal.sentinelRef} className="py-3 text-center text-xs text-brand-500 dark:text-slate-500">
              Loading more…
            </div>
          )}
        </div>
      </section>

      <section id="audit" className="scroll-mt-6 rounded-3xl bg-white p-6 shadow-card dark:bg-slate-900 dark:shadow-none dark:ring-1 dark:ring-white/10">
        <p className="mb-4 text-sm font-semibold text-brand-950 dark:text-slate-50">Audit log</p>
        <ul className="flex flex-col gap-2 text-sm text-brand-700 dark:text-slate-400">
          {auditLogs.map((log) => (
            <li key={log.id} className="flex justify-between border-b border-brand-100 py-1.5 last:border-0 dark:border-white/10">
              <span>
                {log.action} {log.entity_type} <span className="text-brand-400 dark:text-slate-600">#{log.entity_id.slice(0, 8)}</span>
              </span>
              <span className="text-brand-400 dark:text-slate-600">{new Date(log.created_at).toLocaleString()}</span>
            </li>
          ))}
          {auditLogs.length === 0 && <p className="text-xs text-brand-500 dark:text-slate-500">No activity yet.</p>}
        </ul>
      </section>
    </AppShell>
  );
}

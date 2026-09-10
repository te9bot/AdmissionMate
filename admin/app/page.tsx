"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CATEGORY_STYLES, EXAM_CATEGORIES, type AuditLogEntry, type Exam, type ExamCategory, type User } from "@/lib/types";

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
      <section className="rounded-4xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 p-6 text-white shadow-panel sm:p-8">
        <p className="text-sm font-medium uppercase tracking-wide text-white/70">Admin</p>
        <h1 className="mt-2 text-3xl font-bold">Manage exams &amp; users</h1>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-card">
        <p className="mb-4 text-sm font-semibold text-brand-950">Create exam</p>
        {error && <p className="mb-3 rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}
        <form onSubmit={handleCreateExam} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            required
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-2xl border border-brand-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 lg:col-span-2"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExamCategory)}
            className="rounded-2xl border border-brand-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
          >
            {EXAM_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            required
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="rounded-2xl border border-brand-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
          />
          <input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-2xl border border-brand-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-2xl bg-brand-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:opacity-60 sm:col-span-2 lg:col-span-5"
          >
            {creating ? "Creating…" : "Create exam"}
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-card">
        <p className="mb-4 text-sm font-semibold text-brand-950">Exams</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-brand-500">
                <th className="pb-2">Title</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Days left</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.id} className="border-t border-brand-100">
                  <td className="py-2.5 text-brand-900">{exam.title}</td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs ${CATEGORY_STYLES[exam.category].chip}`}>
                      {exam.category}
                    </span>
                  </td>
                  <td className="py-2.5 text-brand-700">{exam.exam_date}</td>
                  <td className="py-2.5 text-brand-700">{exam.days_left}</td>
                  <td className="py-2.5 text-right">
                    <button onClick={() => handleResend(exam.id)} className="mr-3 text-xs font-medium text-brand-600 hover:text-brand-800">
                      Resend
                    </button>
                    <button onClick={() => handleDeleteExam(exam.id)} className="text-xs font-medium text-red-500 hover:text-red-700">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-card">
        <p className="mb-4 text-sm font-semibold text-brand-950">Users</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-brand-500">
                <th className="pb-2">Email</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Status</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-brand-100">
                  <td className="py-2.5 text-brand-900">{u.email}</td>
                  <td className="py-2.5 text-brand-700">{u.role}</td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs ${u.is_active ? "bg-accent-400/30 text-brand-900" : "bg-red-100 text-red-700"}`}>
                      {u.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <button onClick={() => handleToggleUser(u)} className="text-xs font-medium text-brand-600 hover:text-brand-800">
                      {u.is_active ? "Disable" : "Reactivate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-card">
        <p className="mb-4 text-sm font-semibold text-brand-950">Audit log</p>
        <ul className="flex flex-col gap-2 text-sm text-brand-700">
          {auditLogs.map((log) => (
            <li key={log.id} className="flex justify-between border-b border-brand-100 py-1.5 last:border-0">
              <span>
                {log.action} {log.entity_type} <span className="text-brand-400">#{log.entity_id.slice(0, 8)}</span>
              </span>
              <span className="text-brand-400">{new Date(log.created_at).toLocaleString()}</span>
            </li>
          ))}
          {auditLogs.length === 0 && <p className="text-xs text-brand-500">No activity yet.</p>}
        </ul>
      </section>
    </AppShell>
  );
}

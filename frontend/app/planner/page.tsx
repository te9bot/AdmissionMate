"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Exam, StudyGoal } from "@/lib/types";

export default function PlannerPage() {
  const { accessToken } = useAuth();
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [targetExamId, setTargetExamId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [creating, setCreating] = useState(false);

  const [topicDrafts, setTopicDrafts] = useState<Record<string, string>>({});

  function refreshGoals() {
    if (!accessToken) return;
    api.get<StudyGoal[]>("/goals", accessToken).then(setGoals).catch(() => {});
  }

  useEffect(() => {
    if (!accessToken) return;
    refreshGoals();
    api.get<Exam[]>("/exams").then(setExams).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setError(null);
    setCreating(true);
    try {
      await api.post(
        "/goals",
        { title, target_exam_id: targetExamId || null, start_date: startDate, end_date: endDate },
        accessToken
      );
      setTitle("");
      setTargetExamId("");
      setStartDate("");
      setEndDate("");
      refreshGoals();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create goal");
    } finally {
      setCreating(false);
    }
  }

  async function handleAddTopics(goalId: string) {
    if (!accessToken) return;
    const draft = topicDrafts[goalId]?.trim();
    if (!draft) return;
    const titles = draft
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);
    await api.post(`/goals/${goalId}/topics`, { titles }, accessToken);
    setTopicDrafts((prev) => ({ ...prev, [goalId]: "" }));
    refreshGoals();
  }

  async function handleRegenerate(goalId: string) {
    if (!accessToken) return;
    await api.post(`/goals/${goalId}/regenerate`, undefined, accessToken);
    refreshGoals();
  }

  async function handleToggleTopic(goalId: string, topicId: string, done: boolean) {
    if (!accessToken) return;
    await api.patch(`/topics/${topicId}`, { status: done ? "pending" : "done" }, accessToken);
    setGoals((prev) =>
      prev.map((g) =>
        g.id !== goalId
          ? g
          : { ...g, topics: g.topics.map((t) => (t.id === topicId ? { ...t, status: done ? "pending" : "done" } : t)) }
      )
    );
  }

  return (
    <AppShell>
      <section className="rounded-4xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 p-6 text-white shadow-panel sm:p-8">
        <p className="text-sm font-medium uppercase tracking-wide text-white/70">Study Planner</p>
        <h1 className="mt-2 text-3xl font-bold">Plan your topics, day by day</h1>
        <p className="mt-1 text-sm text-white/70">
          Set a goal, list your topics, and we&apos;ll spread them evenly across your window.
        </p>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-card">
        <p className="mb-4 text-sm font-semibold text-brand-950">New goal</p>
        {error && <p className="mb-3 rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}
        <form onSubmit={handleCreateGoal} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            required
            placeholder="Goal title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-2xl border border-brand-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 sm:col-span-2 lg:col-span-1"
          />
          <select
            value={targetExamId}
            onChange={(e) => setTargetExamId(e.target.value)}
            className="rounded-2xl border border-brand-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
          >
            <option value="">No target exam</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title}
              </option>
            ))}
          </select>
          <input
            required
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-2xl border border-brand-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
          />
          <input
            required
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-2xl border border-brand-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-2xl bg-brand-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:opacity-60 sm:col-span-2 lg:col-span-4"
          >
            {creating ? "Creating…" : "Create goal"}
          </button>
        </form>
      </section>

      <section className="mt-6 flex flex-col gap-6">
        {goals.map((goal) => (
          <div key={goal.id} className="rounded-3xl bg-white p-6 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-brand-950">{goal.title}</p>
                <p className="text-xs text-brand-700">
                  {goal.start_date} → {goal.end_date}
                </p>
              </div>
              <button
                onClick={() => handleRegenerate(goal.id)}
                className="rounded-full bg-brand-100 px-4 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-200"
              >
                Regenerate remaining
              </button>
            </div>

            <ul className="mt-4 flex flex-col gap-2">
              {goal.topics.map((topic) => (
                <li key={topic.id} className="flex items-center gap-3 rounded-2xl bg-brand-50 px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={topic.status === "done"}
                    onChange={() => handleToggleTopic(goal.id, topic.id, topic.status === "done")}
                    className="h-4 w-4 accent-brand-600"
                  />
                  <span className={`flex-1 text-sm ${topic.status === "done" ? "text-brand-400 line-through" : "text-brand-900"}`}>
                    {topic.title}
                  </span>
                  {topic.scheduled_date && <span className="text-xs text-brand-500">{topic.scheduled_date}</span>}
                </li>
              ))}
              {goal.topics.length === 0 && <p className="text-xs text-brand-700">No topics yet — add some below.</p>}
            </ul>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <textarea
                placeholder={"One topic per line, e.g.\nPhysics: Vectors\nPhysics: Kinematics"}
                value={topicDrafts[goal.id] ?? ""}
                onChange={(e) => setTopicDrafts((prev) => ({ ...prev, [goal.id]: e.target.value }))}
                rows={2}
                className="flex-1 rounded-2xl border border-brand-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
              />
              <button
                onClick={() => handleAddTopics(goal.id)}
                className="rounded-2xl bg-brand-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-900"
              >
                Add topics
              </button>
            </div>
          </div>
        ))}
        {goals.length === 0 && <p className="text-sm text-brand-700">No goals yet. Create one above to get started.</p>}
      </section>
    </AppShell>
  );
}

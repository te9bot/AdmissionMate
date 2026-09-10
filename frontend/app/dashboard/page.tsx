"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CalendarMini } from "@/components/CalendarMini";
import { ExamCard } from "@/components/ExamCard";
import { StatTile } from "@/components/StatTile";
import { TimelineBlock } from "@/components/TimelineBlock";
import { ViewToggle } from "@/components/ViewToggle";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Exam, StudyGoal, Topic } from "@/lib/types";

type View = "daily" | "weekly" | "monthly";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function inRange(dateKey: string, view: View) {
  const date = new Date(dateKey);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (view === "daily") return diffDays === 0;
  if (view === "weekly") return diffDays >= 0 && diffDays < 7;
  return diffDays >= 0 && diffDays < 31;
}

export default function DashboardPage() {
  const { user, accessToken } = useAuth();
  const [followedExams, setFollowedExams] = useState<Exam[]>([]);
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [view, setView] = useState<View>("weekly");
  const [selectedDate, setSelectedDate] = useState(todayKey());

  useEffect(() => {
    if (!accessToken) return;
    api.get<Exam[]>("/exams/me/followed", accessToken).then(setFollowedExams).catch(() => {});
    api.get<Exam[]>("/exams").then(setAllExams).catch(() => {});
    api.get<StudyGoal[]>("/goals", accessToken).then(setGoals).catch(() => {});
  }, [accessToken]);

  const followedIds = useMemo(() => new Set(followedExams.map((e) => e.id)), [followedExams]);
  const nearestExam = useMemo(
    () => [...followedExams].filter((e) => e.days_left >= 0).sort((a, b) => a.days_left - b.days_left)[0],
    [followedExams]
  );

  const topicsInView = useMemo(() => {
    const items: { topic: Topic; goalTitle: string }[] = [];
    for (const goal of goals) {
      for (const topic of goal.topics) {
        if (topic.scheduled_date && inRange(topic.scheduled_date, view)) {
          items.push({ topic, goalTitle: goal.title });
        }
      }
    }
    return items.sort((a, b) => (a.topic.scheduled_date ?? "").localeCompare(b.topic.scheduled_date ?? ""));
  }, [goals, view]);

  async function toggleFollow(exam: Exam) {
    if (!accessToken) return;
    if (followedIds.has(exam.id)) {
      await api.delete(`/exams/${exam.id}/follow`, accessToken);
      setFollowedExams((prev) => prev.filter((e) => e.id !== exam.id));
    } else {
      await api.post(`/exams/${exam.id}/follow`, undefined, accessToken);
      setFollowedExams((prev) => [...prev, exam]);
    }
  }

  async function toggleTopicDone(goalId: string, topic: Topic) {
    if (!accessToken) return;
    const nextStatus = topic.status === "done" ? "pending" : "done";
    await api.patch(`/topics/${topic.id}`, { status: nextStatus }, accessToken);
    setGoals((prev) =>
      prev.map((g) =>
        g.id !== goalId ? g : { ...g, topics: g.topics.map((t) => (t.id === topic.id ? { ...t, status: nextStatus } : t)) }
      )
    );
  }

  return (
    <AppShell>
      <section className="rounded-4xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 p-6 text-white shadow-panel sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-white/70">My Calendar</p>
            <h1 className="mt-2 text-3xl font-bold">Hi{user?.name ? `, ${user.name}` : ""}</h1>
            <p className="mt-1 text-sm text-white/70">Your exams and study plan, all in one place.</p>
          </div>
          <div className="flex items-center gap-6">
            <StatTile label="Exams followed" value={followedExams.length} />
            {nearestExam && <StatTile label="Nearest exam" value={nearestExam.days_left} unit="days" />}
            <ViewToggle
              value={view}
              onChange={setView}
              options={[
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly" },
                { value: "monthly", label: "Monthly" },
              ]}
            />
          </div>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col gap-6">
          <CalendarMini
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            markedDates={goals.flatMap((g) => g.topics.map((t) => t.scheduled_date).filter((d): d is string => !!d))}
          />

          <div className="rounded-3xl bg-white p-5 shadow-card">
            <p className="mb-3 text-sm font-semibold text-brand-950">My Exams</p>
            {followedExams.length === 0 && <p className="text-xs text-brand-700">Not following any exams yet.</p>}
            <ul className="flex flex-col gap-2">
              {followedExams.map((exam) => (
                <li key={exam.id} className="flex items-center justify-between text-sm">
                  <span className="text-brand-900">{exam.title}</span>
                  <button
                    onClick={() => toggleFollow(exam)}
                    className="text-xs font-medium text-brand-500 hover:text-brand-700"
                  >
                    Unfollow
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-3xl bg-white p-5 shadow-card">
            <p className="mb-4 text-sm font-semibold text-brand-950">
              {view === "daily" ? "Today's" : view === "weekly" ? "This week's" : "This month's"} study plan
            </p>
            {topicsInView.length === 0 ? (
              <p className="text-xs text-brand-700">
                Nothing scheduled. Add topics to a goal in{" "}
                <a href="/planner" className="underline">
                  Planner
                </a>
                .
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {topicsInView.map(({ topic, goalTitle }) => {
                  const goal = goals.find((g) => g.topics.some((t) => t.id === topic.id));
                  return (
                    <TimelineBlock
                      key={topic.id}
                      topic={topic}
                      goalTitle={goalTitle}
                      onToggleDone={() => goal && toggleTopicDone(goal.id, topic)}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-card">
            <p className="mb-4 text-sm font-semibold text-brand-950">Browse exams</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {allExams.slice(0, 4).map((exam) => (
                <ExamCard key={exam.id} exam={exam} following={followedIds.has(exam.id)} onFollowToggle={() => toggleFollow(exam)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

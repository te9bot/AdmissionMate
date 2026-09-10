import type { Topic } from "@/lib/types";

export function TimelineBlock({
  topic,
  goalTitle,
  onToggleDone,
}: {
  topic: Topic;
  goalTitle: string;
  onToggleDone?: () => void;
}) {
  const done = topic.status === "done";

  return (
    <button
      onClick={onToggleDone}
      className={`w-full rounded-2xl px-4 py-3 text-left shadow-card transition ${
        done ? "bg-accent-400/40 text-brand-800" : "bg-brand-300 text-brand-950 hover:bg-brand-300/80"
      }`}
    >
      <p className={`text-sm font-semibold ${done ? "line-through opacity-70" : ""}`}>{topic.title}</p>
      <p className="mt-0.5 text-xs opacity-70">{goalTitle}</p>
    </button>
  );
}

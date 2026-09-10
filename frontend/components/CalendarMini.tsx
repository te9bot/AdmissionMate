"use client";

import { useState } from "react";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function CalendarMini({
  selectedDate,
  onSelectDate,
  markedDates = [],
}: {
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  markedDates?: string[];
}) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const firstDayIndex = (cursor.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const marked = new Set(markedDates);
  const todayKey = toDateKey(today);

  const cells: (Date | null)[] = [...Array(firstDayIndex).fill(null)];
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
  }

  return (
    <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white shadow-panel">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold">
          {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
        </p>
        <div className="flex gap-1">
          <button
            aria-label="Previous month"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
          >
            ‹
          </button>
          <button
            aria-label="Next month"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-2 text-center text-xs">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-white/60">
            {w}
          </span>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={`empty-${i}`} />;
          const key = toDateKey(date);
          const isToday = key === todayKey;
          const isSelected = key === selectedDate;
          const isMarked = marked.has(key);
          return (
            <button
              key={key}
              onClick={() => onSelectDate?.(key)}
              className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full transition ${
                isSelected
                  ? "bg-accent-400 font-semibold text-brand-950"
                  : isToday
                    ? "bg-white/25 font-semibold"
                    : "hover:bg-white/15"
              } ${isMarked && !isSelected ? "ring-1 ring-accent-400" : ""}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

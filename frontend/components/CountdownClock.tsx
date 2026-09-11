"use client";

import { useEffect, useState } from "react";

function getTimeLeft(target: number) {
  const diff = target - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    ended: false,
  };
}

export function CountdownClock({ targetDate }: { targetDate: string }) {
  const target = new Date(`${targetDate}T00:00:00`).getTime();
  const [time, setTime] = useState(() => getTimeLeft(target));

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (time.ended) {
    return <p className="text-sm font-medium text-white/80">This exam has started.</p>;
  }

  const units: { label: string; value: number }[] = [
    { label: "Days", value: time.days },
    { label: "Hours", value: time.hours },
    { label: "Minutes", value: time.minutes },
    { label: "Seconds", value: time.seconds },
  ];

  return (
    <div className="flex gap-2 sm:gap-3">
      {units.map((u) => (
        <div key={u.label} className="flex flex-col items-center gap-1.5">
          <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-brand-950 shadow-card sm:h-16 sm:w-16">
            <div className="absolute inset-x-0 top-0 h-1/2 bg-white/5" />
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-black/30" />
            <span
              key={u.value}
              className="absolute inset-0 flex items-center justify-center font-mono text-xl font-bold text-white tabular-nums sm:text-2xl"
            >
              {String(u.value).padStart(2, "0")}
            </span>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-accent-400 sm:text-xs">
            {u.label}
          </span>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useTheme } from "@/lib/theme";
import { MoonIcon, SunIcon } from "@/components/icons";

export function ThemeToggle({ variant = "surface" }: { variant?: "surface" | "header" }) {
  const { theme, toggleTheme } = useTheme();

  const colorClasses =
    variant === "header"
      ? "text-white/80 hover:bg-white/10 hover:text-white"
      : "text-brand-600 hover:bg-brand-500/10 hover:text-brand-800 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white";

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={`flex h-9 w-9 items-center justify-center rounded-2xl transition ${colorClasses}`}
    >
      {theme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
    </button>
  );
}

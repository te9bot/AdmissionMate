export function StatTile({
  label,
  value,
  icon,
  accent = "brand",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: "brand" | "accent";
}) {
  return (
    <div className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-card transition-colors dark:bg-slate-900 dark:shadow-none dark:ring-1 dark:ring-white/10">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
          accent === "accent"
            ? "bg-accent-400/20 text-accent-500 dark:bg-accent-400/10 dark:text-accent-400"
            : "bg-brand-500/15 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
        }`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-brand-500 dark:text-slate-400">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-brand-950 dark:text-slate-50">{value}</p>
      </div>
    </div>
  );
}

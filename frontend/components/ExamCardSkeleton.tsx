export function ExamCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col justify-between rounded-3xl border-l-4 border-brand-100 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div className="h-5 w-20 rounded-full bg-brand-100" />
        <div className="h-5 w-16 rounded-full bg-brand-50" />
      </div>

      <div className="mt-6">
        <div className="h-4 w-4/5 rounded bg-brand-100" />
        <div className="mt-2 h-4 w-2/3 rounded bg-brand-100" />
        <div className="mt-3 h-3 w-24 rounded bg-brand-50" />
      </div>

      <div className="mt-6 h-8 w-16 rounded bg-brand-100" />
    </div>
  );
}

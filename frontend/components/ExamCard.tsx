import { CATEGORY_STYLES, EXAM_CATEGORIES, type Exam } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function ExamCard({
  exam,
  onFollowToggle,
  following,
}: {
  exam: Exam;
  onFollowToggle?: () => void;
  following?: boolean;
}) {
  const style = CATEGORY_STYLES[exam.category];
  const categoryLabel = EXAM_CATEGORIES.find((c) => c.value === exam.category)?.label ?? exam.category;
  const urgent = exam.days_left <= 14 && exam.days_left >= 0;

  return (
    <div className={`flex flex-col justify-between rounded-3xl p-5 shadow-card ${style.bg} ${style.text}`}>
      <div className="flex items-start justify-between">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${style.chip}`}>{categoryLabel}</span>
        {onFollowToggle && (
          <button
            onClick={onFollowToggle}
            aria-label={following ? "Unfollow exam" : "Follow exam"}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              following ? "bg-brand-950 text-white" : "bg-white/50 hover:bg-white/70"
            }`}
          >
            {following ? "Following" : "Follow"}
          </button>
        )}
      </div>

      <div className="mt-6">
        <p className="text-base font-semibold leading-snug">{exam.title}</p>
        <p className="mt-1 text-xs opacity-70">{formatDate(exam.exam_date)}</p>
      </div>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-3xl font-bold">
          {exam.days_left >= 0 ? exam.days_left : Math.abs(exam.days_left)}
        </span>
        <span className="text-sm font-medium opacity-80">
          {exam.days_left >= 0 ? "days left" : "days ago"}
        </span>
        {urgent && <span className="ml-auto h-2 w-2 rounded-full bg-brand-950" />}
      </div>
    </div>
  );
}

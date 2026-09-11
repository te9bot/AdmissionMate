export type UserRole = "student" | "admin";

export interface User {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  is_active: boolean;
  has_password: boolean;
  created_at: string;
}

export type ExamCategory = "hsc" | "ssc" | "admission" | "others";

export interface Exam {
  id: string;
  title: string;
  category: ExamCategory;
  exam_date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  days_left: number;
}

export type TopicStatus = "pending" | "done";

export interface Topic {
  id: string;
  goal_id: string;
  title: string;
  order: number;
  status: TopicStatus;
  scheduled_date: string | null;
}

export interface StudyGoal {
  id: string;
  user_id: string;
  title: string;
  target_exam_id: string | null;
  start_date: string;
  end_date: string;
  topics: Topic[];
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export const EXAM_CATEGORIES: { value: ExamCategory; label: string }[] = [
  { value: "hsc", label: "HSC" },
  { value: "ssc", label: "SSC" },
  { value: "admission", label: "Admission" },
  { value: "others", label: "Others" },
];

export const CATEGORY_STYLES: Record<ExamCategory, { border: string; dot: string; chip: string }> = {
  hsc: { border: "border-brand-400", dot: "bg-brand-400", chip: "bg-brand-100 text-brand-700" },
  ssc: { border: "border-brand-700", dot: "bg-brand-700", chip: "bg-brand-800/10 text-brand-800" },
  admission: { border: "border-accent-400", dot: "bg-accent-400", chip: "bg-accent-400/20 text-brand-800" },
  others: { border: "border-slate-400", dot: "bg-slate-400", chip: "bg-slate-100 text-slate-600" },
};

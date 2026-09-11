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

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
}

export const EXAM_CATEGORIES: { value: ExamCategory; label: string }[] = [
  { value: "hsc", label: "HSC" },
  { value: "ssc", label: "SSC" },
  { value: "admission", label: "Admission" },
  { value: "others", label: "Others" },
];

export const CATEGORY_STYLES: Record<ExamCategory, { chip: string }> = {
  hsc: { chip: "bg-brand-100 text-brand-700 dark:bg-brand-400/15 dark:text-brand-300" },
  ssc: { chip: "bg-brand-800/10 text-brand-800 dark:bg-brand-300/10 dark:text-brand-200" },
  admission: { chip: "bg-accent-400/20 text-brand-800 dark:bg-accent-400/15 dark:text-accent-400" },
  others: { chip: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300" },
};

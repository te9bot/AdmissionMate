export type UserRole = "student" | "admin";

export interface User {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  is_active: boolean;
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

export const CATEGORY_STYLES: Record<ExamCategory, { bg: string; text: string; chip: string }> = {
  hsc: { bg: "bg-brand-300", text: "text-brand-950", chip: "bg-brand-300/60 text-brand-900" },
  ssc: { bg: "bg-brand-600", text: "text-white", chip: "bg-brand-900 text-white" },
  admission: { bg: "bg-accent-400", text: "text-brand-950", chip: "bg-accent-400/30 text-brand-900" },
  others: { bg: "bg-brand-100", text: "text-brand-900", chip: "bg-brand-100 text-brand-700" },
};

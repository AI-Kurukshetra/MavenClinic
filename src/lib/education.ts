export type EducationCategory = "fertility" | "pregnancy" | "menopause" | "mental_health" | "nutrition" | "general";

export type EducationArticleRow = {
  id: string;
  title: string;
  content: string | null;
  category: string | null;
  life_stage: string | null;
  published: boolean | null;
  author_id: string | null;
  created_at: string | null;
};

export type EducationArticle = {
  id: string;
  title: string;
  content: string;
  preview: string;
  category: EducationCategory;
  categoryLabel: string;
  lifeStage: string;
  published: boolean;
  authorId: string | null;
  createdAt: string | null;
  formattedDate: string;
};

export const educationCategories: Array<{ key: EducationCategory | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "fertility", label: "Fertility" },
  { key: "pregnancy", label: "Pregnancy" },
  { key: "menopause", label: "Menopause" },
  { key: "mental_health", label: "Mental Health" },
  { key: "nutrition", label: "Nutrition" },
  { key: "general", label: "General" },
];

const categoryLabels: Record<EducationCategory, string> = {
  fertility: "Fertility",
  pregnancy: "Pregnancy",
  menopause: "Menopause",
  mental_health: "Mental Health",
  nutrition: "Nutrition",
  general: "General",
};

const categoryBadgeClasses: Record<EducationCategory, string> = {
  fertility: "bg-[rgba(61,191,173,0.12)] text-[var(--teal-700)]",
  pregnancy: "bg-[rgba(232,125,155,0.12)] text-[var(--rose-700)]",
  menopause: "bg-[rgba(245,158,11,0.14)] text-amber-700",
  mental_health: "bg-[rgba(168,85,247,0.12)] text-violet-700",
  nutrition: "bg-[rgba(34,197,94,0.12)] text-emerald-700",
  general: "bg-slate-100 text-slate-600",
};

export function normalizeEducationCategory(value?: string | null): EducationCategory {
  switch (value) {
    case "fertility":
    case "pregnancy":
    case "menopause":
    case "mental_health":
    case "nutrition":
      return value;
    default:
      return "general";
  }
}

export function getEducationCategoryLabel(category: EducationCategory) {
  return categoryLabels[category];
}

export function getEducationBadgeClass(category: EducationCategory) {
  return categoryBadgeClasses[category];
}

export function createEducationPreview(content: string, maxLength = 150) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

export function formatEducationDate(value?: string | null) {
  if (!value) {
    return "Recently added";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function mapEducationArticle(row: EducationArticleRow): EducationArticle {
  const category = normalizeEducationCategory(row.category);
  const content = row.content?.trim() ?? "";

  return {
    id: row.id,
    title: row.title,
    content,
    preview: createEducationPreview(content || "Our clinical team is curating this health resource right now."),
    category,
    categoryLabel: getEducationCategoryLabel(category),
    lifeStage: row.life_stage?.trim() || "All stages",
    published: Boolean(row.published),
    authorId: row.author_id,
    createdAt: row.created_at,
    formattedDate: formatEducationDate(row.created_at),
  };
}

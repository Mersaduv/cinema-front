export const CONTENT_WARNING_OPTIONS = [
  { value: "violence", label: "خشونت" },
  { value: "strong_language", label: "زبان نامناسب" },
  { value: "sexual_content", label: "محتوای جنسی" },
  { value: "drug_use", label: "مصرف مواد مخدر" },
  { value: "disturbing_scenes", label: "صحنه‌های آزاردهنده" },
  { value: "gambling", label: "قمار" },
  { value: "smoking", label: "سیگار کشیدن" },
] as const;

export type ContentWarningValue = (typeof CONTENT_WARNING_OPTIONS)[number]["value"];

export const QUALITY_BADGE_OPTIONS = [
  { value: "4K", label: "4K (Ultra HD)" },
  { value: "HDR10", label: "HDR10" },
  { value: "HDR10Plus", label: "HDR10+" },
  { value: "DolbyVision", label: "Dolby Vision" },
  { value: "DolbyAtmos", label: "Dolby Atmos" },
  { value: "DTS", label: "DTS" },
  { value: "Surround51", label: "5.1 Surround" },
  { value: "Surround71", label: "7.1 Surround" },
] as const;

export type QualityBadgeValue = (typeof QUALITY_BADGE_OPTIONS)[number]["value"];

const contentWarningLabelMap = Object.fromEntries(
  CONTENT_WARNING_OPTIONS.map((option) => [option.value, option.label]),
) as Record<ContentWarningValue, string>;

const qualityBadgeClassMap: Record<QualityBadgeValue, string> = {
  "4K": "border-purple-400/35 bg-purple-500/15 text-purple-200",
  HDR10: "border-amber-400/35 bg-amber-500/15 text-amber-100",
  HDR10Plus: "border-amber-400/35 bg-amber-500/15 text-amber-100",
  DolbyVision: "border-sky-400/35 bg-sky-500/15 text-sky-100",
  DolbyAtmos: "border-sky-400/35 bg-sky-500/15 text-sky-100",
  DTS: "border-white/20 bg-white/10 text-white/75",
  Surround51: "border-white/20 bg-white/10 text-white/75",
  Surround71: "border-white/20 bg-white/10 text-white/75",
};

export function contentWarningLabel(value: string): string {
  return contentWarningLabelMap[value as ContentWarningValue] ?? value;
}

export function qualityBadgeLabel(value: string): string {
  return QUALITY_BADGE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function qualityBadgeClassName(value: string): string {
  return (
    qualityBadgeClassMap[value as QualityBadgeValue] ??
    "border-white/20 bg-white/10 text-white/75"
  );
}

export function toggleStringListValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

const ENGLISH_TO_PERSIAN_GENRE: Record<string, string> = {
  action: "اکشن",
  adventure: "ماجراجویی",
  animation: "انیمیشن",
  comedy: "کمدی",
  crime: "جنایی",
  documentary: "مستند",
  drama: "درام",
  family: "خانوادگی",
  fantasy: "فانتزی",
  history: "تاریخی",
  horror: "ترسناک",
  music: "موزیک",
  mystery: "معمایی",
  romance: "عاشقانه",
  "sci-fi": "علمی-تخیلی",
  "science fiction": "علمی-تخیلی",
  "sci fi": "علمی-تخیلی",
  "sci-fi & fantasy": "علمی-تخیلی و فانتزی",
  "tv movie": "فیلم تلویزیونی",
  thriller: "هیجان‌انگیز",
  war: "جنگی",
  western: "وسترن",
  "action & adventure": "اکشن و ماجراجویی",
  kids: "کودک",
  news: "خبری",
  reality: "واقع‌نما",
  soap: "سریال تلویزیونی",
  talk: "گفت‌وگو",
  "war & politics": "جنگ و سیاست",
};

function hasPersianScript(value: string): boolean {
  return /[\u0600-\u06FF]/.test(value);
}

import { normalizeListItemLabel } from "./list-item-label";

export function localizeGenreLabel(label: unknown): string {
  const trimmed = normalizeListItemLabel(label);

  if (!trimmed || hasPersianScript(trimmed)) {
    return trimmed;
  }

  return ENGLISH_TO_PERSIAN_GENRE[trimmed.toLowerCase()] ?? trimmed;
}

export function localizeGenreLabels(labels: unknown[]): string[] {
  const seen = new Set<string>();

  return labels
    .map((label) => localizeGenreLabel(label))
    .filter((label) => {
      if (!label || seen.has(label)) {
        return false;
      }

      seen.add(label);
      return true;
    });
}

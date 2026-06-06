const productionStatusLabels: Record<string, string> = {
  "Returning Series": "در حال پخش",
  Ended: "پایان یافته",
  Canceled: "لغو شده",
  "In Production": "در حال تولید",
  Pilot: "پایلوت",
  Released: "منتشر شده (سینما)",
  Rumored: "شایعه",
  Planned: "برنامه‌ریزی شده",
  "Post Production": "پس از تولید",
};

export const productionStatusSelectOptions = [
  { value: "", label: "وضعیت نامشخص", description: "از TMDB یا دستی انتخاب کنید" },
  ...Object.entries(productionStatusLabels).map(([value, labelFa]) => ({
    value,
    label: `${labelFa} — ${value}`,
    description: value,
  })),
];

export function translateProductionStatus(status: string | null | undefined) {
  if (!status?.trim()) {
    return null;
  }

  return productionStatusLabels[status] || status;
}

const publishStatusLabels: Record<string, string> = {
  draft: "پیش‌نویس",
  scheduled: "زمان‌بندی شده",
  published: "منتشر شده",
};

const catalogVisibilityLabels: Record<string, string> = {
  catalog_search: "کاتالوگ و جستجو",
  catalog: "فقط کاتالوگ",
  search: "فقط جستجو",
  hidden: "مخفی",
};

export function translatePublishStatus(status: string | null | undefined) {
  if (!status?.trim()) {
    return "نامشخص";
  }

  return publishStatusLabels[status] || status;
}

export function translateCatalogVisibility(value: string | null | undefined) {
  if (!value?.trim()) {
    return "نامشخص";
  }

  return catalogVisibilityLabels[value] || value;
}

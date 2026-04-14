"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiOutlineCheckCircle,
  HiOutlinePencil,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineTrash,
} from "react-icons/hi";
import {
  MdOutlineFace,
  MdOutlineCategory,
  MdOutlineLabel,
  MdOutlinePublic,
  MdOutlineTranslate,
} from "react-icons/md";
import {
  adminTaxonomiesService,
  type AdminTaxonomyItem,
  type AdminTaxonomyPagination,
  type AdminTaxonomySummary,
  type TaxonomyType,
} from "../../lib/admin-taxonomies";
import AdminPagination from "./AdminPagination";
import AdminSelect from "./AdminSelect";
import AdminStatCard from "./AdminStatCard";

const emptySummary: AdminTaxonomySummary = {
  total: 0,
  active: 0,
  inactive: 0,
  attached_movies: 0,
};

const emptyPagination: AdminTaxonomyPagination = {
  current_page: 1,
  last_page: 1,
  per_page: 12,
  total: 0,
};

const initialForm = {
  name: "",
  slug: "",
  description: "",
  imdb_url: "",
  sort_order: "0",
  is_active: true,
};

type AdminTaxonomyManagerPageProps = {
  taxonomyType: TaxonomyType;
  badge: string;
  title: string;
  description: string;
  singularLabel: string;
};

function getTaxonomyIcon(type: TaxonomyType) {
  switch (type) {
    case "genres":
      return MdOutlineCategory;
    case "countries":
      return MdOutlinePublic;
    case "languages":
      return MdOutlineTranslate;
    case "actors":
      return MdOutlineFace;
    default:
      return MdOutlineLabel;
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function AdminTaxonomyManagerPage({
  taxonomyType,
  badge,
  title,
  description,
  singularLabel,
}: AdminTaxonomyManagerPageProps) {
  const [items, setItems] = useState<AdminTaxonomyItem[]>([]);
  const [summary, setSummary] = useState<AdminTaxonomySummary>(emptySummary);
  const [pagination, setPagination] = useState<AdminTaxonomyPagination>(emptyPagination);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingItem, setEditingItem] = useState<AdminTaxonomyItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState(initialForm);

  const Icon = useMemo(() => getTaxonomyIcon(taxonomyType), [taxonomyType]);
  const isActorTaxonomy = taxonomyType === "actors";

  const loadItems = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError("");

      const response = await adminTaxonomiesService.list(taxonomyType, {
        page,
        search: debouncedSearch,
        status,
      });

      if (response.success && response.data) {
        setItems(response.data.items);
        setSummary(response.data.summary);
        setPagination(response.data.pagination);
      } else {
        setError(response.message || `دریافت ${title} با خطا روبه‌رو شد.`);
      }

      setLoading(false);
    },
    [debouncedSearch, status, taxonomyType, title]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadItems(1);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadItems]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const statusOptions = [
    {
      value: "",
      label: "همه وضعیت‌ها",
      description: `نمایش همه ${title} بدون محدودیت وضعیت`,
    },
    {
      value: "active",
      label: "فعال",
      description: `${title} قابل انتخاب در فرم فیلم`,
    },
    {
      value: "inactive",
      label: "غیرفعال",
      description: `${title} از فرم فیلم پنهان می‌شود`,
    },
  ];

  const statCards = [
    {
      label: `کل ${title}`,
      value: summary.total,
      accent: "border-[#f5c518]/18 bg-[#f5c518]/10 text-[#f8d977]",
    },
    {
      label: "فعال",
      value: summary.active,
      accent: "border-[#34d399]/18 bg-[#34d399]/10 text-[#86efac]",
    },
    {
      label: "غیرفعال",
      value: summary.inactive,
      accent: "border-[#fb7185]/18 bg-[#fb7185]/10 text-[#fecdd3]",
    },
    {
      label: "متصل به فیلم",
      value: summary.attached_movies,
      accent: "border-[#38bdf8]/18 bg-[#38bdf8]/10 text-[#7dd3fc]",
    },
  ];

  const resetForm = () => {
    setForm(initialForm);
    setEditingItem(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim() || undefined,
      imdb_url: isActorTaxonomy ? form.imdb_url.trim() || undefined : undefined,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    };

    const response = editingItem
      ? await adminTaxonomiesService.update(taxonomyType, editingItem.id, payload)
      : await adminTaxonomiesService.create(taxonomyType, payload);

    if (response.success) {
      setSuccessMessage(
        editingItem
          ? `${singularLabel} با موفقیت به‌روزرسانی شد.`
          : `${singularLabel} جدید با موفقیت ثبت شد.`
      );
      resetForm();
      await loadItems(editingItem ? pagination.current_page : 1);
    } else {
      const firstError = response.errors
        ? Object.values(response.errors)[0]?.[0]
        : undefined;

      setError(firstError || response.message || `ثبت ${singularLabel} انجام نشد.`);
    }

    setSubmitting(false);
  };

  const handleEdit = (item: AdminTaxonomyItem) => {
    setEditingItem(item);
    setSuccessMessage("");
    setError("");
    setForm({
      name: item.name,
      slug: item.slug,
      description: item.description || "",
      imdb_url: item.imdb_url || "",
      sort_order: String(item.sort_order),
      is_active: item.is_active,
    });
  };

  const handleDelete = async (item: AdminTaxonomyItem) => {
    const confirmed = window.confirm(
      `${singularLabel} «${item.name}» حذف شود؟ اگر به فیلمی متصل باشد، اتصال‌هایش هم پاک می‌شود.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(item.id);
    setError("");
    setSuccessMessage("");

    const response = await adminTaxonomiesService.remove(taxonomyType, item.id);

    if (response.success) {
      await loadItems(
        items.length === 1 && pagination.current_page > 1
          ? pagination.current_page - 1
          : pagination.current_page
      );
    } else {
      setError(response.message || `حذف ${singularLabel} انجام نشد.`);
    }

    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(245,197,24,0.12),rgba(8,16,24,0.96)_42%,rgba(56,189,248,0.14))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] md:p-8">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-3 py-1 text-xs text-[#f8d977]">
            {badge}
          </span>
          <h2 className="mt-5 text-3xl font-black tracking-tight text-white md:text-5xl">
            {title}
          </h2>
          <p className="mt-5 text-base leading-8 text-[#dde7ed] md:text-lg">
            {description}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <AdminStatCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={Icon}
            accentClassName={card.accent}
          />
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">
                {editingItem ? `ویرایش ${singularLabel}` : `ثبت ${singularLabel}`}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[#8ea4b3]">
                این داده‌ها مستقیم در فرم فیلم برای انتخاب نمایش داده می‌شوند.
              </p>
            </div>
            {editingItem ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                انصراف از ویرایش
              </button>
            ) : null}
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-[#34d399]/25 bg-[#34d399]/10 px-4 py-3 text-sm text-[#86efac]">
              <HiOutlineCheckCircle className="h-5 w-5" />
              {successMessage}
            </div>
          ) : null}

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm text-[#8ea4b3]">نام</span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                    slug:
                      current.slug && current.slug === slugify(current.name)
                        ? slugify(event.target.value)
                        : current.slug,
                  }))
                }
                placeholder={`نام ${singularLabel}`}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-[#728896] outline-none transition focus:border-[#f5c518]/45"
                required
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-[#8ea4b3]">Slug</span>
                <input
                  value={form.slug}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, slug: event.target.value }))
                  }
                  placeholder={slugify(form.name) || "auto-generated"}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-[#728896] outline-none transition focus:border-[#f5c518]/45"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-[#8ea4b3]">ترتیب نمایش</span>
                <input
                  type="number"
                  min="0"
                  max="9999"
                  value={form.sort_order}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, sort_order: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm text-[#8ea4b3]">توضیح</span>
              <textarea
                rows={4}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder={`توضیح کوتاه درباره ${singularLabel}`}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-7 text-white placeholder:text-[#728896] outline-none transition focus:border-[#f5c518]/45"
              />
            </label>

            {isActorTaxonomy ? (
              <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <label className="block">
                  <span className="mb-2 block text-sm text-[#8ea4b3]">لینک IMDb</span>
                  <input
                    value={form.imdb_url}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, imdb_url: event.target.value }))
                    }
                    placeholder="https://www.imdb.com/name/nm0000138/"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-[#728896] outline-none transition focus:border-[#f5c518]/45"
                    dir="ltr"
                  />
                  <p className="mt-2 text-xs leading-6 text-[#728896]">
                    بعد از ذخیره، تصویر بازیگر از IMDb گرفته می‌شود و داخل پروژه ذخیره خواهد شد.
                  </p>
                </label>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-semibold text-white">پیش‌نمایش تصویر</p>
                  <div className="mt-4 overflow-hidden rounded-[22px] border border-white/10 bg-[#071019]">
                    {editingItem?.image_url ? (
                      <img
                        src={editingItem.image_url}
                        alt={editingItem.name}
                        className="h-56 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-56 items-center justify-center px-6 text-center text-sm leading-7 text-[#7e92a0]">
                        تصویر بازیگر بعد از ثبت لینک IMDb و ذخیره این فرم اینجا نمایش داده می‌شود.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#d7e3ea]">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) =>
                  setForm((current) => ({ ...current, is_active: event.target.checked }))
                }
                className="h-4 w-4 rounded border-white/20 bg-transparent text-[#f5c518]"
              />
              <span>در فرم فیلم قابل انتخاب باشد</span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-5 py-3 text-sm font-semibold text-[#081018] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editingItem ? <HiOutlinePencil className="h-5 w-5" /> : <HiOutlinePlus className="h-5 w-5" />}
              {submitting
                ? "در حال ثبت..."
                : editingItem
                  ? `ذخیره ${singularLabel}`
                  : `ثبت ${singularLabel}`}
            </button>
          </form>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr_auto]">
            <label className="block">
              <span className="mb-2 block text-sm text-[#8ea4b3]">
                جست‌وجو بر اساس نام یا slug
              </span>
              <div className="relative">
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder={`جست‌وجوی ${title}`}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 pr-11 text-sm text-white placeholder:text-[#728896] outline-none transition focus:border-[#f5c518]/50 focus:bg-white/[0.06]"
                />
                <HiOutlineSearch className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7b909d]" />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-[#8ea4b3]">وضعیت</span>
              <AdminSelect value={status} onChange={setStatus} options={statusOptions} />
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setDebouncedSearch("");
                  setStatus("");
                }}
                className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                پاکسازی فیلترها
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.03]"
                />
              ))
            ) : items.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-white/12 bg-white/[0.02] px-6 py-12 text-center">
                <h4 className="text-xl font-bold text-white">موردی ثبت نشده است</h4>
                <p className="mt-3 text-sm leading-7 text-[#8ea4b3]">
                  اولین {singularLabel} را ثبت کن تا در فرم فیلم قابل انتخاب شود.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/16 hover:bg-white/[0.045]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-4">
                      {isActorTaxonomy ? (
                        item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-20 w-16 shrink-0 rounded-[20px] border border-white/10 object-cover"
                          />
                        ) : (
                          <div className="inline-flex h-20 w-16 shrink-0 items-center justify-center rounded-[20px] border border-dashed border-white/10 bg-white/[0.03] text-xl font-black text-[#7e92a0]">
                            {item.name.slice(0, 1)}
                          </div>
                        )
                      ) : null}

                      <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xl font-black tracking-tight text-white">
                          {item.name}
                        </h4>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs ${
                            item.is_active
                              ? "border-[#34d399]/25 bg-[#34d399]/10 text-[#86efac]"
                              : "border-[#fb7185]/25 bg-[#fb7185]/10 text-[#fecdd3]"
                          }`}
                        >
                          {item.is_active ? "فعال" : "غیرفعال"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[#8ea4b3]">/{item.slug}</p>
                      {isActorTaxonomy && item.imdb_url ? (
                        <a
                          href={item.imdb_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex text-xs text-[#7dd3fc] transition hover:text-[#b9e8ff]"
                          dir="ltr"
                        >
                          IMDb
                        </a>
                      ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08]"
                      >
                        <HiOutlinePencil className="h-4 w-4" />
                        ویرایش
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(item)}
                        disabled={deletingId === item.id}
                        className="inline-flex items-center gap-2 rounded-2xl border border-[#fb7185]/20 bg-[#fb7185]/10 px-4 py-2.5 text-sm text-[#fecdd3] transition hover:border-[#fb7185]/35 hover:bg-[#fb7185]/16 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                        {deletingId === item.id ? "در حال حذف..." : "حذف"}
                      </button>
                    </div>
                  </div>

                  {item.description ? (
                    <p className="mt-4 text-sm leading-7 text-[#d0dce4]">
                      {item.description}
                    </p>
                  ) : (
                    <p className="mt-4 text-sm leading-7 text-[#7e92a0]">
                      برای این مورد هنوز توضیحی ثبت نشده است.
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs text-[#d7e4eb]">
                      ترتیب: {item.sort_order}
                    </span>
                    <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs text-[#d7e4eb]">
                      متصل به {item.movies_count} فیلم
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>

          <AdminPagination
            pagination={pagination}
            onPageChange={(page) => void loadItems(page)}
            disabled={loading}
          />
        </section>
      </div>
    </div>
  );
}

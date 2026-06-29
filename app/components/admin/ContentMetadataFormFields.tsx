"use client";

import {
  CONTENT_WARNING_OPTIONS,
  toggleStringListValue,
} from "../../lib/content-metadata-options";

type CheckboxGroupProps = {
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  values: string[];
  onChange: (values: string[]) => void;
};

function CheckboxGroup({ label, options, values, onChange }: CheckboxGroupProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-[#8ea4b3]">{label}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const checked = values.includes(option.value);

          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                checked
                  ? "border-[#f5c518]/40 bg-[#f5c518]/10 text-white"
                  : "border-white/10 bg-white/[0.03] text-[#c7d5de] hover:border-white/20"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(toggleStringListValue(values, option.value))}
                className="h-4 w-4 rounded border-white/20 bg-[#071019] text-[#f5c518] focus:ring-[#f5c518]/40"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

type ExternalIdsSectionProps = {
  imdbId: string;
  homepageUrl: string;
  tvdbId?: string;
  onImdbIdChange: (value: string) => void;
  onHomepageUrlChange: (value: string) => void;
  onTvdbIdChange?: (value: string) => void;
};

export function ExternalIdsSection({
  imdbId,
  homepageUrl,
  tvdbId,
  onImdbIdChange,
  onHomepageUrlChange,
  onTvdbIdChange,
}: ExternalIdsSectionProps) {
  const imdbInvalid = imdbId.trim() !== "" && !/^tt\d+$/.test(imdbId.trim());

  return (
    <details className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
      <summary className="cursor-pointer text-sm font-semibold text-white">شناسه‌های خارجی</summary>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm text-[#8ea4b3]">IMDB ID</span>
          <input
            type="text"
            dir="ltr"
            value={imdbId}
            onChange={(event) => onImdbIdChange(event.target.value.trim())}
            placeholder="tt1234567"
            className="w-full rounded-2xl border border-white/10 bg-[#071019] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45"
          />
          {imdbInvalid ? (
            <p className="mt-1 text-xs text-[#fca5a5]">فرمت معتبر: tt و سپس عدد (مثلاً tt0111161)</p>
          ) : null}
        </label>

        {onTvdbIdChange ? (
          <label className="block">
            <span className="mb-2 block text-sm text-[#8ea4b3]">TVDB ID</span>
            <input
              type="text"
              dir="ltr"
              inputMode="numeric"
              value={tvdbId || ""}
              onChange={(event) => onTvdbIdChange(event.target.value.replace(/[^\d]/g, ""))}
              placeholder="12345"
              className="w-full rounded-2xl border border-white/10 bg-[#071019] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45"
            />
          </label>
        ) : null}

        <label className={`block ${onTvdbIdChange ? "md:col-span-2" : ""}`}>
          <span className="mb-2 block text-sm text-[#8ea4b3]">Homepage URL</span>
          <input
            type="url"
            dir="ltr"
            value={homepageUrl}
            onChange={(event) => onHomepageUrlChange(event.target.value)}
            placeholder="https://www.example.com"
            className="w-full rounded-2xl border border-white/10 bg-[#071019] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45"
          />
        </label>
      </div>
    </details>
  );
}

type ContentWarningsFieldProps = {
  values: string[];
  onChange: (values: string[]) => void;
};

export function ContentWarningsField({ values, onChange }: ContentWarningsFieldProps) {
  return (
    <CheckboxGroup
      label="هشدارهای محتوایی"
      options={CONTENT_WARNING_OPTIONS}
      values={values}
      onChange={onChange}
    />
  );
}


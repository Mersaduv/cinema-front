import type { ContentEntryMode } from "../_lib/content-entry-mode";

type EntryModeToggleProps = {
  value: ContentEntryMode;
  onChange: (mode: ContentEntryMode) => void;
  disabled?: boolean;
};

export default function ContentEntryModeToggle({
  value,
  onChange,
  disabled = false,
}: EntryModeToggleProps) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
      <p className="mb-3 text-sm text-[#8ea4b3]">منبع ورود اطلاعات</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("tmdb")}
          className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
            value === "tmdb"
              ? "border-[#38bdf8]/45 bg-[#38bdf8]/15 text-[#8bdcff]"
              : "border-white/10 bg-[#071019] text-[#c7d5de] hover:border-white/20"
          }`}
        >
          از TMDB
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("manual")}
          className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
            value === "manual"
              ? "border-[#f5c518]/45 bg-[#f5c518]/15 text-[#f5c518]"
              : "border-white/10 bg-[#071019] text-[#c7d5de] hover:border-white/20"
          }`}
        >
          خارج از TMDB
        </button>
      </div>
      <p className="mt-3 text-xs leading-6 text-[#728896]">
        {value === "tmdb"
          ? "کد TMDB اجباری است و فیلدها از TMDB پر می‌شوند."
          : "ورود دستی: فیلدهای TMDB مخفی‌اند. عنوان‌ها، slug، درجه سنی، خلاصه، ژانر/کشور/زبان و پوستر/پس‌زمینه اجباری‌اند."}
      </p>
    </div>
  );
}

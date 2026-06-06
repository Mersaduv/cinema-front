"use client";

export default function FilterCheckbox({
  checked,
  onChange,
  label,
  className = "",
}: {
  checked: boolean;
  onChange: () => void;
  label: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-3.5 transition hover:bg-white/[0.04] ${className}`}
    >
      <span className="flex-1 text-right text-[15px] leading-6 text-white/90">{label}</span>
      <span className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
        />
        <span
          className={`absolute inset-0 rounded-md border-2 transition ${
            checked
              ? "border-[#f5c518] bg-[#f5c518]/30 shadow-[0_0_14px_rgba(245,197,24,0.4)]"
              : "border-white/25 bg-[#0f131c] peer-hover:border-[#f5c518]/65"
          }`}
        />
        {checked ? (
          <svg
            viewBox="0 0 16 16"
            className="relative z-10 h-4 w-4 text-[#f5c518]"
            fill="currentColor"
            aria-hidden
          >
            <path d="M6.2 11.6 3.4 8.8l1.2-1.2 1.6 1.6 5-5 1.2 1.2-6.2 6.2z" />
          </svg>
        ) : null}
      </span>
    </label>
  );
}

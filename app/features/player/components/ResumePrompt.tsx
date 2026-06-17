import { memo } from "react";

type ResumePromptProps = {
  label: string;
  onResume: () => void;
  onStartOver: () => void;
};

function ResumePromptComponent({ label, onResume, onStartOver }: ResumePromptProps) {
  return (
    <div
      className="absolute inset-x-0 bottom-24 z-40 flex justify-center px-4 md:bottom-28"
      dir="rtl"
      role="dialog"
      aria-label="ادامه تماشا"
    >
      <div className="flex max-w-lg flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/15 bg-black/80 px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <p className="text-sm text-white/90">از {label} ادامه می‌دهید؟</p>
        <button
          type="button"
          onClick={onResume}
          className="rounded-xl bg-[#ef4444] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#dc2626]"
        >
          ادامه از {label}
        </button>
        <button
          type="button"
          onClick={onStartOver}
          className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
        >
          از ابتدا
        </button>
      </div>
    </div>
  );
}

export const ResumePrompt = memo(ResumePromptComponent);

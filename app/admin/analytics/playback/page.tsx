"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../../../lib/api";
import { formatAfghanShamsiDate } from "../../../lib/date-format";

type QoeSummaryResponse = {
  from: string;
  to: string;
  engine_distribution: Array<{ engine_id: string; sessions: number }>;
  avg_startup_ms: Array<{ platform_family: string; avg_ms: number; count: number }>;
  rebuffer_rate: Array<{
    platform_family: string;
    total_rebuffers: number;
    avg_duration_ms: number;
  }>;
  top_errors: Array<{ error_layer: string | null; error_code: string | null; count: number }>;
};

type DatePreset = "7d" | "30d" | "custom";

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function presetRange(preset: DatePreset): { from: string; to: string } {
  const to = new Date();
  const from = new Date();

  if (preset === "30d") {
    from.setDate(from.getDate() - 30);
  } else {
    from.setDate(from.getDate() - 7);
  }

  return { from: formatDate(from), to: formatDate(to) };
}

function BarRow({
  label,
  value,
  max,
  suffix = "",
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
}) {
  const width = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[#cbd5e1]">{label}</span>
        <span className="font-mono text-white">
          {value}
          {suffix}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[#38bdf8]"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export default function PlaybackAnalyticsPage() {
  const [preset, setPreset] = useState<DatePreset>("7d");
  const [from, setFrom] = useState(() => presetRange("7d").from);
  const [to, setTo] = useState(() => presetRange("7d").to);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<QoeSummaryResponse | null>(null);

  useEffect(() => {
    if (preset !== "custom") {
      const range = presetRange(preset);
      setFrom(range.from);
      setTo(range.to);
    }
  }, [preset]);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      setLoading(true);
      setError("");

      const response = await apiClient.get<QoeSummaryResponse>(
        `/admin/qoe/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        { signal: controller.signal },
      );

      if (controller.signal.aborted) {
        return;
      }

      if (response.success && response.data) {
        setSummary(response.data);
      } else {
        setError(response.message || "دریافت آمار پخش انجام نشد.");
      }

      setLoading(false);
    })();

    return () => controller.abort();
  }, [from, to]);

  const engineMax = useMemo(
    () =>
      Math.max(
        ...(summary?.engine_distribution.map((row) => Number(row.sessions)) ?? [1]),
        1,
      ),
    [summary],
  );

  const startupMax = useMemo(
    () =>
      Math.max(
        ...(summary?.avg_startup_ms.map((row) => Number(row.avg_ms)) ?? [1]),
        1,
      ),
    [summary],
  );

  const engineTotal = useMemo(
    () =>
      (summary?.engine_distribution ?? []).reduce(
        (sum, row) => sum + Number(row.sessions),
        0,
      ),
    [summary],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">تحلیل کیفیت پخش (QoE)</h1>
            <p className="mt-2 text-sm text-[#8ea4b3]">
              موتور پخش، زمان شروع، ری‌بافر و خطاهای جلسات تماشا
            </p>
            <p className="mt-2 text-xs text-[#6f8795]">
              بازه انتخاب‌شده: {formatAfghanShamsiDate(from)} تا {formatAfghanShamsiDate(to)}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            {(["7d", "30d", "custom"] as DatePreset[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPreset(value)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  preset === value
                    ? "bg-[#38bdf8] text-black"
                    : "border border-white/10 bg-white/[0.04] text-white hover:border-white/20"
                }`}
              >
                {value === "7d" ? "۷ روز" : value === "30d" ? "۳۰ روز" : "سفارشی"}
              </button>
            ))}

            {preset === "custom" ? (
              <>
                <label className="text-sm text-[#8ea4b3]">
                  از
                  <input
                    type="date"
                    value={from}
                    onChange={(event) => setFrom(event.target.value)}
                    className="mt-1 block rounded-xl border border-white/10 bg-[#071019] px-3 py-2 text-white"
                  />
                </label>
                <label className="text-sm text-[#8ea4b3]">
                  تا
                  <input
                    type="date"
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                    className="mt-1 block rounded-xl border border-white/10 bg-[#071019] px-3 py-2 text-white"
                  />
                </label>
              </>
            ) : null}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-8 text-center text-[#8ea4b3]">
          در حال بارگذاری آمار...
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-[28px] border border-red-500/20 bg-red-500/10 p-6 text-red-200">
          {error}
        </div>
      ) : null}

      {!loading && summary ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">توزیع موتور پخش</h2>
            <div className="space-y-4">
              {(summary.engine_distribution ?? []).map((row) => (
                <BarRow
                  key={row.engine_id}
                  label={row.engine_id}
                  value={Number(row.sessions)}
                  max={engineMax}
                />
              ))}
              {summary.engine_distribution.length === 0 ? (
                <p className="text-sm text-[#8ea4b3]">داده‌ای در این بازه ثبت نشده است.</p>
              ) : null}
            </div>
            {engineTotal > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {summary.engine_distribution.map((row) => {
                  const pct = Math.round((Number(row.sessions) / engineTotal) * 100);

                  return (
                    <span
                      key={row.engine_id}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs text-[#cbd5e1]"
                    >
                      {row.engine_id}: {pct}%
                    </span>
                  );
                })}
              </div>
            ) : null}
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              میانگین زمان شروع بر اساس پلتفرم
            </h2>
            <div className="space-y-4">
              {(summary.avg_startup_ms ?? []).map((row) => (
                <BarRow
                  key={row.platform_family}
                  label={row.platform_family}
                  value={Math.round(Number(row.avg_ms))}
                  max={startupMax}
                  suffix=" ms"
                />
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">نرخ ری‌بافر</h2>
            <div className="space-y-3">
              {(summary.rebuffer_rate ?? []).map((row) => (
                <div
                  key={row.platform_family}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                >
                  <div className="font-medium text-white">{row.platform_family}</div>
                  <div className="mt-1 text-sm text-[#8ea4b3]">
                    مجموع ری‌بافر: {Number(row.total_rebuffers) || 0} — میانگین مدت:{" "}
                    {Math.round(Number(row.avg_duration_ms) || 0)} ms
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">۲۰ خطای برتر</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[#8ea4b3]">
                    <th className="px-3 py-2 text-right">لایه</th>
                    <th className="px-3 py-2 text-right">کد</th>
                    <th className="px-3 py-2 text-right">تعداد</th>
                  </tr>
                </thead>
                <tbody>
                  {(summary.top_errors ?? []).map((row, index) => (
                    <tr key={`${row.error_layer}-${row.error_code}-${index}`} className="border-b border-white/5">
                      <td className="px-3 py-2 text-white">{row.error_layer || "—"}</td>
                      <td className="px-3 py-2 font-mono text-[#cbd5e1]">
                        {row.error_code || "—"}
                      </td>
                      <td className="px-3 py-2 text-white">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

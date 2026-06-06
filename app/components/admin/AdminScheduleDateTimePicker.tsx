"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HiOutlineCalendar, HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi";
import {
  buildGregorianDateTime,
  formatGregorianDateTimeLong,
  gregorianMonthFirstWeekday,
  gregorianMonthLabel,
  gregorianMonthLength,
  gregorianWeekdayLabels,
  readGregorianScheduleParts,
} from "../../lib/date-format";

export default function AdminScheduleDateTimePicker({
  label,
  value,
  onChange,
  minDateTime,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minDateTime?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const initial = readGregorianScheduleParts(value);
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);
  const [selectedDay, setSelectedDay] = useState(initial.day);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);

  useEffect(() => {
    const parts = readGregorianScheduleParts(value);
    setViewYear(parts.year);
    setViewMonth(parts.month);
    setSelectedDay(parts.day);
    setHour(parts.hour);
    setMinute(parts.minute);
  }, [value]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);

    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const monthDays = useMemo(() => {
    const length = gregorianMonthLength(viewYear, viewMonth);
    const offset = gregorianMonthFirstWeekday(viewYear, viewMonth);
    const cells: Array<number | null> = [];

    for (let index = 0; index < offset; index += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= length; day += 1) {
      cells.push(day);
    }

    return cells;
  }, [viewMonth, viewYear]);

  const applySelection = (day: number, nextHour = hour, nextMinute = minute) => {
    const nextValue = buildGregorianDateTime(viewYear, viewMonth, day, nextHour, nextMinute);

    if (minDateTime && nextValue < minDateTime) {
      return;
    }

    onChange(nextValue);
    setSelectedDay(day);
    setHour(nextHour);
    setMinute(nextMinute);
  };

  const goToPreviousMonth = () => {
    if (viewMonth === 1) {
      setViewYear((current) => current - 1);
      setViewMonth(12);
      return;
    }

    setViewMonth((current) => current - 1);
  };

  const goToNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((current) => current + 1);
      setViewMonth(1);
      return;
    }

    setViewMonth((current) => current + 1);
  };

  const selectedParts = readGregorianScheduleParts(value);

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-2 block text-sm text-[#8ea4b3]">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#071019] px-4 py-3 text-sm text-white transition hover:border-[#f5c518]/35"
        dir="ltr"
      >
        <span className={value ? "text-left text-white" : "text-left text-[#607684]"}>
          {formatGregorianDateTimeLong(value)}
        </span>
        <HiOutlineCalendar className="h-5 w-5 shrink-0 text-[#f8d977]" />
      </button>

      {open ? (
        <div
          className="absolute z-40 mt-2 w-full min-w-[320px] overflow-hidden rounded-[24px] border border-white/10 bg-[#0b1720] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
          dir="ltr"
        >
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/80 transition hover:bg-white/[0.06]"
              aria-label="Previous month"
            >
              <HiOutlineChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-bold text-white">{gregorianMonthLabel(viewYear, viewMonth)}</p>
            <button
              type="button"
              onClick={goToNextMonth}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/80 transition hover:bg-white/[0.06]"
              aria-label="Next month"
            >
              <HiOutlineChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-[#8ea4b3]">
            {gregorianWeekdayLabels().map((weekday) => (
              <span key={weekday} className="py-1 font-semibold">
                {weekday}
              </span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {monthDays.map((day, index) =>
              day ? (
                <button
                  key={`${viewYear}-${viewMonth}-${day}`}
                  type="button"
                  onClick={() => applySelection(day)}
                  className={`rounded-xl py-2 text-sm font-semibold transition ${
                    selectedDay === day &&
                    selectedParts.month === viewMonth &&
                    selectedParts.year === viewYear
                      ? "bg-[#f5c518] text-[#081018]"
                      : "text-white/85 hover:bg-white/[0.08]"
                  }`}
                >
                  {day}
                </button>
              ) : (
                <span key={`empty-${index}`} />
              ),
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block text-xs text-[#8ea4b3]">
              Hour
              <select
                value={hour}
                onChange={(event) => {
                  const nextHour = Number(event.target.value);
                  setHour(nextHour);
                  if (selectedDay) {
                    applySelection(selectedDay, nextHour, minute);
                  }
                }}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#071019] px-3 py-2 text-sm text-white outline-none"
              >
                {Array.from({ length: 24 }, (_, index) => (
                  <option key={index} value={index}>
                    {String(index).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-[#8ea4b3]">
              Minute
              <select
                value={minute}
                onChange={(event) => {
                  const nextMinute = Number(event.target.value);
                  setMinute(nextMinute);
                  if (selectedDay) {
                    applySelection(selectedDay, hour, nextMinute);
                  }
                }}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#071019] px-3 py-2 text-sm text-white outline-none"
              >
                {Array.from({ length: 60 }, (_, index) => (
                  <option key={index} value={index}>
                    {String(index).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-4 w-full rounded-2xl bg-[#f5c518] px-4 py-2.5 text-sm font-bold text-[#081018] transition hover:bg-[#e8bb0d]"
          >
            Confirm
          </button>
        </div>
      ) : null}
    </div>
  );
}

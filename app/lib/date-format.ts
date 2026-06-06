const GREGORIAN_LOCALE = "en-GB";

export function parseDateTime(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parsed = new Date(`${trimmed}T00:00:00`);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    const [datePart, timePart] = trimmed.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute] = timePart.split(":").map(Number);
    const local = new Date(year, month - 1, day, hour, minute, 0, 0);

    return Number.isNaN(local.getTime()) ? null : local;
  }

  const parsed = new Date(trimmed.replace(" ", "T"));

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toDateTimeInputValue(date: Date): string {
  const pad = (part: number) => String(part).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Converts API ISO datetime (often UTC) to local `YYYY-MM-DDTHH:mm` for schedule inputs. */
export function apiDateTimeToInputValue(value: string | null | undefined): string {
  const date = parseDateTime(value);

  return date ? toDateTimeInputValue(date) : "";
}

export function formatGregorianDate(value: string | null | undefined): string {
  const date = parseDateTime(value);

  if (!date) {
    return "نامشخص";
  }

  return new Intl.DateTimeFormat(GREGORIAN_LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatGregorianDateTime(value: string | null | undefined): string {
  const date = parseDateTime(value);

  if (!date) {
    return "نامشخص";
  }

  return new Intl.DateTimeFormat(GREGORIAN_LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatGregorianDateTimeLong(value: string | null | undefined): string {
  const date = parseDateTime(value);

  if (!date) {
    return "Select date and time";
  }

  return new Intl.DateTimeFormat(GREGORIAN_LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function gregorianMonthLength(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function gregorianMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat(GREGORIAN_LOCALE, {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export function gregorianWeekdayLabels(): string[] {
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
}

export function gregorianMonthFirstWeekday(year: number, month: number): number {
  const weekday = new Date(year, month - 1, 1).getDay();

  return weekday === 0 ? 6 : weekday - 1;
}

export function buildGregorianDateTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): string {
  return toDateTimeInputValue(new Date(year, month - 1, day, hour, minute, 0));
}

export function readGregorianScheduleParts(value: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const base = parseDateTime(value) ?? new Date(Date.now() + 60 * 60 * 1000);

  return {
    year: base.getFullYear(),
    month: base.getMonth() + 1,
    day: base.getDate(),
    hour: base.getHours(),
    minute: base.getMinutes(),
  };
}

// Backward-compatible aliases used by schedule picker imports
export const parseScheduleDateTime = parseDateTime;
export const toScheduleDateTimeInputValue = toDateTimeInputValue;
export const formatScheduleDateTimeFa = formatGregorianDateTimeLong;
export const buildScheduleDateTime = buildGregorianDateTime;
export const readScheduleParts = readGregorianScheduleParts;

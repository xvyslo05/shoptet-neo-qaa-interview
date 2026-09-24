import calendarData from "./data/calendar.json" with { type: "json" };

export interface MonthDay {
  day: number;
  month: number;
}

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

// Name-day data lives in ./data/calendar.json: CALENDAR[month - 1][day - 1]
// lists the names for that date. It is a static JSON module import (no fs
// read), so it bundles the same way for Node, Vite/MSW and Cypress.
const CALENDAR: readonly (readonly string[])[][] = calendarData;

if (
  CALENDAR.length !== DAYS_IN_MONTH.length ||
  CALENDAR.some(
    (month, monthIndex) =>
      month.length !== DAYS_IN_MONTH[monthIndex] ||
      month.some(
        (names) =>
          !Array.isArray(names) ||
          names.some((name) => typeof name !== "string" || name === ""),
      ),
  )
) {
  throw new Error("calendar.json does not match the expected month/day shape");
}

interface NameEntry {
  canonicalName: string;
  dates: MonthDay[];
}

export function normalizeName(name: string): string {
  return name
    .trim()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("cs-CZ");
}

const NAME_INDEX = new Map<string, NameEntry>();

for (const [monthIndex, month] of CALENDAR.entries()) {
  for (const [dayIndex, names] of month.entries()) {
    for (const canonicalName of names) {
      const normalizedName = normalizeName(canonicalName);
      const entry = NAME_INDEX.get(normalizedName);
      const date = { day: dayIndex + 1, month: monthIndex + 1 };

      if (entry === undefined) {
        NAME_INDEX.set(normalizedName, { canonicalName, dates: [date] });
      } else {
        entry.dates.push(date);
      }
    }
  }
}

export function namesForDate(day: number, month: number): string[] | null {
  if (
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > DAYS_IN_MONTH.length ||
    day < 1 ||
    day > DAYS_IN_MONTH[month - 1]
  ) {
    return null;
  }

  return [...CALENDAR[month - 1][day - 1]];
}

export function datesForName(name: string): MonthDay[] {
  const entry = NAME_INDEX.get(normalizeName(name));
  return entry?.dates.map((date) => ({ ...date })) ?? [];
}

export function canonicalNameFor(name: string): string | null {
  return NAME_INDEX.get(normalizeName(name))?.canonicalName ?? null;
}

export function parseDate(value: string): MonthDay | null {
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const czechMatch = /^(\d{1,2})\. ?(\d{1,2})(?:\. ?(\d{4})|\.)?$/.exec(
    value,
  );

  const day = Number(isoMatch?.[3] ?? czechMatch?.[1]);
  const month = Number(isoMatch?.[2] ?? czechMatch?.[2]);
  const yearText = isoMatch?.[1] ?? czechMatch?.[3];

  if (
    (isoMatch === null && czechMatch === null) ||
    namesForDate(day, month) === null
  ) {
    return null;
  }

  if (day === 29 && month === 2 && yearText !== undefined) {
    const year = Number(yearText);
    const isLeapYear =
      year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

    if (!isLeapYear) {
      return null;
    }
  }

  return { day, month };
}

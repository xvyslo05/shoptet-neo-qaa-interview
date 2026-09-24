/**
 * @description Pure helpers that compute expected nameday results from
 * backend/src/engine.ts — an independent oracle so the spec never hardcodes
 * a date, a name, or the resulting Czech text.
 */
import { canonicalNameFor, datesForName, namesForDate } from "@qaa/backend/engine";

import { NamedayNames } from "../enums/NamedayNames";
import { toIsoDateString } from "./dates";

/**
 * @param day {number}
 * @param month {number}
 * @returns {string} Czech date format, e.g. "7.3."
 */
export const formatCzechDate = (day: number, month: number): string => {
  return `${day}.${month}.`;
};

/**
 * @returns {{ czechDate: string, isoDate: string, expectedResult: string }}
 *   Today's date in Czech format (for the text input) and ISO format (for
 *   the native date picker), plus the exact result text the app should
 *   render for it. Both date strings are derived from the same `Date`
 *   instance, so they can never disagree about which calendar day "today"
 *   is. Computed from the real calendar, not a fixed date, so the
 *   assertion holds regardless of which day the suite runs on.
 */
export const todaysDateLookup = () => {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;
  const names = namesForDate(day, month) ?? [];
  const czechDate = formatCzechDate(day, month);
  const isoDate = toIsoDateString(today);
  const expectedResult =
    names.length === 0
      ? `${czechDate} nemá svátek žádné jméno.`
      : `${czechDate} má svátek ${names.join(" a ")}.`;

  return { czechDate, isoDate, expectedResult };
};

/**
 * @returns {{ name: string, expectedResult: string }} A name picked at
 *   random from NamedayNames on every run — so the suite doesn't always
 *   exercise the same one name — and the exact result text the app should
 *   render for it.
 */
export const randomNameLookup = () => {
  const names = Object.values(NamedayNames);
  const name = names[Math.floor(Math.random() * names.length)];
  const canonicalName = canonicalNameFor(name) ?? name;
  const formattedDates = datesForName(name)
    .map(({ day, month }) => formatCzechDate(day, month))
    .join(", ");

  return { name, expectedResult: `${canonicalName} má svátek ${formattedDates}` };
};

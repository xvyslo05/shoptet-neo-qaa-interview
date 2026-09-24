/**
 * @param date {Date}
 * @returns {string} Local-date ISO string (YYYY-MM-DD) for a native
 *   <input type="date">. Not `date.toISOString()`, which converts to UTC
 *   first and can land on a different calendar day than the local
 *   getDate()/getMonth() used elsewhere for the same `date` instance.
 */
export const toIsoDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

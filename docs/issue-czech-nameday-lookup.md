# Czech name-day lookup

One page. The user enters **either a date or a first name** and sees who celebrates that day, or on which day that name celebrates. Czech only. No login. The calendar cannot be edited.

**Page:** title `České svátky`. Date text (`Datum`, placeholder `např. 7.3.`) and a date picker (`Vybrat datum`), then `nebo`, then name (`Jméno`, placeholder `např. Tomáš`). Buttons: `Potvrdit`, `Reset`. One answer under the form, and one error. The answer is announced politely. The error is an alert.

Both fields stay editable. Filling one does not clear or disable the other.

---

## AC1 — Date → names

Submit **only a date**. Show every name for that day. The date in the answer is always `D.M.` (no leading zeros), whatever the user typed.

| Input | Answer |
|---|---|
| `7.3.` | `7.3. má svátek Tomáš.` |
| `7.4.` | `7.4. má svátek Heřman a Hermína.` |
| `1.1.` | `1.1. nemá svátek žádné jméno.` |

Several names are joined with ` a `. A date answer **ends with a period**.

## AC2 — Name → dates

Submit **only a name**. Show the official spelling and every date, in calendar order, as `D.M.`, separated by `, `.

| Input | Answer |
|---|---|
| `Tomáš` | `Tomáš má svátek 7.3.` |
| `Petr` | `Petr má svátek 22.2., 29.6.` |

Petr is the only name with two dates. A name answer **does not** end with a period.

## AC3 — How a name matches

Ignore surrounding spaces, letter case, and Czech diacritics. The answer uses the official spelling, not the typed text. The whole name must match; a part of a name does not.

`tomas` and `  TOMÁŠ  ` both answer as Tomáš.

## AC4 — Dates the user may type

All of these are 7 March. A year is ignored, except for 29 February (AC6).

`7.3.` · `7.3` · `07.03.` · `7.3.2024` · `7. 3. 2024` (one space after a dot) · `2024-03-07` (ISO, also what the date picker produces)

## AC5 — Date that does not exist

Submit only a bad date → error `Zadané datum není platné.`

Not valid: `32.1.`, `31.4.`, day `0`, month `0`, month `13`, `not-a-date`, `-1.5.`

Valid edges: `31.1.`, `30.4.`, day `1`, month `12`.

## AC6 — 29 February

| Input | Result |
|---|---|
| `29.2.` or `29.2` (no year) | Valid |
| `29.2.2024`, `2024-02-29` | Valid (leap year) |
| `29.2.2000` | Valid (divisible by 400) |
| `29.2.2023`, `2023-02-29` | Invalid |
| `29.2.1900` | Invalid (divisible by 100, not by 400) |

Same rule for Czech text and ISO.

## AC7 — Unknown name

Submit only a name that is not in the calendar → `Jméno nebylo v kalendáři nalezeno.`

There is no “too long” error. A name longer than any calendar entry is simply not found. Example: `Xyzabc`.

## AC8 — Empty submit

Both fields empty → `Zadejte datum nebo jméno.`

Empty means no characters. Spaces alone are **not** empty: a date of only spaces is AC5; a name of only spaces is AC7. Spaces around a real name are AC3.

## AC9 — Both fields filled

Something in **both** fields → `Zadejte pouze datum, nebo pouze jméno.`

This is checked **before** the values are validated. A nonsense date plus a name is still this error, not AC5. The page does not block the submit; it shows the lookup error.

## AC10 — Date text and date picker

- Typing in the date text **clears the picker**.
- Using the picker **replaces the date text** with the picker value (`YYYY-MM-DD`). It does not clear the text.

## AC11 — Reset

Reset clears the date text, the picker, the name, the answer, and the error. It does not send a new lookup. A reply that arrives after Reset is ignored.

## AC12 — Overlapping lookups

Submit again before the previous lookup finishes → only the **latest** reply is shown, even if the older one arrives last. A new submit clears the previous answer and error immediately.

## AC13 — Other failures

Known errors (AC5, AC7, AC8, AC9) show the message from the lookup. Any other failed response shows `Požadavek selhal se stavem {status}.` A network failure shows that failure’s message. The page does not crash. On every failure the answer area is empty.

## AC14 — Lookup API

`GET /api/nameday` with exactly one of `date` or `name`. Omit a field that is empty.

| Situation | HTTP | Code | Message |
|---|---|---|---|
| No `date` and no `name` | 400 | `MISSING_QUERY` | Zadejte datum nebo jméno. |
| Both present (even if empty or invalid) | 400 | `AMBIGUOUS_QUERY` | Zadejte pouze datum, nebo pouze jméno. |
| `date` is not a real date | 400 | `INVALID_DATE` | Zadané datum není platné. |
| `name` is not in the calendar | 404 | `NAME_NOT_FOUND` | Jméno nebylo v kalendáři nalezeno. |

“Present” means the parameter was sent, including `name=`.

Success, date — `200` `{ "type": "date", "date": { "day": 7, "month": 3 }, "names": ["Tomáš"] }`. `names` may be `[]`.

Success, name — `200` `{ "type": "name", "name": "Tomáš", "dates": [{ "day": 7, "month": 3 }] }`. `name` is the official spelling. `dates` has at least one entry.

Failure — `{ "error": { "code": "INVALID_DATE", "message": "Zadané datum není platné." } }`.

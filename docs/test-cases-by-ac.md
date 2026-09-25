# Test cases — Czech name-day lookup

Source: `docs/issue-czech-nameday-lookup.md`. One case per rule in that task. Expected results use only what the task states.

| ID | AC | Level | Test data / steps | Expected |
|---|---|---|---|---|
| TC-01 | AC1 | API | Submit only `7.3.` | 200. Answer `7.3. má svátek Tomáš.` |
| TC-02 | AC1 | API | Submit only `7.4.` | 200. Answer `7.4. má svátek Heřman a Hermína.` |
| TC-03 | AC1 | API | Submit only `1.1.` | 200. Answer `1.1. nemá svátek žádné jméno.` Names list is empty. |
| TC-04 | AC1 | E2E | Submit `07.03.` (leading zeros) | Answer date is `7.3.`, not `07.03.` Sentence ends with `.` |
| TC-05 | AC2 | API | Submit only `Tomáš` | 200. Answer `Tomáš má svátek 7.3.` No period at the end. |
| TC-06 | AC2 | API | Submit only `Petr` | 200. Answer `Petr má svátek 22.2., 29.6.` Both dates, calendar order, no final period. |
| TC-07 | AC3 | API | Submit `tomas` | Same answer as Tomáš: `Tomáš má svátek 7.3.` |
| TC-08 | AC3 | API | Submit `  TOMÁŠ  ` | Same answer as Tomáš. Official spelling, spaces ignored. |
| TC-09 | AC3 | API | Submit `Tom` | Not a match. `Jméno nebylo v kalendáři nalezeno.` |
| TC-10 | AC4 | API | Submit each of `7.3.`, `7.3`, `07.03.`, `7.3.2024`, `7. 3. 2024`, `2024-03-07` | Each returns the Tomáš answer for 7 March. The year on a normal date is ignored. |
| TC-11 | AC4 | E2E | Pick 7 March in the date picker and submit | Picker value is `YYYY-MM-DD`. Answer is `7.3. má svátek Tomáš.` |
| TC-12 | AC5 | API | Submit only `32.1.` | `Zadané datum není platné.` |
| TC-13 | AC5 | API | Submit only `31.4.` | `Zadané datum není platné.` |
| TC-14 | AC5 | API | Submit only `0.5.` | `Zadané datum není platné.` |
| TC-15 | AC5 | API | Submit only `7.0.` | `Zadané datum není platné.` |
| TC-16 | AC5 | API | Submit only `7.13.` | `Zadané datum není platné.` |
| TC-17 | AC5 | API | Submit only `not-a-date` | `Zadané datum není platné.` |
| TC-18 | AC5 | API | Submit only `-1.5.` | `Zadané datum není platné.` |
| TC-19 | AC5 | API | Submit only `31.1.` | Valid. Not the invalid-date error. Answer date is `31.1.` |
| TC-20 | AC5 | API | Submit only `30.4.` | Valid. Not the invalid-date error. Answer date is `30.4.` |
| TC-21 | AC5 | API | Submit only `1.5.` | Valid. Answer date is `1.5.` |
| TC-22 | AC5 | API | Submit only `7.12.` | Valid. Answer date is `7.12.` |
| TC-23 | AC6 | API | Submit `29.2.` and `29.2` | Both valid. Not the invalid-date error. |
| TC-24 | AC6 | API | Submit `29.2.2024` and `2024-02-29` | Both valid. |
| TC-25 | AC6 | API | Submit `29.2.2000` | Valid. |
| TC-26 | AC6 | API | Submit `29.2.2023` and `2023-02-29` | Both `Zadané datum není platné.` |
| TC-27 | AC6 | API | Submit `29.2.1900` | `Zadané datum není platné.` |
| TC-28 | AC7 | API | Submit only `Xyzabc` | `Jméno nebylo v kalendáři nalezeno.` |
| TC-29 | AC7 | API | Submit a name longer than any calendar entry, e.g. `Xyzabcdefgh` | Same not-found message. No separate “too long” error. |
| TC-30 | AC8 | API | Submit with both fields empty | `Zadejte datum nebo jméno.` No `date` or `name` parameter is sent. |
| TC-31 | AC8 | API | Submit a date of only spaces | Not treated as empty. `Zadané datum není platné.` |
| TC-32 | AC8 | API | Submit a name of only spaces | Not treated as empty. `Jméno nebylo v kalendáři nalezeno.` |
| TC-33 | AC9 | E2E | Fill `7.3.` and `Tomáš`, then submit | Page does not block it. Error `Zadejte pouze datum, nebo pouze jméno.` |
| TC-34 | AC9 | API | Send `date=garbage` and `name=Tomáš` | Same ambiguous-query error, not the invalid-date error. |
| TC-35 | AC9 | API | Send `date=garbage` and `name=` (name present but empty) | Same ambiguous-query error. |
| TC-36 | AC10 | Component | Type a date, then pick a day | Date text becomes the picker value `YYYY-MM-DD`. It is not cleared. |
| TC-37 | AC10 | Component | Pick a day, then type in the date text | Picker is cleared. Name field is unchanged. |
| TC-38 | AC11 | E2E | Get an answer and an error in two tries. Press Reset after each. | Date text, picker, name, answer, and error are all empty. Reset sends no lookup. |
| TC-39 | AC11 | Component | Submit, press Reset before the reply arrives, then let it arrive | Answer and error stay empty. |
| TC-40 | AC12 | Component | Submit A, then submit B before A returns. Return B first, then A. | Only B is shown. A does not replace it. |
| TC-41 | AC12 | Component | Show an answer, then submit again | Previous answer and error disappear as soon as the new submit starts, before the reply. |
| TC-42 | AC13 | E2E | Trigger AC5, AC7, AC8, and AC9 | Each shows that rule’s own message. Answer area is empty. Page does not crash. |
| TC-43 | AC13 | Component | Lookup returns HTTP 500 with a body that is not the error shape | `Požadavek selhal se stavem 500.` Answer area is empty. |
| TC-44 | AC13 | Component | Lookup fails with no response (network failure) | That failure’s message is shown. Answer area is empty. Page does not crash. |
| TC-45 | AC14 | API | `GET /api/nameday` with no parameters | 400 `MISSING_QUERY`, message `Zadejte datum nebo jméno.` |
| TC-46 | AC14 | API | `GET /api/nameday?date=7.3.&name=Tomáš` | 400 `AMBIGUOUS_QUERY`, message `Zadejte pouze datum, nebo pouze jméno.` |
| TC-47 | AC14 | API | `GET /api/nameday?date=32.1.` | 400 `INVALID_DATE`, message `Zadané datum není platné.` |
| TC-48 | AC14 | API | `GET /api/nameday?name=Xyzabc` | 404 `NAME_NOT_FOUND`, message `Jméno nebylo v kalendáři nalezeno.` |
| TC-49 | AC14 | API | `GET /api/nameday?date=7.3.` | 200 `{ "type": "date", "date": { "day": 7, "month": 3 }, "names": ["Tomáš"] }` |
| TC-50 | AC14 | API | `GET /api/nameday?date=1.1.` | 200, `type` `date`, `names` is `[]` |
| TC-51 | AC14 | API | `GET /api/nameday?name=Tomáš` | 200 `{ "type": "name", "name": "Tomáš", "dates": [{ "day": 7, "month": 3 }] }` |
| TC-52 | AC14 | API | `GET /api/nameday?name=` | `name` was sent, so it is present. 404 `NAME_NOT_FOUND`. |

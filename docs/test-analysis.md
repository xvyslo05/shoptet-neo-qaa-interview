# Test analysis — Czech Name-Day Lookup

Derived using the `st-test-analysis` methodology (equivalence partitioning, boundary value analysis, decision tables, systematic negative/edge cases). No Jira ticket exists for this app — acceptance criteria were reconstructed from the app's actual behavior, since this repo is a QAA interview exercise and ships no ACs and no tests by design. CMS4-specific steps of the source methodology (Jira/Confluence publishing, `TC-<TICKET-KEY>` ID format) are omitted; test case IDs use `TC-NAMEDAY-nnn` instead.

## 1. Source & scope

Behavior and acceptance criteria were reconstructed by reading `backend/src/engine.ts`, `backend/src/app.ts`, `frontend/src/NamedayForm.tsx`, `frontend/src/api.ts`, and `contracts/openapi.yaml`.

**Out of scope:** visual regression, performance, i18n beyond Czech, security/auth (the app has none).

### Acceptance criteria (input to the analysis)

| AC | Description |
|---|---|
| AC1 | Lookup by date → returns names celebrating that day (0, 1, or several) |
| AC2 | Lookup by name → returns the canonical name's date(s) |
| AC3 | Name matching ignores case, diacritics, and surrounding whitespace |
| AC4 | Accepted date formats: `D.M.`, `D.M`, `DD.MM.`, `D.M.YYYY` (optional space after dot), ISO `YYYY-MM-DD`, native date picker |
| AC5 | Non-existent calendar date → `INVALID_DATE` |
| AC6 | 29.2. valid only in leap years when a year is given; valid unconditionally without a year |
| AC7 | Unknown name → `NAME_NOT_FOUND` |
| AC8 | Neither field filled → `MISSING_QUERY` |
| AC9 | Both fields filled → `AMBIGUOUS_QUERY` |
| AC10 | Typing in the date text field clears the picker; using the picker overwrites the date text field with the picker's value (not a mutual clear — asymmetric). Name field is independent (not disabled) — combines with AC9 for the overlap case |
| AC11 | Reset clears both fields, result, error, and invalidates in-flight requests |
| AC12 | Only the latest submitted request's response is shown; stale responses are discarded |
| AC13 | Result-text rendering rules for date→names and name→dates, including the zero-name day |
| AC14 | Error display covers 400/404 API errors *and* unexpected 5xx / malformed body / network failure — always shown as a message, never a crash, previous result cleared |
| AC15 | Name longer than the longest calendar entry (10 chars) → `NAME_NOT_FOUND`; no separate length validation exists |

### Open questions (carried into the analysis, not resolved)

**Question 1** — A field containing only whitespace (e.g. `"   "`) is **not** treated as empty by the frontend (only an exact `""` is converted to "field omitted"), so it's sent to the API as-is. For `name` this normalizes to `""`, matches nothing, and returns `NAME_NOT_FOUND`. For `date` it fails every format regex and returns `INVALID_DATE`. Is this the intended behavior, or should a whitespace-only field count as empty (→ `MISSING_QUERY`)? Flagging rather than assuming — the behavior is deterministic but arguably confusing to a user who typed a stray space thinking they'd cleared the field.

## 2. Decomposed ACs

Each AC split into atomic, testable conditions — one condition, one observable behavior under one circumstance.

| AC | Atomic conditions |
|---|---|
| AC1 | **a** one name on the date · **b** multiple names on the date · **c** zero names on the date (e.g. `1.1.`) |
| AC2 | **a** name maps to one date · **b** name maps to multiple dates (`Petr` → 22.2. and 29.6.) |
| AC3 | **a** case-insensitive · **b** diacritics-insensitive · **c** trims whitespace · **d** returns canonical spelling regardless of input casing |
| AC4 | **a–g** one per format variant: `D.M.` / `D.M` / `DD.MM.` / `D.M.YYYY` / optional space / ISO / native picker |
| AC5 | **a** day out of range for month · **b** month out of range · **c** zero/negative day or month · **d** unparsable garbage string · **e** malformed query shape — a repeated `date` param arrives as an array, not a string (found during code review, *Delinquent* lens) |
| AC6 | **a** leap year, year given · **b** non-leap year, year given · **c** no year given · **d** century-rule boundary (1900 vs 2000) |
| AC7 | **a** unknown name · **b** malformed query shape — a repeated `name` param arrives as an array, not a string (found during code review, *Delinquent* lens) |
| AC8 | single condition |
| AC9 | **a** both filled, both valid · **b** both filled, one/both invalid (⚠ tests that the ambiguity check pre-empts validity checks, per `app.ts` code order) |
| AC10 | **a** typing date text clears the picker · **b** using the picker overwrites the date text field with the picker's value (verified against `NamedayForm.tsx`: `onChange` sets `date` to the picker's own value, it does not clear it to empty) · **c** name field stays populated when date is entered (feeds AC9) |
| AC11 | **a** clears fields/result/error · **b** invalidates a stale in-flight request |
| AC12 | single condition (race/staleness) |
| AC13 | **a** date→name singular · **b** date→names plural ("a"-joined) · **c** date→zero names · **d** name→dates rendering |
| AC14 | **a** 400/404 recognized error shape · **b** unexpected status/malformed body · **c** network-level failure |
| AC15 | single condition (boundary, folds into AC7's negative space) |

## 3. Technique artefacts

### Decision table — query parameter combination

Drives AC1 / AC2 / AC5 / AC7 / AC8 / AC9. Matches the actual code order in `app.ts`, where the ambiguity check runs *before* either value is validated.

| Rule | hasDate | hasName | dateValid | nameFound | → Result |
|---|---|---|---|---|---|
| R1 | N | N | – | – | 400 `MISSING_QUERY` |
| R2 | Y | Y | – | – | 400 `AMBIGUOUS_QUERY` (collapses 4 sub-rules — neither value is inspected once both are present) |
| R3 | Y | N | Y | – | 200 date result |
| R4 | Y | N | N | – | 400 `INVALID_DATE` |
| R5 | N | Y | – | Y | 200 name result |
| R6 | N | Y | – | N | 404 `NAME_NOT_FOUND` |

### Boundary value analysis — date components

- Day: min−1 / min / min+1 … max−1 / max / max+1 per representative month (Jan=31, Apr=30, Feb=29 leap-dependent)
- Month: 0 / 1 / 2 … 12 / 13
- Year for 29.2.: 1900 (÷100, not ÷400 → not leap), 2000 (÷400 → leap), 2023, 2024 — the century rule needs both a ÷100 and a non-÷100 case, which a naive "÷4" test would miss
- Name length: 10 (longest real entry) / 11 (one over) — AC15

### State-transition & pairwise testing

**State-transition:** not applicable — no entity has a lifecycle or status; the calendar is static, the API stateless per request. **Pairwise:** not applicable — no multi-dimensional configuration space (no role × locale × browser matrix); exactly one input axis at a time. Both excluded explicitly rather than skipped.

### Scenario / use-case (ordered UI flow)

Main path: fill one field → submit → see result. Alternate: submit with error → correct → resubmit. Alternate: fill → Reset → refill differently → submit. Exception: double-submit before the first response returns (AC12); submit then Reset before the response returns (AC11.b + AC12 interaction).

### Negative / edge checklist

Invalid/empty/max input — covered (AC5, AC8, AC15). Malformed query shape (a repeated param arriving as an array instead of a string) — AC5.e/AC7.b. Encoding & Unicode — NFC vs. NFD normalization form of the same name, both must match. Permissions/roles, time zones/locale/currency, back-navigation, data mutated elsewhere — all N/A, consciously excluded (no auth, no time component, single-page form, static read-only data). Network failure/timeouts — AC14.c. A11y — labels, `aria-live`, `role="alert"` — one manual check.

## 4. Test cases

`ID | AC ref | Technique | Priority | Layer | Mode | Steps / test data | Expected result`

| ID | AC | Technique | Priority | Layer | Mode | Steps & test data | Expected result |
|---|---|---|---|---|---|---|---|
| TC-NAMEDAY-001 | AC4.a | EP | P1 | unit | auto | `parseDate("7.3.")` | Returns `{day:7, month:3}` |
| TC-NAMEDAY-002 | AC4.b | EP | P2 | unit | auto | `parseDate("7.3")` | Returns `{day:7, month:3}` |
| TC-NAMEDAY-003 | AC4.c | EP | P2 | unit | auto | `parseDate("07.03.")` | Returns `{day:7, month:3}` |
| TC-NAMEDAY-004 | AC4.d | EP | P2 | unit | auto | `parseDate("7.3.2024")` | Returns `{day:7, month:3}` |
| TC-NAMEDAY-005 | AC4.e | EP | P3 | unit | auto | `parseDate("7. 3. 2024")` | Returns `{day:7, month:3}` |
| TC-NAMEDAY-006 | AC4.f | EP | P1 | unit | auto | `parseDate("2024-03-07")` | Returns `{day:7, month:3}` |
| TC-NAMEDAY-007 | AC5.a | BVA max+1 | P1 | unit | auto | `parseDate("32.1.")` | Returns `null` |
| TC-NAMEDAY-008 | AC4.a | BVA max | P2 | unit | auto | `parseDate("31.1.")` | Returns `{day:31, month:1}` |
| TC-NAMEDAY-009 | AC5.a | BVA max+1 | P1 | unit | auto | `parseDate("31.4.")` | Returns `null` (April has 30 days) |
| TC-NAMEDAY-010 | AC4.a | BVA max | P2 | unit | auto | `parseDate("30.4.")` | Returns `{day:30, month:4}` |
| TC-NAMEDAY-011 | AC5.c | BVA min−1 | P1 | unit | auto | `parseDate("0.5.")` | Returns `null` |
| TC-NAMEDAY-012 | AC4.a | BVA min | P2 | unit | auto | `parseDate("1.5.")` | Returns `{day:1, month:5}` |
| TC-NAMEDAY-013 | AC5.b | BVA max+1 | P1 | unit | auto | `parseDate("7.13.")` | Returns `null` |
| TC-NAMEDAY-014 | AC4.a | BVA max | P2 | unit | auto | `parseDate("7.12.")` | Returns `{day:7, month:12}` |
| TC-NAMEDAY-015 | AC5.c | BVA min−1 | P1 | unit | auto | `parseDate("7.0.")` | Returns `null` |
| TC-NAMEDAY-016 | AC5.d | EP negative | P1 | unit | auto | `parseDate("not-a-date")` | Returns `null` |
| TC-NAMEDAY-017 | AC5.d | EP negative | P3 | unit | auto | `parseDate("")` | Returns `null` |
| TC-NAMEDAY-018 | AC6.a | Decision (leap) | P1 | unit | auto | `parseDate("29.2.2024")` | Returns `{day:29, month:2}` |
| TC-NAMEDAY-019 | AC6.b | Decision (leap) | P1 | unit | auto | `parseDate("29.2.2023")` | Returns `null` |
| TC-NAMEDAY-020 | AC6.c | Decision (leap) | P2 | unit | auto | `parseDate("29.2.")` | Returns `{day:29, month:2}` |
| TC-NAMEDAY-021 | AC6.d | BVA century | P1 | unit | auto | `parseDate("29.2.1900")` | Returns `null` (÷100, not ÷400) |
| TC-NAMEDAY-022 | AC6.d | BVA century | P1 | unit | auto | `parseDate("29.2.2000")` | Returns `{day:29, month:2}` (÷400) |
| TC-NAMEDAY-023 | AC1.a | EP | P1 | unit | auto | `namesForDate(7, 3)` | Returns exactly `["Tomáš"]` |
| TC-NAMEDAY-024 | AC1.c | EP edge | P2 | unit | auto | `namesForDate(1, 1)` | Returns `[]` |
| TC-NAMEDAY-025 | AC1.b | EP | P2 | unit | auto | `namesForDate(7, 4)` (Heřman/Hermína day) | Returns an array with 2 names |
| TC-NAMEDAY-026 | AC2.a | EP | P1 | unit | auto | `datesForName("Tomáš")` | Returns `[{day:7, month:3}]` |
| TC-NAMEDAY-027 | AC2.b | EP | P2 | unit | auto | `datesForName("Petr")` | Returns 2 entries: `{22,2}` and `{29,6}` |
| TC-NAMEDAY-028 | AC3.a/d | EP | P1 | unit | auto | `canonicalNameFor("tomas")` | Returns `"Tomáš"` |
| TC-NAMEDAY-029 | AC3.b/c | EP | P1 | unit | auto | `canonicalNameFor("  TOMÁŠ  ")` | Returns `"Tomáš"` |
| TC-NAMEDAY-030 | AC3.b | EP Unicode | P2 | unit | auto | Same name in NFC vs. pre-decomposed NFD form | Both resolve to `"Tomáš"` — normalization is form-independent |
| TC-NAMEDAY-031 | AC7.a | EP negative | P1 | unit | auto | `canonicalNameFor("Xyzabc")` / `datesForName("Xyzabc")` | `null` / `[]` respectively |
| TC-NAMEDAY-032 | AC15 | BVA length | P2 | unit | auto | `canonicalNameFor("Xyzabcdefgh")` (11 chars) | Returns `null`, no crash, no special handling |
| TC-NAMEDAY-033 | R3 / AC1 | Decision | P1 | api | auto | `GET /api/nameday?date=7.3.` | 200, `{type:"date", date:{7,3}, names:["Tomáš"]}` |
| TC-NAMEDAY-034 | R4 / AC5 | Decision | P1 | api | auto | `GET /api/nameday?date=32.1.` | 400, `INVALID_DATE` |
| TC-NAMEDAY-035 | R5 / AC2 | Decision | P1 | api | auto | `GET /api/nameday?name=Tomáš` | 200, `{type:"name", name:"Tomáš", dates:[{7,3}]}` |
| TC-NAMEDAY-036 | R6 / AC7.a | Decision | P1 | api | auto | `GET /api/nameday?name=Xyzabc` | 404, `NAME_NOT_FOUND` |
| TC-NAMEDAY-037 | R1 / AC8 | Decision | P1 | api | auto | `GET /api/nameday` (no params) | 400, `MISSING_QUERY` |
| TC-NAMEDAY-038 | R2 / AC9.a | Decision | P1 | api | auto | `GET /api/nameday?date=7.3.&name=Tomáš` | 400, `AMBIGUOUS_QUERY` |
| TC-NAMEDAY-039 | R2 / AC9.b | Decision ⚠ order | P1 | api | auto | `GET /api/nameday?date=garbage&name=` (both present, both invalid/empty) | 400, `AMBIGUOUS_QUERY` — **not** `INVALID_DATE`, proving the ambiguity check runs first |
| TC-NAMEDAY-058 | AC5.e | EP negative (shape) | P2 | api | auto | `GET /api/nameday?date=1.1.&date=2.2.` (repeated param → array, not a string) | 400, `INVALID_DATE` — the `typeof === "string"` guard in `app.ts` fails safe, no crash |
| TC-NAMEDAY-059 | AC7.b | EP negative (shape) | P2 | api | auto | `GET /api/nameday?name=Tomas&name=Petr` (repeated param → array, not a string) | 404, `NAME_NOT_FOUND` — same guard, name side |
| TC-NAMEDAY-040 | AC14.a | EP | P1 | api | auto | `GET /api/nameday?date=abc`, inspect response schema | Body matches `BadRequestError` in `openapi.yaml` |
| TC-NAMEDAY-060 | AC14.a | EP | P1 | api | auto | `GET /api/nameday?name=Xyzabc`, inspect response schema | Body matches `NameNotFoundError` in `openapi.yaml` — the 404 half of AC14.a, previously only the 400 half (TC-040) was contract-tested |
| TC-NAMEDAY-041 | AC13.a/b/c | EP | P2 | component | auto | Mock `requestNameday`; submit for 1-name day, 2-name day, 0-name day | Rendered result text matches each AC13 formatting rule |
| TC-NAMEDAY-042 | AC13.d | EP | P2 | component | auto | Mock a 2-date name result (Petr) | Text is `"Petr má svátek 22.2., 29.6."` |
| TC-NAMEDAY-043 | AC10.b | EP | P2 | component | auto | Fill date text, then use the picker | Date text field is overwritten with the picker's own value (not cleared to empty) |
| TC-NAMEDAY-044 | AC10.a | EP | P2 | component | auto | Set the picker, then type in date text | Picker value clears once text is typed |
| TC-NAMEDAY-045 | AC10.c / AC9 | Scenario | P1 | component | auto | Fill date *and* name, then submit | No client-side block — both values reach `requestNameday`; the mocked `AMBIGUOUS_QUERY` error is shown (resolved by the implementation: `NamedayForm.test.tsx`, "submits with both date and name present") |
| TC-NAMEDAY-046 | AC11 | Scenario | P1 | component | auto | Fill fields, get a result, click Reset | Date text, picker, name, result and error are all empty |
| TC-NAMEDAY-047 | AC11.b / AC12 | Scenario concurrency | P1 | component | auto | Submit, immediately Reset before the delayed mock resolves, then let it resolve | Result stays empty — stale response discarded |
| TC-NAMEDAY-048 | AC12 | Scenario concurrency | P1 | component | auto | Submit A, change input, submit B; resolve B first, then late A | Only B's result shows; late A is discarded |
| TC-NAMEDAY-049 | AC14.b | EP negative | P2 | component | auto | Mock a 500 with an unrecognized body; submit | Error shown via `role="alert"`; no crash; result stays empty |
| TC-NAMEDAY-050 | AC14.c | EP negative | P2 | component | auto | Mock `fetch` to reject; submit | Error shown via `role="alert"`; no crash |
| TC-NAMEDAY-064 | AC1 | EP | P2 | unit | auto | `requestNameday({date: "7.3."})` against a mocked (MSW) 200 | Query string is `?date=7.3.`; resolves with the body as-is |
| TC-NAMEDAY-065 | AC2 | EP | P2 | unit | auto | `requestNameday({name: "Tomáš"})` against a mocked 200 | Query string URL-encodes the diacritic correctly (`?name=Tom%C3%A1%C5%A1`); resolves with the body as-is |
| TC-NAMEDAY-061 | AC14.a | EP | P2 | unit | auto | `requestNameday` against a mocked (MSW) 404 with a recognized `{error:{code,message}}` body | Rejects with an `Error` whose message is `body.error.message` |
| TC-NAMEDAY-062 | AC14.b | EP negative | P2 | unit | auto | `requestNameday` against a mocked 500 with an unrecognized body shape | Rejects with the generic `Požadavek selhal se stavem 500.` fallback, not a crash |
| TC-NAMEDAY-063 | AC14.c | EP negative | P2 | unit | auto | `requestNameday` against a mocked network-level failure (`HttpResponse.error()`) | Rejects, error propagates unwrapped |
| TC-NAMEDAY-051 | Question 1 | EP exploratory | P3 | api | manual | `GET /api/nameday?name=%20%20%20` | Document actual response (`NAME_NOT_FOUND` today); flag to product whether that matches intent |
| TC-NAMEDAY-052 | AC1, AC2 | Scenario | P1 | e2e | auto | Open app, submit valid date → result; reset; submit valid name → result | Both results render end-to-end through the real UI + real backend (`e2e/cypress/e2e/nameday_lookup.cy.ts`) |
| TC-NAMEDAY-053 | AC5, AC7.a | Scenario | P2 | e2e | auto | Submit invalid date, correct it, resubmit | Error shown, then replaced by a correct result |
| TC-NAMEDAY-054 | a11y | Manual checklist | P3 | manual | manual | Keyboard-only + screen reader navigation | Labels, `aria-live` and `role="alert"` announce correctly |
| TC-NAMEDAY-055 | AC6.d | BVA century (ISO) | P2 | unit | auto | `parseDate("2024-02-29")` | Returns `{day:29, month:2}` — proves the leap check also fires on the ISO branch's `yearText`, not only the Czech-format one |
| TC-NAMEDAY-056 | AC6.b | Decision (leap, ISO) | P2 | unit | auto | `parseDate("2023-02-29")` | Returns `null` — same leap check, ISO input |
| TC-NAMEDAY-057 | AC5.c | EP negative (sign) | P3 | unit | auto | `parseDate("-1.5.")` | Returns `null` — a leading minus never reaches the range check; it fails both format regexes and falls through to the same `null` return as AC5.d. Documents that "negative" in AC5.c is a black-box observation, not a distinct code path from AC5.d |

## 5. Coverage summary

| AC | Positive | Negative | Boundary | Layer(s) |
|---|---|---|---|---|
| AC1 | 023, 033, 052, 064 | — | 024 (0 names) | unit, api, e2e |
| AC2 | 026, 035, 052, 065 | — | 027 (multi-date) | unit, api, e2e |
| AC3 | 028, 029 | — | 030 (Unicode form) | unit |
| AC4 | 001–006 | — | 008, 010, 012, 014 | unit |
| AC5 | 034, 053 | 007, 009, 011, 013, 015, 016, 017, 057 (sign), 058 (shape) | — | unit, api, e2e |
| AC6 | 018, 020, 022, 055 | 019, 056 | 021 (century) | unit |
| AC7 | 036 | 031, 059 (shape) | — | unit, api |
| AC8 | 037 | — | — | api |
| AC9 | 038 | 039 (order check) | — | api |
| AC10 | 043, 044, 045 | — | — | component |
| AC11 | 046 | — | 047 (concurrency) | component |
| AC12 | — | — | 047, 048 | component |
| AC13 | 041, 042 | — | — | component |
| AC14 | 040, 060, 061 | 049, 050, 062, 063 | — | api, component, unit (frontend) |
| AC15 | — | 032 | boundary itself | unit |
| Q1 | — | 051 | — | api (manual) |

Layer distribution: 40 unit (all auto), 12 api (11 auto + 1 manual — Q1 exploratory), 10 component (all auto), 2 e2e (auto, implemented), 1 manual (a11y, not yet performed) → 65 cases total, not e2e-dominated, consistent with the pyramid.

## 6. Gaps & open questions

- **Most load-bearing single case:** TC-NAMEDAY-047 / TC-NAMEDAY-048 (AC12, race condition) is the one test in this whole set whose absence would let a refactor of the `requestVersion` ref in `NamedayForm.tsx` regress silently — no other test, at any layer, would catch a stale response reappearing. If time is short, this is the case not to cut.
- **Question 1** (above) — whitespace-only field handling; answer needed from whoever owns the intended UX, not guessed.
- **Gap 1:** no AC or test pins down what the date picker actually produces as a string value on submission (assumed ISO, per `type="date"` semantics, but not verified against `parseDate`'s ISO branch in a dedicated component test). Folded into TC-NAMEDAY-052 (e2e), but a cheaper dedicated component test would close this without relying on e2e.
- **Gap 2:** downstream of Gap 1's rendering side rather than its parsing side — AC13 doesn't specify separator behavior for 3+ names on one day or 3+ dates for one name. Worth a quick data check before deciding it's unreachable and dropping it, or keeping it as a documented untested case.
- **Gap 3:** a tooling gap, not a test-design one — neither the `backend` nor the `contracts` workspace declares an HTTP test client (no `supertest` or equivalent in either `package.json`). TC-NAMEDAY-033–040 (api layer) can't be written until this is decided — either add `supertest`, or call `app.listen(0)` and hit it with native `fetch`. It blocks 8 of the 54 cases until someone picks one. **Resolved** (this branch): no new dependency — `app.listen(0)` + Node's built-in `fetch`, in `backend/tests/app.test.ts` and `contracts/tests/nameday-contract.test.ts`.
- **Closed during review:** the leap/century check (`yearText` in `parseDate`) is derived from either the ISO or the Czech regex match, but TC-018–022 only exercised the Czech branch — TC-NAMEDAY-055/056 close this by repeating the leap/non-leap pair through the ISO branch (`"2024-02-29"` / `"2023-02-29"`). Also closed: AC5.c names "negative day/month" as an atomic condition, but no case demonstrated it and a leading `-` in fact never reaches the range check (it fails the format regex first, same as AC5.d) — TC-NAMEDAY-057 makes that explicit instead of leaving a silent, misleading-looking hole in the coverage table. It is not expected to catch a real regression (the regex already guarantees this), so it is one of the lowest-value cases in the set and the first to drop under time pressure — it exists for AC-traceability completeness, not defect-finding power.
- **Closed during code review (unit/api test review):** a repeated `date` or `name` query param arrives at Express as an array, not a string — verified live against the running server (`?date=1.1.&date=2.2.` → 400 `INVALID_DATE`; `?name=Tomas&name=Petr` → 404 `NAME_NOT_FOUND`). The `typeof === "string"` guard in `app.ts` already handles this safely, but nothing pinned it down, so a future refactor could drop the guard unnoticed (the *Delinquent* review lens: malformed input, not just invalid values). New atomic conditions AC5.e/AC7.b, closed by TC-NAMEDAY-058/059. Also closed: the contract test (`nameday-contract.test.ts`) validated only the 400 `BadRequestError` schema against `openapi.yaml`; AC14.a covers both 400 and 404, but the `NameNotFoundError` schema was never contract-tested — closed by TC-NAMEDAY-060. Both `app.test.ts` and `nameday-contract.test.ts` also had identical `app.listen(0)`/close boilerplate, since extracted into a shared `backend/tests/testServer.ts` helper.
- **Closed during code review (component test review):** `frontend/src/api.ts` — the module AC14.a/b are actually about (the `isApiFailure` type guard, the fallback-message template) — had **no test of its own** anywhere in the repo. Every `NamedayForm.test.tsx` case mocks `requestNameday` wholesale, so those tests prove the form reacts correctly to whatever error it's handed, not that `api.ts` derives the right message from a real HTTP response. Concretely, TC-NAMEDAY-049's mocked message string was hand-copied from `api.ts`'s own fallback template — if that template changed, the component test would keep passing against its own stale copy. Closed by TC-NAMEDAY-061/062/063 in `frontend/tests/api.test.ts`, exercising `requestNameday` against a real `msw/node` server instead of a hand-mocked one. Also fixed: TC-NAMEDAY-045's expected result used to read "test documents whichever the implementation actually does" — the component test now shows definitively that both fields reach the API unblocked; wording updated to state that as fact. Also fixed: `api.test.ts` shipped 5 cases but only 3 (061–063) had a TC ID — the other two (request-building for a date query, URL-encoding a diacritic name) were untraceable. Added as TC-NAMEDAY-064/065.

## 7. Recommended automation split

- **Static** (already wired, run first): `npm run typecheck` + `npm run lint` at the root — not a test case, but the cheapest gate; every workspace's compile/lint errors should fail before any of the layers below even run.
- **Unit** (Vitest, backend workspace): all `parseDate` / `namesForDate` / `datesForName` / `canonicalNameFor` / `normalizeName` cases (TC-NAMEDAY-001–032, 055–057) — cheapest, fastest, most valuable; this is where BVA/decision-table completeness pays off. There is no integration/DB layer to add above this — the app has no persistence or DI container, so "integration testing" collapses into the api layer below rather than existing as its own step.
- **Unit** (Vitest + `msw/node`, frontend workspace): `frontend/src/api.ts`'s own request/response handling (TC-NAMEDAY-061–065) — a real HTTP round-trip through MSW, not a hand-mocked `requestNameday`, so it can't silently drift from the module it's supposed to prove.
- **API** (`backend/tests/app.test.ts`, `contracts/tests/nameday-contract.test.ts`): the 6 decision-table rules, the code-order check, the malformed-shape cases, and the two contract-schema checks (TC-NAMEDAY-033–040, 058–060) — proves the HTTP contract independent of the UI.
- **Component** (Vitest + Testing Library, frontend workspace): field-interaction and rendering cases (TC-NAMEDAY-041–050), especially the two concurrency cases (047, 048) — cheap here, expensive/flaky at e2e.
- **E2E** (Cypress): only the two full-journey cases (TC-NAMEDAY-052, 053) — happy path and one recovery-from-error path. Resist adding more; every other AC is already provable lower in the pyramid.
- **Manual**: TC-NAMEDAY-051 (exploratory, pending Question 1) and TC-NAMEDAY-054 (a11y) — not worth automating for a small interview app, but worth doing once by hand.

### Cross-level duplication check

Two behaviours are exercised at more than one layer above — checked explicitly so neither is an accidental duplicate:

- **Query-validation decision table (R1–R6):** unit (007–032) proves *is this input valid* in isolation (`parseDate`/`canonicalNameFor` return values); api (033–039) proves *does the route return the right HTTP status and body given that validity*. Different ownership, no overlap.
- **Result rendering (AC13):** component (041–042) owns every formatting variant (0/1/N names, N dates); e2e (052) adds only that one representative path round-trips correctly over the real network/UI. Component owns the behaviour; e2e adds only integration confidence for one path.

No unresolved overlap.

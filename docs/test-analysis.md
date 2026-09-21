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
| AC10 | Date text/picker mutually clear each other; name field is independent (not disabled) — combines with AC9 for the overlap case |
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
| AC5 | **a** day out of range for month · **b** month out of range · **c** zero/negative day or month · **d** unparsable garbage string |
| AC6 | **a** leap year, year given · **b** non-leap year, year given · **c** no year given · **d** century-rule boundary (1900 vs 2000) |
| AC7 | single condition |
| AC8 | single condition |
| AC9 | **a** both filled, both valid · **b** both filled, one/both invalid (⚠ tests that the ambiguity check pre-empts validity checks, per `app.ts` code order) |
| AC10 | **a** typing date text clears picker · **b** picking date clears date text · **c** name field stays populated when date is entered (feeds AC9) |
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

Invalid/empty/max input — covered (AC5, AC8, AC15). Encoding & Unicode — NFC vs. NFD normalization form of the same name, both must match. Permissions/roles, time zones/locale/currency, back-navigation, data mutated elsewhere — all N/A, consciously excluded (no auth, no time component, single-page form, static read-only data). Network failure/timeouts — AC14.c. A11y — labels, `aria-live`, `role="alert"` — one manual check.

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
| TC-NAMEDAY-025 | AC1.b | EP | P2 | unit | auto | `namesForDate(16, 4)` (Heřman/Hermína day) | Returns an array with 2 names |
| TC-NAMEDAY-026 | AC2.a | EP | P1 | unit | auto | `datesForName("Tomáš")` | Returns `[{day:7, month:3}]` |
| TC-NAMEDAY-027 | AC2.b | EP | P2 | unit | auto | `datesForName("Petr")` | Returns 2 entries: `{22,2}` and `{29,6}` |
| TC-NAMEDAY-028 | AC3.a/d | EP | P1 | unit | auto | `canonicalNameFor("tomas")` | Returns `"Tomáš"` |
| TC-NAMEDAY-029 | AC3.b/c | EP | P1 | unit | auto | `canonicalNameFor("  TOMÁŠ  ")` | Returns `"Tomáš"` |
| TC-NAMEDAY-030 | AC3.b | EP Unicode | P2 | unit | auto | Same name in NFC vs. pre-decomposed NFD form | Both resolve to `"Tomáš"` — normalization is form-independent |
| TC-NAMEDAY-031 | AC7 | EP negative | P1 | unit | auto | `canonicalNameFor("Xyzabc")` / `datesForName("Xyzabc")` | `null` / `[]` respectively |
| TC-NAMEDAY-032 | AC15 | BVA length | P2 | unit | auto | `canonicalNameFor("Xyzabcdefgh")` (11 chars) | Returns `null`, no crash, no special handling |
| TC-NAMEDAY-033 | R3 / AC1 | Decision | P1 | api | auto | `GET /api/nameday?date=7.3.` | 200, `{type:"date", date:{7,3}, names:["Tomáš"]}` |
| TC-NAMEDAY-034 | R4 / AC5 | Decision | P1 | api | auto | `GET /api/nameday?date=32.1.` | 400, `INVALID_DATE` |
| TC-NAMEDAY-035 | R5 / AC2 | Decision | P1 | api | auto | `GET /api/nameday?name=Tomáš` | 200, `{type:"name", name:"Tomáš", dates:[{7,3}]}` |
| TC-NAMEDAY-036 | R6 / AC7 | Decision | P1 | api | auto | `GET /api/nameday?name=Xyzabc` | 404, `NAME_NOT_FOUND` |
| TC-NAMEDAY-037 | R1 / AC8 | Decision | P1 | api | auto | `GET /api/nameday` (no params) | 400, `MISSING_QUERY` |
| TC-NAMEDAY-038 | R2 / AC9.a | Decision | P1 | api | auto | `GET /api/nameday?date=7.3.&name=Tomáš` | 400, `AMBIGUOUS_QUERY` |
| TC-NAMEDAY-039 | R2 / AC9.b | Decision ⚠ order | P1 | api | auto | `GET /api/nameday?date=garbage&name=` (both present, both invalid/empty) | 400, `AMBIGUOUS_QUERY` — **not** `INVALID_DATE`, proving the ambiguity check runs first |
| TC-NAMEDAY-040 | AC14.a | EP | P1 | api | auto | `GET /api/nameday?date=abc`, inspect response schema | Body matches `BadRequestError` in `openapi.yaml` |
| TC-NAMEDAY-041 | AC13.a/b/c | EP | P2 | component | auto | Mock `requestNameday`; submit for 1-name day, 2-name day, 0-name day | Rendered result text matches each AC13 formatting rule |
| TC-NAMEDAY-042 | AC13.d | EP | P2 | component | auto | Mock a 2-date name result (Petr) | Text is `"Petr má svátek 22.2., 29.6."` |
| TC-NAMEDAY-043 | AC10.a | EP | P2 | component | auto | Fill date text, then use the picker | Date text field clears once the picker is used |
| TC-NAMEDAY-044 | AC10.b | EP | P2 | component | auto | Set the picker, then type in date text | Picker value clears once text is typed |
| TC-NAMEDAY-045 | AC10.c / AC9 | Scenario | P1 | component | auto | Fill date *and* name, then submit | Client-side block, or the mocked ambiguous-error response is shown — test documents whichever the implementation actually does |
| TC-NAMEDAY-046 | AC11 | Scenario | P1 | component | auto | Fill fields, get a result, click Reset | Date text, picker, name, result and error are all empty |
| TC-NAMEDAY-047 | AC11.b / AC12 | Scenario concurrency | P1 | component | auto | Submit, immediately Reset before the delayed mock resolves, then let it resolve | Result stays empty — stale response discarded |
| TC-NAMEDAY-048 | AC12 | Scenario concurrency | P1 | component | auto | Submit A, change input, submit B; resolve B first, then late A | Only B's result shows; late A is discarded |
| TC-NAMEDAY-049 | AC14.b | EP negative | P2 | component | auto | Mock a 500 with an unrecognized body; submit | Error shown via `role="alert"`; no crash; result stays empty |
| TC-NAMEDAY-050 | AC14.c | EP negative | P2 | component | auto | Mock `fetch` to reject; submit | Error shown via `role="alert"`; no crash |
| TC-NAMEDAY-051 | Question 1 | EP exploratory | P3 | api | manual | `GET /api/nameday?name=%20%20%20` | Document actual response (`NAME_NOT_FOUND` today); flag to product whether that matches intent |
| TC-NAMEDAY-052 | AC1, AC2 | Scenario | P1 | e2e | auto | Open app, submit valid date → result; reset; submit valid name → result | Both results render end-to-end through the real UI + API/MSW |
| TC-NAMEDAY-053 | AC5, AC7 | Scenario | P2 | e2e | auto | Submit invalid date, correct it, resubmit | Error shown, then replaced by a correct result |
| TC-NAMEDAY-054 | a11y | Manual checklist | P3 | manual | manual | Keyboard-only + screen reader navigation | Labels, `aria-live` and `role="alert"` announce correctly |

## 5. Coverage summary

| AC | Positive | Negative | Boundary | Layer(s) |
|---|---|---|---|---|
| AC1 | 023, 033, 052 | — | 024 (0 names) | unit, api, e2e |
| AC2 | 026, 035, 052 | — | 027 (multi-date) | unit, api, e2e |
| AC3 | 028, 029 | — | 030 (Unicode form) | unit |
| AC4 | 001–006 | — | 008, 010, 012, 014 | unit |
| AC5 | 034, 053 | 007, 009, 011, 013, 015, 016, 017 | — | unit, api, e2e |
| AC6 | 018, 020, 022 | 019 | 021 (century) | unit |
| AC7 | 036 | 031 | — | unit, api |
| AC8 | 037 | — | — | api |
| AC9 | 038 | 039 (order check) | — | api |
| AC10 | 043, 044, 045 | — | — | component |
| AC11 | 046 | — | 047 (concurrency) | component |
| AC12 | — | — | 047, 048 | component |
| AC13 | 041, 042 | — | — | component |
| AC14 | 040 | 049, 050 | — | api, component |
| AC15 | — | 032 | boundary itself | unit |
| Q1 | — | 051 | — | api (manual) |

Layer distribution: 32 unit, 8 api, 12 component, 2 e2e, 2 manual → not e2e-dominated, consistent with the pyramid.

## 6. Gaps & open questions

- **Question 1** (above) — whitespace-only field handling; answer needed from whoever owns the intended UX, not guessed.
- **Gap:** no AC or test pins down what the date picker actually produces as a string value on submission (assumed ISO, per `type="date"` semantics, but not verified against `parseDate`'s ISO branch in a dedicated component test). Folded into TC-NAMEDAY-052 (e2e), but a cheaper dedicated component test would close this without relying on e2e.
- **Gap:** AC13 doesn't specify separator behavior for 3+ names on one day or 3+ dates for one name. Worth a quick data check before deciding it's unreachable and dropping it, or keeping it as a documented untested case.

## 7. Recommended automation split

- **Unit** (Vitest, backend workspace): all `parseDate` / `namesForDate` / `datesForName` / `canonicalNameFor` / `normalizeName` cases (TC-NAMEDAY-001–032) — cheapest, fastest, most valuable; this is where BVA/decision-table completeness pays off.
- **API** (contracts workspace, supertest-style against the Express app): the 6 decision-table rules plus the code-order check (TC-NAMEDAY-033–040) — proves the HTTP contract independent of the UI.
- **Component** (Vitest + Testing Library, frontend workspace): field-interaction and rendering cases (TC-NAMEDAY-041–050), especially the two concurrency cases (047, 048) — cheap here, expensive/flaky at e2e.
- **E2E** (Cypress): only the two full-journey cases (TC-NAMEDAY-052, 053) — happy path and one recovery-from-error path. Resist adding more; every other AC is already provable lower in the pyramid.
- **Manual**: TC-NAMEDAY-051 (exploratory, pending Question 1) and TC-NAMEDAY-054 (a11y) — not worth automating for a small interview app, but worth doing once by hand.

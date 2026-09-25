# Answer key — AC1 Date → names

Interviewer only. The candidate should not see this before the exercise.

## AC1

Submit **only a date**. Show every name for that day. The date in the answer is always `D.M.` (no leading zeros), whatever the user typed.

| Input | Answer |
|---|---|
| `7.3.` | `7.3. má svátek Tomáš.` |
| `7.4.` | `7.4. má svátek Heřman a Hermína.` |
| `1.1.` | `1.1. nemá svátek žádné jméno.` |

Several names are joined with ` a `. A date answer **ends with a period**.

## Test cases

| ID | Level | What it proves | Do not put it here |
|---|---|---|---|
| AC1-API-1 | API | One name: `7.3.` → 200 and `["Tomáš"]` | The Czech sentence. The API returns JSON |
| AC1-API-2 | API | Several names: `7.4.` → `["Heřman", "Hermína"]` | Joining them with ` a ` |
| AC1-API-3 | API | No name: `1.1.` → 200 and `"names": []` | The zero-name sentence |
| AC1-CMP-1 | Component | One name renders `7.3. má svátek Tomáš.` including the period | Calling the real API |
| AC1-CMP-2 | Component | Two names render `7.4. má svátek Heřman a Hermína.` | |
| AC1-CMP-3 | Component | No names render `1.1. nemá svátek žádné jméno.` | |
| AC1-E2E-1 | E2E | Typed `07.03.` is answered as `7.3. má svátek Tomáš.` through the real page | The other two sentences. Leading zeros are the point of this one journey |

The component tests must use an exact text check. A partial check such as “contains Tomáš” still passes if the final period is missing.

## AC1-API-1 — one name

```ts
it("returns the one name for 7 March", async () => {
  const response = await fetch(`${testServer.baseUrl}/api/nameday?date=7.3.`);

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    type: "date",
    date: { day: 7, month: 3 },
    names: ["Tomáš"],
  });
});
```

## AC1-API-2 — several names

```ts
it("returns every name for 7 April", async () => {
  const response = await fetch(`${testServer.baseUrl}/api/nameday?date=7.4.`);

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    type: "date",
    date: { day: 7, month: 4 },
    names: ["Heřman", "Hermína"],
  });
});
```

## AC1-API-3 — no name

```ts
it("returns an empty name list for 1 January", async () => {
  const response = await fetch(`${testServer.baseUrl}/api/nameday?date=1.1.`);

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    type: "date",
    date: { day: 1, month: 1 },
    names: [],
  });
});
```

## AC1-CMP-1 — one-name sentence

The lookup is stubbed. This test owns the wording, not the calendar.

```tsx
it("renders one name and a final period", () => {
  cy.intercept("GET", "**/api/nameday*", {
    body: { type: "date", date: { day: 7, month: 3 }, names: ["Tomáš"] },
  });

  cy.mount(<NamedayForm />);
  cy.get('[data-cy="date-input"]').type("7.3.");
  cy.get('[data-cy="confirm"]').click();

  cy.get('[data-cy="result"]').should("have.text", "7.3. má svátek Tomáš.");
});
```

## AC1-CMP-2 — several names joined with “a”

```tsx
it("joins several names with 'a' and ends with a period", () => {
  cy.intercept("GET", "**/api/nameday*", {
    body: {
      type: "date",
      date: { day: 7, month: 4 },
      names: ["Heřman", "Hermína"],
    },
  });

  cy.mount(<NamedayForm />);
  cy.get('[data-cy="date-input"]').type("7.4.");
  cy.get('[data-cy="confirm"]').click();

  cy.get('[data-cy="result"]').should(
    "have.text",
    "7.4. má svátek Heřman a Hermína.",
  );
});
```

## AC1-CMP-3 — day with no name

```tsx
it("renders the zero-names sentence", () => {
  cy.intercept("GET", "**/api/nameday*", {
    body: { type: "date", date: { day: 1, month: 1 }, names: [] },
  });

  cy.mount(<NamedayForm />);
  cy.get('[data-cy="date-input"]').type("1.1.");
  cy.get('[data-cy="confirm"]').click();

  cy.get('[data-cy="result"]').should(
    "have.text",
    "1.1. nemá svátek žádné jméno.",
  );
});
```

## AC1-E2E-1 — one real journey

`07.03.` is deliberate. The answer must show `7.3.`, not the text the user typed. The other two sentences stay in the component tests.

```ts
it("shows 7 March without leading zeros", () => {
  cy.visit("/");
  cy.get('[data-cy="date-input"]').type("07.03.");
  cy.get('[data-cy="confirm"]').click();

  cy.get('[data-cy="result"]').should("have.text", "7.3. má svátek Tomáš.");
  cy.get('[data-cy="error"]').should("have.text", "");
});
```

# Answer key — AC9 Both fields filled

Interviewer only. The candidate should not see this before the exercise.

## AC9

Something in **both** fields → `Zadejte pouze datum, nebo pouze jméno.`

This is checked **before** the values are validated. A nonsense date plus a name is still this error, not “invalid date”. The page does not block the submit; it shows the lookup error.

## Test cases

| ID | Level | What it proves | Do not put it here |
|---|---|---|---|
| AC9-API-1 | API | Both valid values → HTTP 400, code `AMBIGUOUS_QUERY`, that message | Repeating it in e2e |
| AC9-API-2 | API | A nonsense date plus a name is still `AMBIGUOUS_QUERY`, not `INVALID_DATE` | Component or e2e. The page only displays the code the server chose |
| AC9-CMP-1 | Component | The form stays open, sends both values, shows the message, and leaves the answer empty | The nonsense-date variant. A stub cannot prove which check runs first |
| AC9-E2E-1 | E2E | A person can fill both fields and see the message in the real app | The API status code, and the nonsense-date case |

## AC9-API-1 — both values valid

```ts
it("returns AMBIGUOUS_QUERY when date and name are both valid", async () => {
  const response = await fetch(
    `${testServer.baseUrl}/api/nameday?date=7.3.&name=${encodeURIComponent("Tomáš")}`,
  );

  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({
    error: {
      code: "AMBIGUOUS_QUERY",
      message: "Zadejte pouze datum, nebo pouze jméno.",
    },
  });
});
```

## AC9-API-2 — nonsense date, check runs first

```ts
it("returns AMBIGUOUS_QUERY before it validates the date", async () => {
  const response = await fetch(
    `${testServer.baseUrl}/api/nameday?date=garbage&name=${encodeURIComponent("Tomáš")}`,
  );

  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({
    error: { code: "AMBIGUOUS_QUERY" },
  });
});
```

`date=garbage` alone would be `INVALID_DATE`. With a name present, it must not be.

## AC9-CMP-1 — the page does not block the submit

Cypress component. The network is stubbed. The assertion that matters is the query string: both fields were sent.

```tsx
it("sends both fields and shows the ambiguous-query message", () => {
  cy.intercept("GET", "**/api/nameday*", {
    statusCode: 400,
    body: {
      error: {
        code: "AMBIGUOUS_QUERY",
        message: "Zadejte pouze datum, nebo pouze jméno.",
      },
    },
  }).as("nameday");

  cy.mount(<NamedayForm />);
  cy.get('[data-cy="date-input"]').type("7.3.");
  cy.get('[data-cy="name-input"]').type("Tomáš");
  cy.get('[data-cy="confirm"]').click();

  cy.wait("@nameday").then(({ request }) => {
    const parameters = new URL(request.url).searchParams;
    expect(parameters.get("date")).to.equal("7.3.");
    expect(parameters.get("name")).to.equal("Tomáš");
  });
  cy.get('[data-cy="error"]').should(
    "have.text",
    "Zadejte pouze datum, nebo pouze jméno.",
  );
  cy.get('[data-cy="result"]').should("have.text", "");
});
```

## AC9-E2E-1 — one real journey

No status-code assertion. The API tests own that.

```ts
it("shows the ambiguous-query message when both fields are filled", () => {
  cy.visit("/");
  cy.get('[data-cy="date-input"]').type("7.3.");
  cy.get('[data-cy="name-input"]').type("Tomáš");
  cy.get('[data-cy="confirm"]').click();

  cy.get('[data-cy="error"]').should(
    "have.text",
    "Zadejte pouze datum, nebo pouze jméno.",
  );
  cy.get('[data-cy="result"]').should("have.text", "");
});
```

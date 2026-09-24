import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { requestNameday } from "../../src/api.ts";

const server = setupServer();

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe("requestNameday — request building and response shape (AC1, AC2)", () => {
  it("builds the query string for a date lookup and returns the body as-is", async () => {
    server.use(
      http.get("*/api/nameday", ({ request }) => {
        expect(new URL(request.url).search).toBe("?date=7.3.");

        return HttpResponse.json({
          type: "date",
          date: { day: 7, month: 3 },
          names: ["Tomáš"],
        });
      }),
    );

    await expect(requestNameday({ date: "7.3." })).resolves.toEqual({
      type: "date",
      date: { day: 7, month: 3 },
      names: ["Tomáš"],
    });
  });

  it("URL-encodes a name with diacritics in the query string", async () => {
    server.use(
      http.get("*/api/nameday", ({ request }) => {
        expect(new URL(request.url).searchParams.get("name")).toBe("Tomáš");

        return HttpResponse.json({
          type: "name",
          name: "Tomáš",
          dates: [{ day: 7, month: 3 }],
        });
      }),
    );

    await expect(requestNameday({ name: "Tomáš" })).resolves.toEqual({
      type: "name",
      name: "Tomáš",
      dates: [{ day: 7, month: 3 }],
    });
  });
});

describe("requestNameday — error handling (AC14.a/b/c)", () => {
  // AC14.a: a recognized {error:{code,message}} body throws with that message
  it("throws with the server's message for a recognized error shape (TC-NAMEDAY-061)", async () => {
    server.use(
      http.get("*/api/nameday", () =>
        HttpResponse.json(
          {
            error: {
              code: "NAME_NOT_FOUND",
              message: "Jméno nebylo v kalendáři nalezeno.",
            },
          },
          { status: 404 },
        ),
      ),
    );

    await expect(requestNameday({ name: "Xyzabc" })).rejects.toThrow(
      "Jméno nebylo v kalendáři nalezeno.",
    );
  });

  // AC14.b: a non-2xx body that isn't the recognized {error:{code,message}} shape
  // falls back to a generic message built from the HTTP status, not a crash
  it("falls back to a generic status message for an unrecognized error body (TC-NAMEDAY-062)", async () => {
    server.use(
      http.get("*/api/nameday", () =>
        HttpResponse.json({ oops: "unexpected shape" }, { status: 500 }),
      ),
    );

    await expect(requestNameday({ date: "7.3." })).rejects.toThrow(
      "Požadavek selhal se stavem 500.",
    );
  });

  // AC14.c: a network-level failure propagates as-is, not swallowed or wrapped
  it("propagates a network-level failure (TC-NAMEDAY-063)", async () => {
    server.use(http.get("*/api/nameday", () => HttpResponse.error()));

    await expect(requestNameday({ date: "7.3." })).rejects.toThrow();
  });
});

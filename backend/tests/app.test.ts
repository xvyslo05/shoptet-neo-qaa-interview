import type { AddressInfo } from "node:net";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { app } from "../src/app.ts";

let baseUrl: string;
let server: ReturnType<typeof app.listen>;

beforeAll(() => {
  return new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address() as AddressInfo;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

afterAll(() => {
  return new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe("GET /api/nameday — query parameter routing (decision table R1–R6)", () => {
  it("R3 / AC1: returns names for a valid date (TC-NAMEDAY-033)", async () => {
    const response = await fetch(`${baseUrl}/api/nameday?date=7.3.`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      type: "date",
      date: { day: 7, month: 3 },
      names: ["Tomáš"],
    });
  });

  it("R4 / AC5: returns INVALID_DATE for an out-of-range date (TC-NAMEDAY-034)", async () => {
    const response = await fetch(`${baseUrl}/api/nameday?date=32.1.`);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: "INVALID_DATE" },
    });
  });

  it("R5 / AC2: returns dates for a valid name (TC-NAMEDAY-035)", async () => {
    const response = await fetch(
      `${baseUrl}/api/nameday?name=${encodeURIComponent("Tomáš")}`,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      type: "name",
      name: "Tomáš",
      dates: [{ day: 7, month: 3 }],
    });
  });

  it("R6 / AC7: returns NAME_NOT_FOUND for an unknown name (TC-NAMEDAY-036)", async () => {
    const response = await fetch(`${baseUrl}/api/nameday?name=Xyzabc`);

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      error: { code: "NAME_NOT_FOUND" },
    });
  });

  it("R1 / AC8: returns MISSING_QUERY when neither parameter is present (TC-NAMEDAY-037)", async () => {
    const response = await fetch(`${baseUrl}/api/nameday`);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: "MISSING_QUERY" },
    });
  });

  it("R2 / AC9.a: returns AMBIGUOUS_QUERY when both parameters are present and valid (TC-NAMEDAY-038)", async () => {
    const response = await fetch(
      `${baseUrl}/api/nameday?date=7.3.&name=${encodeURIComponent("Tomáš")}`,
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: "AMBIGUOUS_QUERY" },
    });
  });

  it("R2 / AC9.b: the ambiguity check runs before either value is validated (TC-NAMEDAY-039)", async () => {
    const response = await fetch(`${baseUrl}/api/nameday?date=garbage&name=`);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: "AMBIGUOUS_QUERY" },
    });
  });
});

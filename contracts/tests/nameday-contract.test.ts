import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { fileURLToPath } from "node:url";

import { Ajv } from "ajv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { parse } from "yaml";

import { app } from "@qaa/backend/app";

const openapiPath = fileURLToPath(new URL("../openapi.yaml", import.meta.url));
const openapi = parse(readFileSync(openapiPath, "utf8")) as {
  components: { schemas: Record<string, object> };
};

const ajv = new Ajv({ strict: false });
const validateBadRequest = ajv.compile(
  openapi.components.schemas.BadRequestError,
);

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

describe("API responses match contracts/openapi.yaml (AC14.a)", () => {
  it("a 400 error body matches the BadRequestError schema (TC-NAMEDAY-040)", async () => {
    const response = await fetch(`${baseUrl}/api/nameday?date=abc`);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(validateBadRequest(body)).toBe(true);
  });
});

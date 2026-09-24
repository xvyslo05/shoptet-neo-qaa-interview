import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import type { ValidateFunction } from "ajv";
import { Ajv } from "ajv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { parse } from "yaml";

import { app } from "@qaa/backend/app";
import { startTestServer, type TestServer } from "@qaa/backend/tests/testServer";

const openapiPath = fileURLToPath(new URL("../../openapi.yaml", import.meta.url));
const openapi = parse(readFileSync(openapiPath, "utf8")) as {
  components: { schemas: Record<string, object> };
};

const ajv = new Ajv({ strict: false });
const validateBadRequest = ajv.compile(
  openapi.components.schemas.BadRequestError,
);
const validateNameNotFound = ajv.compile(
  openapi.components.schemas.NameNotFoundError,
);

function assertMatchesSchema(
  validate: ValidateFunction,
  body: unknown,
): void {
  const isValid = validate(body);
  expect(isValid, JSON.stringify(validate.errors)).toBe(true);
}

let testServer: TestServer;

beforeAll(async () => {
  testServer = await startTestServer(app);
});

afterAll(() => testServer.close());

describe("API responses match contracts/openapi.yaml (AC14.a)", () => {
  it("a 400 error body matches the BadRequestError schema (TC-NAMEDAY-040)", async () => {
    const response = await fetch(`${testServer.baseUrl}/api/nameday?date=abc`);
    const body = await response.json();

    expect(response.status).toBe(400);
    assertMatchesSchema(validateBadRequest, body);
  });

  it("a 404 error body matches the NameNotFoundError schema (TC-NAMEDAY-060)", async () => {
    const response = await fetch(
      `${testServer.baseUrl}/api/nameday?name=Xyzabc`,
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    assertMatchesSchema(validateNameNotFound, body);
  });
});

import { once } from "node:events";
import { readFileSync } from "node:fs";
import type { Server } from "node:http";

import { app } from "@qaa/backend/app";
import { Ajv, type AnySchema } from "ajv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { parse } from "yaml";

interface OpenApiDocument {
  paths: {
    "/api/calculate": {
      post: {
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: AnySchema;
              };
            };
          };
        };
      };
    };
  };
}

const specification = parse(
  readFileSync(new URL("../openapi.yaml", import.meta.url), "utf8"),
) as OpenApiDocument;

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = app.listen(0);
  await once(server, "listening");

  const address = server.address();

  if (address === null || typeof address === "string") {
    throw new Error("Express server did not bind to a TCP port");
  }

  baseUrl = `http://localhost:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

describe("POST /api/calculate contract", () => {
  it('validates the "+" happy-path response against openapi.yaml', async () => {
    const response = await fetch(`${baseUrl}/api/calculate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ a: 2, b: 3, op: "+" }),
    });
    const responseBody = (await response.json()) as unknown;
    const schema =
      specification.paths["/api/calculate"].post.responses["200"].content[
        "application/json"
      ].schema;
    const validateResponse = new Ajv().compile(schema);

    expect(response.status).toBe(200);
    expect(
      validateResponse(responseBody),
      JSON.stringify(validateResponse.errors),
    ).toBe(true);
  });
});

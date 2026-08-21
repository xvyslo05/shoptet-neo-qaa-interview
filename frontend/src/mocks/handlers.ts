import {
  calculate,
  DivisionByZeroError,
  isOp,
} from "@qaa/backend/engine";
import { http, HttpResponse } from "msw";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function badRequest(message: string) {
  return HttpResponse.json(
    {
      error: {
        code: "BAD_REQUEST",
        message,
      },
    },
    { status: 400 },
  );
}

export const handlers = [
  http.post("/api/calculate", async ({ request }) => {
    const mediaType = request.headers
      .get("content-type")
      ?.split(";", 1)[0]
      ?.trim()
      .toLowerCase();

    if (mediaType !== "application/json") {
      return badRequest("Request body must be JSON");
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return badRequest("Request body must be valid JSON");
    }

    if (
      !isRecord(body) ||
      typeof body.a !== "number" ||
      !Number.isFinite(body.a) ||
      typeof body.b !== "number" ||
      !Number.isFinite(body.b) ||
      !isOp(body.op)
    ) {
      return badRequest(
        'Body must contain finite numbers "a" and "b" and a supported "op"',
      );
    }

    try {
      const result = calculate(body.a, body.b, body.op);

      if (!Number.isFinite(result)) {
        return badRequest("Calculation result must be a finite number");
      }

      return HttpResponse.json({
        result,
      });
    } catch (error: unknown) {
      if (error instanceof DivisionByZeroError) {
        return HttpResponse.json(
          {
            error: {
              code: "DIVISION_BY_ZERO",
              message: error.message,
            },
          },
          { status: 422 },
        );
      }

      throw error;
    }
  }),
];

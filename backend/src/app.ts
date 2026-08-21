import express, {
  type ErrorRequestHandler,
  type Request,
  type Response,
} from "express";

import {
  calculate,
  DivisionByZeroError,
  isOp,
  type Op,
} from "./engine.ts";

interface CalculationRequest {
  a: number;
  b: number;
  op: Op;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseCalculationRequest(value: unknown): CalculationRequest | null {
  if (
    !isRecord(value) ||
    typeof value.a !== "number" ||
    !Number.isFinite(value.a) ||
    typeof value.b !== "number" ||
    !Number.isFinite(value.b) ||
    !isOp(value.op)
  ) {
    return null;
  }

  return { a: value.a, b: value.b, op: value.op };
}

function badRequest(response: Response, message: string): void {
  response.status(400).json({
    error: {
      code: "BAD_REQUEST",
      message,
    },
  });
}

export const app = express();

app.use(express.json());

app.post("/api/calculate", (request: Request, response: Response) => {
  const calculation = parseCalculationRequest(request.body as unknown);

  if (calculation === null) {
    badRequest(
      response,
      'Body must contain finite numbers "a" and "b" and a supported "op"',
    );
    return;
  }

  try {
    const result = calculate(calculation.a, calculation.b, calculation.op);

    if (!Number.isFinite(result)) {
      badRequest(response, "Calculation result must be a finite number");
      return;
    }

    response.status(200).json({ result });
  } catch (error: unknown) {
    if (error instanceof DivisionByZeroError) {
      response.status(422).json({
        error: {
          code: "DIVISION_BY_ZERO",
          message: error.message,
        },
      });
      return;
    }

    throw error;
  }
});

const jsonErrorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  const isMalformedJson =
    isRecord(error) && error.type === "entity.parse.failed";

  if (isMalformedJson) {
    badRequest(response, "Request body must be valid JSON");
    return;
  }

  next(error);
};

app.use(jsonErrorHandler);

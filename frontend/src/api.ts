import type { Op } from "@qaa/backend/engine";

interface CalculationSuccess {
  result: number;
}

interface CalculationFailure {
  error: {
    code: string;
    message: string;
  };
}

function isCalculationFailure(value: unknown): value is CalculationFailure {
  if (typeof value !== "object" || value === null || !("error" in value)) {
    return false;
  }

  const error = value.error;
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    "code" in error &&
    typeof error.code === "string"
  );
}

export async function requestCalculation(
  a: number,
  b: number,
  op: Op,
): Promise<number> {
  const response = await fetch("/api/calculate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ a, b, op }),
  });
  const body = (await response.json()) as unknown;

  if (!response.ok) {
    if (isCalculationFailure(body)) {
      throw new Error(body.error.message);
    }

    throw new Error(`Calculation failed with status ${response.status}`);
  }

  const success = body as CalculationSuccess;
  return success.result;
}

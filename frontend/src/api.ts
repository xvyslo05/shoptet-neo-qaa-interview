import type { MonthDay } from "@qaa/backend/engine";

export interface DateNamedayResult {
  type: "date";
  date: MonthDay;
  names: string[];
}

export interface NameNamedayResult {
  type: "name";
  name: string;
  dates: MonthDay[];
}

export type NamedayResult = DateNamedayResult | NameNamedayResult;

interface NamedayQuery {
  date?: string;
  name?: string;
}

interface ApiFailure {
  error: {
    code: string;
    message: string;
  };
}

function isApiFailure(value: unknown): value is ApiFailure {
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

export async function requestNameday(
  query: NamedayQuery,
): Promise<NamedayResult> {
  const parameters = new URLSearchParams();

  if (query.date !== undefined) {
    parameters.set("date", query.date);
  }

  if (query.name !== undefined) {
    parameters.set("name", query.name);
  }

  const apiPath = import.meta.env.PROD
    ? `${import.meta.env.BASE_URL}api/nameday`
    : "/api/nameday";
  const queryString = parameters.toString();
  const response = await fetch(
    queryString === "" ? apiPath : `${apiPath}?${queryString}`,
  );
  const body = (await response.json()) as unknown;

  if (!response.ok) {
    if (isApiFailure(body)) {
      throw new Error(body.error.message);
    }

    throw new Error(`Požadavek selhal se stavem ${response.status}.`);
  }

  return body as NamedayResult;
}

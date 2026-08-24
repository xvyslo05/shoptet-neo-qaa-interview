import {
  canonicalNameFor,
  datesForName,
  namesForDate,
  parseDate,
} from "@qaa/backend/engine";
import { http, HttpResponse } from "msw";

const ERROR_MESSAGES = {
  MISSING_QUERY: "Zadejte datum nebo jméno.",
  AMBIGUOUS_QUERY: "Zadejte pouze datum, nebo pouze jméno.",
  INVALID_DATE: "Zadané datum není platné.",
  NAME_NOT_FOUND: "Jméno nebylo v kalendáři nalezeno.",
} as const;

type ErrorCode = keyof typeof ERROR_MESSAGES;

function errorResponse(status: 400 | 404, code: ErrorCode) {
  return HttpResponse.json(
    {
      error: {
        code,
        message: ERROR_MESSAGES[code],
      },
    },
    { status },
  );
}

export const handlers = [
  http.get("*/api/nameday", ({ request }) => {
    const parameters = new URL(request.url).searchParams;
    const hasDate = parameters.has("date");
    const hasName = parameters.has("name");

    if (!hasDate && !hasName) {
      return errorResponse(400, "MISSING_QUERY");
    }

    if (hasDate && hasName) {
      return errorResponse(400, "AMBIGUOUS_QUERY");
    }

    if (hasDate) {
      const dateValues = parameters.getAll("date");
      const date = dateValues.length === 1 ? parseDate(dateValues[0]) : null;

      if (date === null) {
        return errorResponse(400, "INVALID_DATE");
      }

      return HttpResponse.json({
        type: "date",
        date,
        names: namesForDate(date.day, date.month),
      });
    }

    const nameValues = parameters.getAll("name");
    const nameValue = nameValues.length === 1 ? nameValues[0] : null;
    const dates = nameValue === null ? [] : datesForName(nameValue);
    const canonicalName =
      nameValue === null ? null : canonicalNameFor(nameValue);

    if (canonicalName === null || dates.length === 0) {
      return errorResponse(404, "NAME_NOT_FOUND");
    }

    return HttpResponse.json({
      type: "name",
      name: canonicalName,
      dates,
    });
  }),
];

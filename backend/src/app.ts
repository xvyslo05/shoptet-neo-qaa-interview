import express, { type Request, type Response } from "express";

import {
  canonicalNameFor,
  datesForName,
  namesForDate,
  parseDate,
} from "./engine.ts";

const ERROR_MESSAGES = {
  MISSING_QUERY: "Zadejte datum nebo jméno.",
  AMBIGUOUS_QUERY: "Zadejte pouze datum, nebo pouze jméno.",
  INVALID_DATE: "Zadané datum není platné.",
  NAME_NOT_FOUND: "Jméno nebylo v kalendáři nalezeno.",
} as const;

type ErrorCode = keyof typeof ERROR_MESSAGES;

function sendError(
  response: Response,
  status: 400 | 404,
  code: ErrorCode,
): void {
  response.status(status).json({
    error: {
      code,
      message: ERROR_MESSAGES[code],
    },
  });
}

export const app = express();

app.get("/api/nameday", (request: Request, response: Response) => {
  const hasDate = Object.hasOwn(request.query, "date");
  const hasName = Object.hasOwn(request.query, "name");

  if (!hasDate && !hasName) {
    sendError(response, 400, "MISSING_QUERY");
    return;
  }

  if (hasDate && hasName) {
    sendError(response, 400, "AMBIGUOUS_QUERY");
    return;
  }

  if (hasDate) {
    const dateValue = request.query.date;
    const date = typeof dateValue === "string" ? parseDate(dateValue) : null;

    if (date === null) {
      sendError(response, 400, "INVALID_DATE");
      return;
    }

    response.status(200).json({
      type: "date",
      date,
      names: namesForDate(date.day, date.month),
    });
    return;
  }

  const nameValue = request.query.name;
  const dates = typeof nameValue === "string" ? datesForName(nameValue) : [];
  const canonicalName =
    typeof nameValue === "string" ? canonicalNameFor(nameValue) : null;

  if (canonicalName === null || dates.length === 0) {
    sendError(response, 404, "NAME_NOT_FOUND");
    return;
  }

  response.status(200).json({
    type: "name",
    name: canonicalName,
    dates,
  });
});

/**
 * @description Stubbed API error responses, copied from the backend's
 * ERROR_MESSAGES (backend/src/app.ts). Component specs
 * reply with these instead of calling the real backend, so the form's
 * validation-message handling is tested in isolation.
 */
export const ApiErrors = {
  MISSING_QUERY: {
    status: 400,
    code: "MISSING_QUERY",
    message: "Zadejte datum nebo jméno.",
  },
  AMBIGUOUS_QUERY: {
    status: 400,
    code: "AMBIGUOUS_QUERY",
    message: "Zadejte pouze datum, nebo pouze jméno.",
  },
  INVALID_DATE: {
    status: 400,
    code: "INVALID_DATE",
    message: "Zadané datum není platné.",
  },
  NAME_NOT_FOUND: {
    status: 404,
    code: "NAME_NOT_FOUND",
    message: "Jméno nebylo v kalendáři nalezeno.",
  },
} as const;

export const NamedayTexts = {
  // api.ts fallback for a non-2xx response without a recognized error body
  ERROR_UNRECOGNIZED_500: "Požadavek selhal se stavem 500.",
} as const;

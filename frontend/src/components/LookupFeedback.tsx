import type { NamedayResult } from "../api.ts";

function formatDate(day: number, month: number): string {
  return `${day}.${month}.`;
}

function formatResult(result: NamedayResult | null): string {
  if (result === null) {
    return "";
  }

  if (result.type === "name") {
    const dates = result.dates
      .map(({ day, month }) => formatDate(day, month))
      .join(", ");
    return `${result.name} má svátek ${dates}`;
  }

  const date = formatDate(result.date.day, result.date.month);

  if (result.names.length === 0) {
    return `${date} nemá svátek žádné jméno.`;
  }

  const names = result.names.join(" a ");
  return `${date} má svátek ${names}.`;
}

interface LookupFeedbackProps {
  result: NamedayResult | null;
  error: string | null;
}

export function LookupFeedback({ result, error }: LookupFeedbackProps) {
  return (
    <>
      <output className="result" aria-live="polite" data-cy="result">
        {formatResult(result)}
      </output>
      <p className="error-message" role="alert" data-cy="error">
        {error ?? ""}
      </p>
    </>
  );
}

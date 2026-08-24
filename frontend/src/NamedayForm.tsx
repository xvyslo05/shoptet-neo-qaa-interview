import { type FormEvent, useRef, useState } from "react";

import { requestNameday, type NamedayResult } from "./api.ts";

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

export function NamedayForm() {
  const [date, setDate] = useState("");
  const [pickerDate, setPickerDate] = useState("");
  const [name, setName] = useState("");
  const [result, setResult] = useState<NamedayResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestVersion = useRef(0);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const currentRequest = ++requestVersion.current;
    setResult(null);
    setError(null);

    try {
      const nextResult = await requestNameday({
        date: date === "" ? undefined : date,
        name: name === "" ? undefined : name,
      });

      if (currentRequest === requestVersion.current) {
        setResult(nextResult);
      }
    } catch (caught: unknown) {
      if (currentRequest === requestVersion.current) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Vyhledání svátku se nezdařilo.",
        );
      }
    }
  }

  function reset(): void {
    requestVersion.current += 1;
    setDate("");
    setPickerDate("");
    setName("");
    setResult(null);
    setError(null);
  }

  return (
    <main className="page-shell">
      <section className="nameday-card" aria-labelledby="nameday-title">
        <p className="eyebrow">QAA pohovor</p>
        <h1 id="nameday-title">České svátky</h1>
        <p className="intro">
          Zadejte datum, nebo jméno a zjistěte, kdo má kdy svátek.
        </p>

        <form className="nameday-form" onSubmit={(event) => void submit(event)}>
          <div className="date-fields">
            <label className="field" htmlFor="date-input">
              <span>Datum</span>
              <input
                id="date-input"
                type="text"
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setPickerDate("");
                }}
                placeholder="např. 7.3."
                data-cy="date-input"
              />
            </label>

            <label className="field field--picker" htmlFor="date-picker">
              <span>Vybrat datum</span>
              <input
                id="date-picker"
                type="date"
                value={pickerDate}
                onChange={(event) => {
                  setPickerDate(event.target.value);
                  setDate(event.target.value);
                }}
                data-cy="date-picker"
              />
            </label>
          </div>

          <div className="choice-divider" aria-hidden="true">
            <span>nebo</span>
          </div>

          <label className="field" htmlFor="name-input">
            <span>Jméno</span>
            <input
              id="name-input"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="např. Tomáš"
              autoComplete="given-name"
              data-cy="name-input"
            />
          </label>

          <div className="actions">
            <button
              className="button button--primary"
              type="submit"
              data-cy="confirm"
            >
              Potvrdit
            </button>
            <button
              className="button button--secondary"
              type="button"
              onClick={reset}
              data-cy="reset"
            >
              Reset
            </button>
          </div>
        </form>

        <output className="result" aria-live="polite" data-cy="result">
          {formatResult(result)}
        </output>
        <p className="error-message" role="alert" data-cy="error">
          {error ?? ""}
        </p>
      </section>
    </main>
  );
}

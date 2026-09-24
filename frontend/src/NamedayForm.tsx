import { type FormEvent, useRef, useState } from "react";

import { requestNameday, type NamedayResult } from "./api.ts";
import { DateFields } from "./components/DateFields.tsx";
import { FormActions } from "./components/FormActions.tsx";
import { LookupFeedback } from "./components/LookupFeedback.tsx";
import { NameField } from "./components/NameField.tsx";

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
          <DateFields
            date={date}
            pickerDate={pickerDate}
            onDateChange={(value) => {
              setDate(value);
              setPickerDate("");
            }}
            onPickerChange={(value) => {
              setPickerDate(value);
              setDate(value);
            }}
          />

          <div className="choice-divider" aria-hidden="true">
            <span>nebo</span>
          </div>

          <NameField name={name} onNameChange={setName} />

          <FormActions onReset={reset} />
        </form>

        <LookupFeedback result={result} error={error} />
      </section>
    </main>
  );
}

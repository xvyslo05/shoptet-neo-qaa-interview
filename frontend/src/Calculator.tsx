import { useState } from "react";

import type { Op } from "@qaa/backend/engine";

import { requestCalculation } from "./api.ts";

interface KeyDefinition {
  label: string;
  accessibleName: string;
  dataCy: string;
  className?: string;
  action: () => void;
}

export function Calculator() {
  const [display, setDisplay] = useState("0");
  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [pendingOperator, setPendingOperator] = useState<Op | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function beginFreshEntryIfNeeded(): void {
    if (waitingForOperand && pendingOperator === null) {
      setAccumulator(null);
    }
  }

  function enterDigit(digit: string): void {
    beginFreshEntryIfNeeded();
    setError(null);
    setDisplay((current) =>
      waitingForOperand || current === "0" ? digit : current + digit,
    );
    setWaitingForOperand(false);
  }

  function enterDecimal(): void {
    beginFreshEntryIfNeeded();
    setError(null);

    if (waitingForOperand) {
      setDisplay("0.");
    } else {
      setDisplay((current) => (current.includes(".") ? current : `${current}.`));
    }

    setWaitingForOperand(false);
  }

  async function execute(a: number, b: number, op: Op): Promise<number | null> {
    setBusy(true);
    setError(null);

    try {
      return await requestCalculation(a, b, op);
    } catch (caught: unknown) {
      const message =
        caught instanceof Error ? caught.message : "The calculation failed";
      setError(message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function chooseOperator(operator: Op): Promise<void> {
    if (busy) {
      return;
    }

    const currentValue = Number(display);
    let nextAccumulator = accumulator;

    if (
      pendingOperator !== null &&
      accumulator !== null &&
      !waitingForOperand
    ) {
      const result = await execute(accumulator, currentValue, pendingOperator);

      if (result === null) {
        return;
      }

      setDisplay(String(result));
      nextAccumulator = result;
    } else if (nextAccumulator === null) {
      nextAccumulator = currentValue;
    }

    setAccumulator(nextAccumulator);
    setPendingOperator(operator);
    setWaitingForOperand(true);
  }

  async function equals(): Promise<void> {
    if (
      busy ||
      pendingOperator === null ||
      accumulator === null ||
      waitingForOperand
    ) {
      return;
    }

    const result = await execute(
      accumulator,
      Number(display),
      pendingOperator,
    );

    if (result === null) {
      return;
    }

    setDisplay(String(result));
    setAccumulator(result);
    setPendingOperator(null);
    setWaitingForOperand(true);
  }

  function clearEntry(): void {
    setDisplay("0");
    setError(null);
    setWaitingForOperand(false);

    if (pendingOperator === null) {
      setAccumulator(null);
    }
  }

  function clearAll(): void {
    setDisplay("0");
    setAccumulator(null);
    setPendingOperator(null);
    setWaitingForOperand(false);
    setError(null);
  }

  const keys: KeyDefinition[] = [
    {
      label: "C",
      accessibleName: "Clear all",
      dataCy: "clear-all",
      className: "key key--utility key--wide",
      action: clearAll,
    },
    {
      label: "CE",
      accessibleName: "Clear entry",
      dataCy: "clear-entry",
      className: "key key--utility",
      action: clearEntry,
    },
    {
      label: "/",
      accessibleName: "Divide",
      dataCy: "operator-divide",
      className: "key key--operator",
      action: () => {
        void chooseOperator("/");
      },
    },
    ...[
      ["7", "7"],
      ["8", "8"],
      ["9", "9"],
    ].map(([label, name]) => ({
      label,
      accessibleName: name,
      dataCy: `digit-${label}`,
      action: () => enterDigit(label),
    })),
    {
      label: "*",
      accessibleName: "Multiply",
      dataCy: "operator-multiply",
      className: "key key--operator",
      action: () => {
        void chooseOperator("*");
      },
    },
    ...[
      ["4", "4"],
      ["5", "5"],
      ["6", "6"],
    ].map(([label, name]) => ({
      label,
      accessibleName: name,
      dataCy: `digit-${label}`,
      action: () => enterDigit(label),
    })),
    {
      label: "-",
      accessibleName: "Subtract",
      dataCy: "operator-subtract",
      className: "key key--operator",
      action: () => {
        void chooseOperator("-");
      },
    },
    ...[
      ["1", "1"],
      ["2", "2"],
      ["3", "3"],
    ].map(([label, name]) => ({
      label,
      accessibleName: name,
      dataCy: `digit-${label}`,
      action: () => enterDigit(label),
    })),
    {
      label: "+",
      accessibleName: "Add",
      dataCy: "operator-add",
      className: "key key--operator",
      action: () => {
        void chooseOperator("+");
      },
    },
    {
      label: "0",
      accessibleName: "0",
      dataCy: "digit-0",
      className: "key key--wide",
      action: () => enterDigit("0"),
    },
    {
      label: ".",
      accessibleName: "Decimal point",
      dataCy: "decimal",
      action: enterDecimal,
    },
    {
      label: "=",
      accessibleName: "Equals",
      dataCy: "equals",
      className: "key key--equals",
      action: () => {
        void equals();
      },
    },
  ];

  return (
    <main className="page-shell">
      <section
        className="calculator"
        aria-label="Calculator"
        data-cy="calculator"
      >
        <p className="eyebrow">QAA interview</p>
        <h1>Calculator</h1>
        <output
          className="display"
          aria-label="Calculator display"
          data-cy="display"
        >
          {display}
        </output>
        <div className="error-slot">
          {error === null ? null : (
            <p className="error-message" role="alert" data-cy="error">
              {error}
            </p>
          )}
        </div>
        <div className="keypad">
          {keys.map((key) => (
            <button
              key={key.dataCy}
              type="button"
              aria-label={key.accessibleName}
              data-cy={key.dataCy}
              className={key.className ?? "key"}
              disabled={busy}
              onClick={key.action}
            >
              {key.label}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

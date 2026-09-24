import { fireEvent, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { NamedayResult } from "../src/api.ts";
import { requestNameday } from "../src/api.ts";
import { NamedayForm } from "../src/NamedayForm.tsx";
import { NamedayFormSelectors } from "./NamedayFormSelectors.ts";
import { get } from "./testUtils.ts";

vi.mock("../src/api.ts", () => ({
  requestNameday: vi.fn(),
}));

const mockedRequestNameday = vi.mocked(requestNameday);

const {
  DATE_INPUT_SELECTOR,
  DATE_PICKER_SELECTOR,
  NAME_INPUT_SELECTOR,
  CONFIRM_BUTTON_SELECTOR,
  RESET_BUTTON_SELECTOR,
  RESULT_SELECTOR,
  ERROR_SELECTOR,
} = NamedayFormSelectors;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

async function expectResult(text: string) {
  await waitFor(() => {
    expect(get(RESULT_SELECTOR)).toHaveTextContent(text);
  });
}

async function expectError(text: string) {
  await waitFor(() => {
    expect(get(ERROR_SELECTOR)).toHaveTextContent(text);
  });
}

describe("NamedayForm", () => {
  beforeEach(() => {
    mockedRequestNameday.mockReset();
  });

  describe("Rendering the result", () => {
    // AC13.a: a date with one name renders that single name
    it("renders a single name for the date", async () => {
      mockedRequestNameday.mockResolvedValue({
        type: "date",
        date: { day: 7, month: 3 },
        names: ["Tomáš"],
      });
      const user = userEvent.setup();
      render(<NamedayForm />);

      await user.type(get(DATE_INPUT_SELECTOR), "7.3.");
      await user.click(get(CONFIRM_BUTTON_SELECTOR));

      await expectResult("7.3. má svátek Tomáš");
    });

    // AC13.b: a date with several names joins them with "a"
    it("renders multiple names joined with 'a'", async () => {
      mockedRequestNameday.mockResolvedValue({
        type: "date",
        date: { day: 7, month: 4 },
        names: ["Heřman", "Hermína"],
      });
      const user = userEvent.setup();
      render(<NamedayForm />);

      await user.type(get(DATE_INPUT_SELECTOR), "7.4.");
      await user.click(get(CONFIRM_BUTTON_SELECTOR));

      await expectResult("7.4. má svátek Heřman a Hermína");
    });

    // AC13.c: a date with no names renders the zero-names message
    it("renders the zero-names message", async () => {
      mockedRequestNameday.mockResolvedValue({
        type: "date",
        date: { day: 1, month: 1 },
        names: [],
      });
      const user = userEvent.setup();
      render(<NamedayForm />);

      await user.type(get(DATE_INPUT_SELECTOR), "1.1.");
      await user.click(get(CONFIRM_BUTTON_SELECTOR));

      await expectResult("1.1. nemá svátek žádné jméno.");
    });

    // AC13.d: a name with several dates renders them comma-separated
    it("renders multiple dates for a name, comma-separated", async () => {
      mockedRequestNameday.mockResolvedValue({
        type: "name",
        name: "Petr",
        dates: [
          { day: 22, month: 2 },
          { day: 29, month: 6 },
        ],
      });
      const user = userEvent.setup();
      render(<NamedayForm />);

      await user.type(get(NAME_INPUT_SELECTOR), "Petr");
      await user.click(get(CONFIRM_BUTTON_SELECTOR));

      await expectResult("Petr má svátek 22.2., 29.6.");
    });
  });

  describe("Date field and picker interaction", () => {
    // AC10.b: using the picker overwrites the date text field with its own value, it does not clear it
    it("overwrites the date text field with the picker's value", async () => {
      render(<NamedayForm />);

      await userEvent.type(get(DATE_INPUT_SELECTOR), "7.3.");
      expect(get<HTMLInputElement>(DATE_INPUT_SELECTOR).value).toBe("7.3.");

      fireEvent.change(get(DATE_PICKER_SELECTOR), {
        target: { value: "2026-03-07" },
      });

      expect(get<HTMLInputElement>(DATE_PICKER_SELECTOR).value).toBe(
        "2026-03-07",
      );
      expect(get<HTMLInputElement>(DATE_INPUT_SELECTOR).value).toBe(
        "2026-03-07",
      );
    });

    // AC10.a: typing in the date text field clears the picker
    it("clears the picker once the date text field is typed into", async () => {
      render(<NamedayForm />);

      fireEvent.change(get(DATE_PICKER_SELECTOR), {
        target: { value: "2026-03-07" },
      });
      expect(get<HTMLInputElement>(DATE_PICKER_SELECTOR).value).toBe(
        "2026-03-07",
      );

      await userEvent.type(get(DATE_INPUT_SELECTOR), "7.3.");

      expect(get<HTMLInputElement>(DATE_PICKER_SELECTOR).value).toBe("");
    });
  });

  describe("Submitting with both fields filled", () => {
    // AC10.c, AC9: both fields reach submit unblocked; the API's ambiguous-query error is shown
    it("submits with both date and name present, and shows the ambiguous-query error", async () => {
      mockedRequestNameday.mockRejectedValue(
        new Error("Zadejte pouze datum, nebo pouze jméno."),
      );
      const user = userEvent.setup();
      render(<NamedayForm />);

      await user.type(get(DATE_INPUT_SELECTOR), "7.3.");
      await user.type(get(NAME_INPUT_SELECTOR), "Tomáš");
      await user.click(get(CONFIRM_BUTTON_SELECTOR));

      expect(mockedRequestNameday).toHaveBeenCalledWith({
        date: "7.3.",
        name: "Tomáš",
      });
      await expectError("Zadejte pouze datum, nebo pouze jméno.");
    });
  });

  describe("Reset", () => {
    // AC11.a: Reset clears both fields, the result and the error
    it("clears both fields, the result and the error", async () => {
      mockedRequestNameday.mockResolvedValue({
        type: "date",
        date: { day: 7, month: 3 },
        names: ["Tomáš"],
      });
      const user = userEvent.setup();
      render(<NamedayForm />);

      await user.type(get(DATE_INPUT_SELECTOR), "7.3.");
      await user.click(get(CONFIRM_BUTTON_SELECTOR));
      await expectResult("Tomáš");

      await user.click(get(RESET_BUTTON_SELECTOR));

      expect(get<HTMLInputElement>(DATE_INPUT_SELECTOR).value).toBe("");
      expect(get<HTMLInputElement>(DATE_PICKER_SELECTOR).value).toBe("");
      expect(get<HTMLInputElement>(NAME_INPUT_SELECTOR).value).toBe("");
      expect(get(RESULT_SELECTOR)).toHaveTextContent("");
      expect(get(ERROR_SELECTOR)).toHaveTextContent("");
    });
  });

  describe("Stale response handling", () => {
    // AC11.b: a response that resolves after Reset was clicked is discarded
    it("discards a response that resolves after Reset was clicked", async () => {
      const first = deferred<NamedayResult>();
      mockedRequestNameday.mockReturnValueOnce(first.promise);

      const user = userEvent.setup();
      render(<NamedayForm />);

      await user.type(get(DATE_INPUT_SELECTOR), "7.3.");
      await user.click(get(CONFIRM_BUTTON_SELECTOR));
      await user.click(get(RESET_BUTTON_SELECTOR));

      first.resolve({
        type: "date",
        date: { day: 7, month: 3 },
        names: ["Tomáš"],
      });

      await waitFor(() => {
        expect(get(RESULT_SELECTOR)).toHaveTextContent("");
      });
    });

    // AC12: only the latest of two overlapping requests is shown, even when the earlier one resolves last
    it("shows only the latest request's result, even when the earlier one resolves last", async () => {
      const first = deferred<NamedayResult>();
      const second = deferred<NamedayResult>();
      mockedRequestNameday
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise);

      const user = userEvent.setup();
      render(<NamedayForm />);
      const dateInput = get<HTMLInputElement>(DATE_INPUT_SELECTOR);

      await user.type(dateInput, "7.3.");
      await user.click(get(CONFIRM_BUTTON_SELECTOR));

      await user.clear(dateInput);
      await user.type(dateInput, "1.1.");
      await user.click(get(CONFIRM_BUTTON_SELECTOR));

      second.resolve({ type: "date", date: { day: 1, month: 1 }, names: [] });
      await expectResult("1.1. nemá svátek žádné jméno.");

      first.resolve({
        type: "date",
        date: { day: 7, month: 3 },
        names: ["Tomáš"],
      });

      await expectResult("1.1. nemá svátek žádné jméno.");
    });
  });

  describe("Error display for unexpected failures", () => {
    // AC14.b: an unrecognized non-2xx response still renders an error, never a crash
    it("shows an error message for an unrecognized non-2xx response", async () => {
      mockedRequestNameday.mockRejectedValue(
        new Error("Požadavek selhal se stavem 500."),
      );
      const user = userEvent.setup();
      render(<NamedayForm />);

      await user.type(get(DATE_INPUT_SELECTOR), "7.3.");
      await user.click(get(CONFIRM_BUTTON_SELECTOR));

      await expectError("Požadavek selhal se stavem 500.");
      expect(get(RESULT_SELECTOR)).toHaveTextContent("");
    });

    // AC14.c: a network-level failure still renders an error, never a crash
    it("shows the thrown error's message when the request itself fails", async () => {
      mockedRequestNameday.mockRejectedValue(new TypeError("Failed to fetch"));
      const user = userEvent.setup();
      render(<NamedayForm />);

      await user.type(get(DATE_INPUT_SELECTOR), "7.3.");
      await user.click(get(CONFIRM_BUTTON_SELECTOR));

      await expectError("Failed to fetch");
    });
  });
});

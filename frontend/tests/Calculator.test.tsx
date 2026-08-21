import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Calculator } from "../src/Calculator.tsx";

describe("Calculator", () => {
  it("renders all calculator buttons", () => {
    render(<Calculator />);

    const buttonNames = [
      "Clear all",
      "Clear entry",
      "Divide",
      "7",
      "8",
      "9",
      "Multiply",
      "4",
      "5",
      "6",
      "Subtract",
      "1",
      "2",
      "3",
      "Add",
      "0",
      "Decimal point",
      "Equals",
    ];

    for (const name of buttonNames) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("updates the display when digit buttons are clicked", async () => {
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(screen.getByRole("button", { name: "4" }));
    await user.click(screen.getByRole("button", { name: "2" }));

    expect(screen.getByLabelText("Calculator display")).toHaveTextContent("42");
  });
});

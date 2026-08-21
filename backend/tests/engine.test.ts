import { describe, expect, it } from "vitest";

import { calculate } from "../src/engine.ts";

describe("calculate", () => {
  it("adds two positive operands", () => {
    expect(calculate(2, 3, "+")).toBe(5);
  });

  it("adds when one operand is negative", () => {
    expect(calculate(-2, 3, "+")).toBe(1);
  });

  it("subtracts two operands", () => {
    expect(calculate(9, 4, "-")).toBe(5);
  });

  it("multiplies two operands", () => {
    expect(calculate(6, 7, "*")).toBe(42);
  });
});

export type Op = "+" | "-" | "*" | "/";

export class DivisionByZeroError extends Error {
  constructor() {
    super("Cannot divide by zero");
    this.name = "DivisionByZeroError";
  }
}

export function isOp(value: unknown): value is Op {
  return value === "+" || value === "-" || value === "*" || value === "/";
}

export function calculate(a: number, b: number, op: Op): number {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      if (b === 0) {
        throw new DivisionByZeroError();
      }
      return a / b;
    default: {
      const exhaustiveCheck: never = op;
      throw new TypeError(`Unknown operator: ${String(exhaustiveCheck)}`);
    }
  }
}

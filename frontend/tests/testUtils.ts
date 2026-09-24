export function get<T extends Element = HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (element === null) {
    throw new Error(`No element found for selector: ${selector}`);
  }

  return element;
}

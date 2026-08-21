import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Calculator } from "./Calculator.tsx";
import "./styles.css";

async function enableProductionApiMock(): Promise<void> {
  if (!import.meta.env.PROD) {
    return;
  }

  const { worker } = await import("./mocks/browser.ts");
  await worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: {
      url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
    },
  });
}

void enableProductionApiMock().then(() => {
  const rootElement = document.getElementById("root");

  if (rootElement === null) {
    throw new Error("Root element not found");
  }

  createRoot(rootElement).render(
    <StrictMode>
      <Calculator />
    </StrictMode>,
  );
});

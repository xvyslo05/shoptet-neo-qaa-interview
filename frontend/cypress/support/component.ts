// Loaded before every component spec.
// Registers cy.mount and the app's global styles, so components render
// (and are visible) exactly as they are in the real page.
import { mount } from "cypress/react";

import "../../src/styles.css";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}

Cypress.Commands.add("mount", mount);

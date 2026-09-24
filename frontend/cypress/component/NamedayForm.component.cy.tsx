import { NamedayForm as NamedayFormComponent } from "../../src/NamedayForm.tsx";
import { Endpoints } from "../support/constants/Endpoints";
import {
  ApiErrors,
  NamedayTexts,
} from "../support/constants/texts/nameday_texts";
import { NamedayForm } from "../support/page_objects/NamedayForm";

type ApiError = (typeof ApiErrors)[keyof typeof ApiErrors];

// The engine validates on the server, so every validation message the form
// shows is an API error body. The network is stubbed with cy.intercept: the
// real api.ts runs (query building, error parsing), but no backend is
// involved, and each test asserts on the exact request the form sent.
const stubApiError = ({ status, code, message }: ApiError) => {
  cy.intercept("GET", Endpoints.NAMEDAY, {
    statusCode: status,
    body: { error: { code, message } },
  }).as("nameday");
};

const expectQuery = (expected: Record<string, string>) => {
  cy.wait("@nameday").then(({ request }) => {
    const parameters = new URL(request.url).searchParams;
    expect(Object.fromEntries(parameters)).to.deep.equal(expected);
  });
};

const expectValidationMessage = (message: string) => {
  cy.contains(NamedayForm.ERROR_SELECTOR, message).should("be.visible");
  cy.get(NamedayForm.RESULT_SELECTOR).should("have.text", "");
};

describe("NamedayForm component", () => {
  beforeEach(() => {
    cy.mount(<NamedayFormComponent />);
  });

  describe("Date validation", () => {
    it("shows the missing-query message when submitted with no date and no name", () => {
      stubApiError(ApiErrors.MISSING_QUERY);

      cy.get(NamedayForm.CONFIRM_BUTTON_SELECTOR).click();

      expectQuery({});
      expectValidationMessage(ApiErrors.MISSING_QUERY.message);
    });

    it("shows the invalid-date message for a non-existent date", () => {
      stubApiError(ApiErrors.INVALID_DATE);

      cy.get(NamedayForm.DATE_INPUT_SELECTOR).type("32.1.", { delay: 0 });
      cy.get(NamedayForm.CONFIRM_BUTTON_SELECTOR).click();

      expectQuery({ date: "32.1." });
      expectValidationMessage(ApiErrors.INVALID_DATE.message);
    });

    it("shows the invalid-date message for an unparsable date string", () => {
      stubApiError(ApiErrors.INVALID_DATE);

      cy.get(NamedayForm.DATE_INPUT_SELECTOR).type("not-a-date", {
        delay: 0,
      });
      cy.get(NamedayForm.CONFIRM_BUTTON_SELECTOR).click();

      expectQuery({ date: "not-a-date" });
      expectValidationMessage(ApiErrors.INVALID_DATE.message);
    });
  });

  describe("Name validation", () => {
    it("shows the name-not-found message for an unknown name", () => {
      stubApiError(ApiErrors.NAME_NOT_FOUND);

      cy.get(NamedayForm.NAME_INPUT_SELECTOR).type("Xyzabc", { delay: 0 });
      cy.get(NamedayForm.CONFIRM_BUTTON_SELECTOR).click();

      expectQuery({ name: "Xyzabc" });
      expectValidationMessage(ApiErrors.NAME_NOT_FOUND.message);
    });

    it("shows the ambiguous-query message when both date and name are filled", () => {
      stubApiError(ApiErrors.AMBIGUOUS_QUERY);

      cy.get(NamedayForm.DATE_INPUT_SELECTOR).type("7.3.", { delay: 0 });
      cy.get(NamedayForm.NAME_INPUT_SELECTOR).type("Tomáš", { delay: 0 });
      cy.get(NamedayForm.CONFIRM_BUTTON_SELECTOR).click();

      expectQuery({ date: "7.3.", name: "Tomáš" });
      expectValidationMessage(ApiErrors.AMBIGUOUS_QUERY.message);
    });
  });

  describe("Validation message lifecycle", () => {
    it("replaces the validation message with the result once the input is corrected", () => {
      stubApiError(ApiErrors.INVALID_DATE);
      cy.get(NamedayForm.DATE_INPUT_SELECTOR).type("32.1.", { delay: 0 });
      cy.get(NamedayForm.CONFIRM_BUTTON_SELECTOR).click();
      expectQuery({ date: "32.1." });
      expectValidationMessage(ApiErrors.INVALID_DATE.message);

      cy.intercept("GET", Endpoints.NAMEDAY, {
        body: { type: "date", date: { day: 7, month: 3 }, names: ["Tomáš"] },
      }).as("nameday");
      cy.get(NamedayForm.DATE_INPUT_SELECTOR).clear().type("7.3.", {
        delay: 0,
      });
      cy.get(NamedayForm.CONFIRM_BUTTON_SELECTOR).click();

      expectQuery({ date: "7.3." });
      cy.get(NamedayForm.RESULT_SELECTOR).should(
        "have.text",
        "7.3. má svátek Tomáš.",
      );
      cy.get(NamedayForm.ERROR_SELECTOR).should("have.text", "");
    });

    it("shows a generic message for an error response without a recognized body", () => {
      cy.intercept("GET", Endpoints.NAMEDAY, {
        statusCode: 500,
        body: { oops: "unexpected shape" },
      }).as("nameday");

      cy.get(NamedayForm.DATE_INPUT_SELECTOR).type("7.3.", { delay: 0 });
      cy.get(NamedayForm.CONFIRM_BUTTON_SELECTOR).click();

      expectValidationMessage(NamedayTexts.ERROR_UNRECOGNIZED_500);
    });
  });

  describe("Reset", () => {
    it("clears all fields and the validation message without sending a request", () => {
      stubApiError(ApiErrors.AMBIGUOUS_QUERY);
      cy.get(NamedayForm.DATE_PICKER_SELECTOR).type("2026-03-07");
      cy.get(NamedayForm.NAME_INPUT_SELECTOR).type("Tomáš", { delay: 0 });
      cy.get(NamedayForm.CONFIRM_BUTTON_SELECTOR).click();
      expectValidationMessage(ApiErrors.AMBIGUOUS_QUERY.message);

      cy.get(NamedayForm.RESET_BUTTON_SELECTOR).click();

      cy.get(NamedayForm.DATE_INPUT_SELECTOR).should("have.value", "");
      cy.get(NamedayForm.DATE_PICKER_SELECTOR).should("have.value", "");
      cy.get(NamedayForm.NAME_INPUT_SELECTOR).should("have.value", "");
      cy.get(NamedayForm.ERROR_SELECTOR).should("have.text", "");
      cy.get(NamedayForm.RESULT_SELECTOR).should("have.text", "");
      cy.get("@nameday.all").should("have.length", 1);
    });
  });
});

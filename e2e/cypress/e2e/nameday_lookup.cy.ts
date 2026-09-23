import { Endpoints } from "../support/constants/Endpoints";
import { NamedayTexts } from "../support/constants/texts/nameday_texts";
import { NamedayForm } from "../support/page_objects/NamedayForm";
import { randomNameLookup, todaysDateLookup } from "../support/utils/nameday";

describe("Czech Name-Day Lookup", () => {
  beforeEach(() => {
    cy.intercept("GET", Endpoints.NAMEDAY).as("nameday");
    cy.visit("/");
  });

  // Feature: [TC-052] Look up a name day in both directions
  //
  // Scenario: [TC-052] Successful lookup by date, then by name
  //   GIVEN the app is open
  //   WHEN a user picks today's date with the native date picker and confirms
  //   THEN today's name-day result is shown
  //   WHEN they reset and submit a known name
  //   THEN that name's date is shown
  it("[TC-052] looks up today's date via the picker, then a random name", () => {
    const { expectedResult: dateResult } = todaysDateLookup();
    const { name, expectedResult: nameResult } = randomNameLookup();
    const isoToday = new Date().toISOString().slice(0, 10);

    cy.get(NamedayForm.DATE_PICKER_SELECTOR)
      .should("be.enabled")
      .type(isoToday, { delay: 0 });
    cy.get(NamedayForm.CONFIRM_BUTTON_SELECTOR).should("be.enabled").click();
    cy.wait("@nameday");

    cy.contains(NamedayForm.RESULT_SELECTOR, dateResult).should("be.visible");

    cy.get(NamedayForm.RESET_BUTTON_SELECTOR).should("be.enabled").click();

    cy.get(NamedayForm.NAME_INPUT_SELECTOR)
      .should("be.enabled")
      .clear()
      .type(name, { delay: 0 });
    cy.get(NamedayForm.CONFIRM_BUTTON_SELECTOR).should("be.enabled").click();
    cy.wait("@nameday");

    cy.contains(NamedayForm.RESULT_SELECTOR, nameResult).should("be.visible");
  });

  // Scenario: [TC-053] Error is replaced by a correct result after fixing the input
  //   GIVEN the app is open
  //   WHEN a user submits an invalid date
  //   THEN an error is shown and no result is rendered
  //   WHEN they correct the date to today and resubmit
  //   THEN the correct result replaces the error
  it("[TC-053] shows an error for an invalid date, then a correct result after fixing it", () => {
    const { czechDate, expectedResult } = todaysDateLookup();

    cy.get(NamedayForm.DATE_INPUT_SELECTOR)
      .should("be.enabled")
      .clear()
      .type("32.1.", { delay: 0 });
    cy.get(NamedayForm.CONFIRM_BUTTON_SELECTOR).should("be.enabled").click();
    cy.wait("@nameday");

    cy.contains(
      NamedayForm.ERROR_SELECTOR,
      NamedayTexts.ERROR_INVALID_DATE,
    ).should("be.visible");
    cy.get(NamedayForm.RESULT_SELECTOR).should("have.text", "");

    cy.get(NamedayForm.DATE_INPUT_SELECTOR)
      .should("be.enabled")
      .clear()
      .type(czechDate, { delay: 0 });
    cy.get(NamedayForm.CONFIRM_BUTTON_SELECTOR).should("be.enabled").click();
    cy.wait("@nameday");

    cy.contains(NamedayForm.RESULT_SELECTOR, expectedResult).should(
      "be.visible",
    );
    cy.get(NamedayForm.ERROR_SELECTOR).should("have.text", "");
  });
});

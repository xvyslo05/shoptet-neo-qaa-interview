import { Endpoints } from "../support/constants/Endpoints";
import { NamedayTexts } from "../support/constants/texts/nameday_texts";
import { NamedayForm } from "../support/page_objects/NamedayForm";
import { randomNameLookup, todaysDateLookup } from "../support/utils/nameday";

const dateLookup = todaysDateLookup();
const nameLookup = randomNameLookup();

describe("Czech Name-Day Lookup", () => {
  beforeEach(() => {
    cy.intercept("GET", Endpoints.NAMEDAY).as("nameday");
    cy.visit("/");
  });

  // GIVEN the app is open
  // WHEN a user picks today's date with the native date picker and confirms
  // THEN today's name-day result is shown
  // WHEN he resets and submits a valid name
  // THEN that name's date is shown
  it("[TC-052] The native date picker and a name lookup return the correct result", () => {
    cy.log("Look up today's date via the native picker");
    cy.get(NamedayForm.DATE_PICKER_SELECTOR)
      .should("be.enabled")
      .type(dateLookup.isoDate, { delay: 0 });
    cy.get(NamedayForm.CONFIRM_BUTTON_SELECTOR).should("be.enabled").click();
    cy.wait("@nameday");

    cy.log("Check result");
    cy.contains(NamedayForm.RESULT_SELECTOR, dateLookup.expectedResult).should(
      "be.visible",
    );

    cy.log("Reset, then look up a random known name");
    cy.get(NamedayForm.RESET_BUTTON_SELECTOR).should("be.enabled").click();

    cy.get(NamedayForm.NAME_INPUT_SELECTOR)
      .should("be.enabled")
      .type(nameLookup.name, { delay: 0 });
    cy.get(NamedayForm.CONFIRM_BUTTON_SELECTOR).should("be.enabled").click();
    cy.wait("@nameday");

    cy.contains(NamedayForm.RESULT_SELECTOR, nameLookup.expectedResult).should(
      "be.visible",
    );
  });

  // GIVEN the app is open
  // WHEN a user enters and submits an invalid date
  // THEN an error is shown and no result is rendered
  // WHEN he resets
  // THEN the error is cleared
  // WHEN he enters today's date and submits
  // THEN the correct result is shown
  it("[TC-053] Error is replaced by a correct result after fixing the input", () => {
    const invalidDate = "32.1.";

    cy.log("Submit an invalid date and expect an error");
    cy.get(NamedayForm.DATE_INPUT_SELECTOR)
      .should("be.enabled")
      .type(invalidDate, { delay: 0 });
    cy.get(NamedayForm.CONFIRM_BUTTON_SELECTOR).should("be.enabled").click();
    cy.wait("@nameday");

    cy.contains(
      NamedayForm.ERROR_SELECTOR,
      NamedayTexts.ERROR_INVALID_DATE,
    ).should("be.visible");
    cy.get(NamedayForm.RESULT_SELECTOR).should("be.empty");

    cy.log("Reset, then correct the date and expect the error to be replaced");
    cy.get(NamedayForm.RESET_BUTTON_SELECTOR).should("be.enabled").click();
    cy.get(NamedayForm.ERROR_SELECTOR).should("be.empty");

    cy.get(NamedayForm.DATE_INPUT_SELECTOR)
      .should("be.enabled")
      .type(dateLookup.czechDate, { delay: 0 });
    cy.get(NamedayForm.CONFIRM_BUTTON_SELECTOR).should("be.enabled").click();
    cy.wait("@nameday");

    cy.contains(NamedayForm.RESULT_SELECTOR, dateLookup.expectedResult).should(
      "be.visible",
    );
    cy.get(NamedayForm.ERROR_SELECTOR).should("be.empty");
  });
});

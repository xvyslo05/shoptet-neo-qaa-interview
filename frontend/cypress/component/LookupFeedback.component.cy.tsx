import { LookupFeedback } from "../../src/components/LookupFeedback.tsx";
import { ApiErrors } from "../support/constants/texts/nameday_texts";
import { NamedayForm } from "../support/page_objects/NamedayForm";

// Pure presentational component: mounted with props only, no network at all.
describe("LookupFeedback component", () => {
  it("shows a validation message in the alert region and no result", () => {
    cy.mount(
      <LookupFeedback result={null} error={ApiErrors.INVALID_DATE.message} />,
    );

    cy.get(NamedayForm.ERROR_SELECTOR)
      .should("have.attr", "role", "alert")
      .and("have.text", ApiErrors.INVALID_DATE.message)
      .and("be.visible");
    cy.get(NamedayForm.RESULT_SELECTOR).should("have.text", "");
  });

  it("renders empty result and error regions when there is nothing to show", () => {
    cy.mount(<LookupFeedback result={null} error={null} />);

    cy.get(NamedayForm.RESULT_SELECTOR)
      .should("have.attr", "aria-live", "polite")
      .and("have.text", "");
    cy.get(NamedayForm.ERROR_SELECTOR).should("have.text", "");
  });
});

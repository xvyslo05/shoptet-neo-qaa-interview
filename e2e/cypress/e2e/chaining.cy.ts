describe("calculator chaining", () => {
  it("chains the previous result into the next operation", () => {
    cy.visit("/");

    cy.get('[data-cy="digit-2"]').click();
    cy.get('[data-cy="operator-add"]').click();
    cy.get('[data-cy="digit-3"]').click();
    cy.get('[data-cy="operator-add"]').click();
    cy.get('[data-cy="digit-4"]').click();
    cy.get('[data-cy="equals"]').click();

    cy.get('[data-cy="display"] input').should("have.value", "9");
  });
});

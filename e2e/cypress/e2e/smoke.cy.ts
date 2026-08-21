describe("calculator smoke", () => {
  it("loads the page and shows the calculator", () => {
    cy.visit("/");

    cy.get('[data-cy="calculator"]').should("be.visible");
    cy.get('[data-cy="display"]').should("have.text", "0");
  });
});

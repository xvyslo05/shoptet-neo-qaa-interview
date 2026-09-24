Cypress.on("uncaught:exception", () => {
  return false;
});

let res = "";

describe("svatky", () => {
  it("test 1", () => {
    cy.visit("http://localhost:5173/shoptet-neo-qaa-interview/");
    cy.wait(2000);

    // datum
    cy.get("#date-input").type("7.3.");
    cy.contains("Potvrdit").click();
    cy.wait(2000);
    cy.get(".result").should("contain", "Tomáš");
    cy.get(".result").should("have.text", "7.3. má svátek Tomáš.");

    cy.contains("Reset").click();
    cy.wait(500);

    // jmeno
    cy.get('input[placeholder="např. Tomáš"]').type("Tomáš", { force: true });
    cy.contains("Potvrdit").click({ force: true });
    cy.wait(2000);
    cy.get("output")
      .invoke("text")
      .then((text) => {
        expect(text).to.eq("Tomáš má svátek 7.3.");
        res = text;
      });

    cy.visit("http://localhost:5173/shoptet-neo-qaa-interview/");
    cy.wait(1000);

    // spatne datum
    cy.get("#date-input").type("32.1.");
    cy.contains("Potvrdit").click();
    cy.wait(1500);
    cy.get("body").then(($body) => {
      if ($body.find(".error-message").text().length > 0) {
        cy.get(".error-message").should("contain", "není platné");
        cy.get(".actions > button:nth-child(2)").click();
      }
    });
    cy.get("output").should("have.text", "");

    // kalendar
    cy.get(".date-fields label:nth-child(2) input").type("2026-03-07");
    cy.contains("Potvrdit").click();
    cy.wait(2000);
    cy.get(".result").should("have.text", "7.3. má svátek Tomáš.");

    cy.get(".actions > button:nth-child(2)").click();
    cy.get(".date-fields label:nth-child(2) input").type("2026-12-24");
    cy.contains("Potvrdit").click();
    cy.wait(2000);
    cy.get(".result").should("have.text", "24.12. má svátek Adam a Eva.");
    console.log("test 1 done");
  });

  it("name works", () => {
    cy.request("http://localhost:3000/api/nameday?name=Josef").then(
      (response) => {
        expect(response.status).to.eq(200);
        expect(response.body.dates.length).to.eq(1);
      },
    );

    cy.visit("http://localhost:5173/shoptet-neo-qaa-interview/");
    cy.wait(2000);
    cy.get("input").should("have.length", 3);
    cy.get("input").eq(2).type("Josef");
    cy.get(".button--primary").click();
    cy.wait(2000);
    cy.get(".result").should("have.text", "Josef má svátek 19.3.");

    cy.visit("http://localhost:5173/shoptet-neo-qaa-interview/");
    cy.wait(2000);
    cy.get("input").eq(2).type("Petr");
    cy.get(".button--primary").click();
    cy.wait(2000);
    cy.get(".result").should("have.text", "Petr má svátek 22.2., 29.6.");

    cy.visit("http://localhost:5173/shoptet-neo-qaa-interview/");
    cy.wait(2000);
    cy.get("input").eq(2).type("Eva");
    cy.get(".button--primary").click();
    cy.wait(2000);
    cy.get(".result").should("have.text", "Eva má svátek 24.12.");

    cy.visit("http://localhost:5173/shoptet-neo-qaa-interview/");
    cy.wait(2000);
    cy.get("input").eq(2).type("Xyz");
    cy.get(".button--primary").click();
    cy.wait(2000);
    cy.get(".error-message").should("exist");
  });

  it("same result without diacritics", () => {
    cy.visit("http://localhost:5173/shoptet-neo-qaa-interview/");
    cy.wait(2000);
    cy.get('input[placeholder="např. Tomáš"]').type("tomas");
    const btn = cy.get("button[type=submit]");
    btn.click();
    cy.wait(3000);
    cy.get(".result").should("have.text", res);
  });

  it("check errors", () => {
    cy.visit("http://localhost:5173/shoptet-neo-qaa-interview/");
    cy.wait(2000);
    cy.get("#date-input").then((x) => {
      cy.wrap(x).type("32.1.");
      cy.get("button[type=submit]").then((b) => {
        b.click();
        cy.wait(1000);
        cy.get(".nameday-card > p:last-child").then((el) => {
          expect(el.text()).to.contain("není platné");
          cy.get(".result").then((r) => {
            expect(r.text().length).to.eq(0);
            cy.contains("Reset").click();
            cy.wait(500);
            cy.get(".nameday-card > p:last-child").then((el2) => {
              expect(el2.text()).to.eq("");
            });
          });
        });
      });
    });

    cy.get("button[type=submit]").click();
    cy.wait(1000);
    cy.get(".error-message").should("have.text", "Zadejte datum nebo jméno.");

    cy.get("#date-input").type("7.3.");
    cy.get('input[placeholder="např. Tomáš"]').type("Josef");
    cy.get("button[type=submit]").click();
    cy.wait(1000);
    cy.get(".error-message").should(
      "have.text",
      "Zadejte pouze datum, nebo pouze jméno.",
    );
    // cy.get('[data-cy="confirm"]').click()
  });

  // TODO fix later
  it.skip("reset", () => {
    cy.visit("http://localhost:5173/shoptet-neo-qaa-interview/");
    cy.get("#date-input").type("7.3.");
    cy.contains("Reset").click();
  });
});

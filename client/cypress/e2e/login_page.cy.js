describe('Login Page', () => {

  beforeEach(() => {
    cy.visit('/'); // la pagina di login è la root
  });

  it('Mostra correttamente la navbar con logo e login', () => {
    // Logo principale
    cy.contains('Participium').should('be.visible');

    // Pulsante login
    cy.contains('Login').should('be.visible').and('have.class', 'btn-primary'); // supponendo btn-primary per il blu
  });

  it('Mostra correttamente il footer', () => {
    // Prima colonna
    cy.contains('Participium').should('be.visible');
    cy.contains('Empowering citizens through digital civic participation and community engagement.').should('be.visible');

    // Seconda colonna Quick Links
    cy.contains('Quick Links').should('be.visible');
    cy.contains('Help').should('be.visible');
    cy.contains('About Us').should('be.visible');
    cy.contains('Contact').should('be.visible');
    cy.contains('Features').should('be.visible');

    // Terza colonna Connect with us
    cy.contains('Connect With Us').should('be.visible');
    cy.get('.social-link').should('have.length', 4);
  });

  it('Apre popup login correttamente', () => {
    cy.contains('Login').click();

    // Verifica testo del popup
    cy.contains('Welcome Back!').should('be.visible');
    cy.contains('Sign in to continue to Participium').should('be.visible');

    // Username e password
    cy.get('input[placeholder="Enter your username"]').should('be.visible');
    cy.get('input[placeholder="Enter your password"]').should('be.visible');

    // Pulsante Sign in
    cy.contains('Sign in').should('be.visible').and('have.css', 'background-color', 'rgba(0, 0, 0, 0)');

    // Link Create New Account
    cy.contains("Don't have an account?").should('be.visible');
    cy.contains('Create New Account').should('be.visible');
  });

});

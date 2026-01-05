describe('Public Map View', () => {
  beforeEach(() => {
    // Unauthenticated session by default
    cy.intercept('GET', 'http://localhost:3001/api/sessions/current', {
      statusCode: 401,
      body: { error: 'Unauthorized' }
    }).as('currentSession');

    // Stub approved reports
    cy.intercept('GET', 'http://localhost:3001/api/reports/approved*', {
      statusCode: 200,
      body: [
        {
          id: 101,
          title: 'Streetlight broken',
          description: 'Lamp post not working',
          category: 'Public Lighting',
          status: 'accepted',
          latitude: 45.0701,
          longitude: 7.6869,
          created_at: new Date().toISOString(),
          photoUrls: ['http://localhost:3001/static/uploads/photo1.jpg'],
          user: { username: 'mario' }
        },
        {
          id: 102,
          title: 'Pothole on road',
          description: 'Dangerous hole',
          category: 'Roads and Urban Furnishings',
          status: 'accepted',
          latitude: 45.0715,
          longitude: 7.6842,
          created_at: new Date().toISOString(),
          photoUrls: [],
          user: { username: 'luigi' }
        }
      ]
    }).as('approvedReports');
  });

  it('Navigates to map and lists reports', () => {
    cy.visit('/');
    cy.contains('View Map').should('be.visible').click();

    cy.url().should('include', '/map');
    cy.wait('@approvedReports');

    // Ensure map card and list are visible
    cy.contains('Reports Map View').should('be.visible');
    cy.contains('Reports').should('be.visible');

    // List should show stubbed items
    cy.contains('Streetlight broken').should('be.visible');
    cy.contains('Pothole on road').should('be.visible');

    // Open detail modal from list
    cy.contains('Streetlight broken').click();
    cy.contains('Report Details').should('be.visible');
    cy.contains('Streetlight broken').should('be.visible');

    // Close modal
    cy.get('.modal').within(() => {
      cy.contains('Close').click();
    });
    cy.contains('Report Details').should('not.exist');
  });
});

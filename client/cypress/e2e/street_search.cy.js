describe('Street Search and Suggestions', () => {
  beforeEach(() => {
    // Unauthenticated session by default
    cy.intercept('GET', 'http://localhost:3001/api/sessions/current', {
      statusCode: 401,
      body: { error: 'Unauthorized' }
    }).as('currentSession');

    // Initial approved reports empty to force interaction
    cy.intercept('GET', 'http://localhost:3001/api/reports/approved*', {
      statusCode: 200,
      body: []
    }).as('approvedReports');

    cy.visit('/map');
    cy.wait('@approvedReports');
  });

  it('Shows street suggestions and filters by street', () => {
    // Suggestions for query
    cy.intercept('GET', 'http://localhost:3001/api/streets?q=Via%20Ro', {
      statusCode: 200,
      body: [
        { id: 1, city: 'Torino', street_name: 'Via Roma' },
        { id: 2, city: 'Torino', street_name: 'Via Rossini' }
      ]
    }).as('streetSuggest');

    // Reports for selected street
    cy.intercept('GET', 'http://localhost:3001/api/streets/Via%20Roma/reports', {
      statusCode: 200,
      body: {
        mapFocus: {
          center: { lat: 45.0703, lon: 7.6869 },
          boundingBox: { north: 45.08, south: 45.06, east: 7.70, west: 7.66 }
        },
        street: { geometry: { type: 'Polygon', coordinates: [] } },
        reports: [
          {
            id: 201,
            title: 'Bin full',
            description: 'Waste bin overflowing',
            category: 'Waste',
            status: 'accepted',
            latitude: 45.0707,
            longitude: 7.6861,
            created_at: new Date().toISOString(),
            photoUrls: []
          }
        ],
        stats: { total: 1 }
      }
    }).as('streetReports');

    // Type query to trigger suggestions
    cy.contains('Search by Street').should('be.visible');
    cy.get('input[placeholder="e.g., Via Roma, Corso Vittorio..."]').as('streetInput');

    cy.get('@streetInput').type('Via Ro');
    cy.wait('@streetSuggest');

    // Click on suggestion
    cy.contains('Via Roma').click();
    cy.wait('@streetReports');

    // Badge should indicate selected area
    cy.contains('Area: Via Roma').should('be.visible');

    // Report list is filtered
    cy.contains('Bin full').should('be.visible');
  });
});

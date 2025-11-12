"use strict";

const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Participium API',
      version: '1.0.0',
      description: 'API documentation for Participium backend',
    },
    servers: [
      { url: 'http://localhost:3001/api', description: 'Local dev server' },
    ],
    // 👇 opzionale: rendi l’autenticazione via cookie predefinita per tutte le rotte
    // commenta questa se vuoi gestire la security per-rotta
    security: [{ cookieAuth: [] }],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid', // nome di default di express-session
          description: 'Session cookie set by the server after login.',
        },
        // Se in futuro userai JWT:
        // bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      },
      schemas: {
        Report: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 42 },
            userId: { type: 'integer', example: 7 },
            latitude: { type: 'number', example: 45.062394 },
            longitude: { type: 'number', example: 7.662697 },
            title: { type: 'string', example: 'Pothole in via Garibaldi' },
            description: { type: 'string', example: 'Large pothole causing danger for cyclists' },
            category: { type: 'string', example: 'Roads and Urban Furnishings' },
            status: { type: 'string', example: 'OPEN' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            photos: {
              type: 'array',
              items: { type: 'string', example: '/static/uploads/photos-1731345678-123.png' },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Validation error' },
          },
        },
      },
    },
  },
  apis: ['./routes/*.js'], // legge i blocchi @swagger nelle routes
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec,
  // suggerimento: esporta anche le opzioni UI per usare persistAuthorization in index.js
  swaggerUiOptions: {
    swaggerOptions: {
      persistAuthorization: true, // non perdere il cookie/token quando fai "Try it out"
    },
  },
};

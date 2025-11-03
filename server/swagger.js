"use strict";

const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Config Swagger
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Participium API',
      version: '1.0.0',
      description: 'API documentation for Participium backend (login & sessions)',
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Local dev server',
      },
    ],
  },
  apis: ['./routes/*.js'], // prenderà i commenti @swagger nei file routes
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec
};

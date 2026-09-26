const swaggerJSDoc = require('swagger-jsdoc');
const appConfig = require('./app.config');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Enterprise SaaS E-Commerce REST API Documentation',
    version: '1.0.0',
    description: 'Interactive API Documentation for SaaS E-Commerce Express Backend with JWT Authentication',
    contact: {
      name: 'API Support',
      email: 'support@saas-ecommerce.com'
    }
  },
  servers: [
    {
      url: `http://localhost:${appConfig.port}`,
      description: 'Local Development Server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token in the format: Bearer <TOKEN>'
      }
    }
  }
};

const options = {
  swaggerDefinition,
  apis: ['./app/routes/*.js'] // Path to API route files containing Swagger annotations
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;

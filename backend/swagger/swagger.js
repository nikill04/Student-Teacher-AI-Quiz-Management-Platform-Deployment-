// swagger/swagger.js
// Builds the API documentation page at /api-docs from the @swagger comments in routes/*.js
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'QuizAI API',
      version: '1.0.0',
      description: 'API for the QuizAI platform. Call POST /auth/login first; the login cookie is then sent automatically.',
    },
    // Relative URL: works on localhost and on the deployed server
    servers: [{ url: '/api' }],
  },
  apis: [path.join(__dirname, '../routes/*.js')],
});

export { swaggerUi, swaggerSpec };

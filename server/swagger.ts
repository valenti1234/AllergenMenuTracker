import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AllergenMenuTracker API Documentation',
      version: '1.0.0',
      description: 'API documentation for the AllergenMenuTracker application',
      contact: {
        name: 'API Support',
        email: 'support@allergenmenutracker.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'API Server'
      }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid'
        }
      }
    },
    security: [
      {
        cookieAuth: []
      }
    ],
    tags: [
      {
        name: 'Recipe Mappings',
        description: 'Operazioni sulle mappature delle ricette'
      },
      {
        name: 'Menu',
        description: 'Operazioni sul menu'
      },
      {
        name: 'Orders',
        description: 'Gestione degli ordini'
      },
      {
        name: 'Inventory',
        description: 'Gestione dell\'inventario'
      },
      {
        name: 'Admin',
        description: 'Operazioni amministrative'
      }
    ]
  },
  apis: [
    path.join(__dirname, 'routes-docs.ts'),
    path.join(__dirname, 'routes', '*.ts')
  ]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export { swaggerUi, swaggerSpec }; 
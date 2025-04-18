import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { connectToDatabase } from "./db";
import { setupAuth } from "./auth";
// Import Swagger configuration
import { swaggerUi, swaggerSpec } from './swagger';
// Import metrics cache service
import { startMetricsCacheService, stopMetricsCacheService } from './services/metricsCache';
// Import initialize default settings
import { initializeDefaultSettings } from './storage';

// Configurazione del server
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5050;
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up authentication
setupAuth(app);

// Set up Swagger API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AllergenMenuTracker API Documentation'
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    await connectToDatabase();
    
    // Create server
    const server = app.listen({
      port: PORT,
      host: HOST,
    });

    // Register API routes before Vite
    await registerRoutes(app);

    // Error handling middleware for API routes
    app.use('/api', (err: any, req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api')) {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        log(`Error: ${message}`);
        res.status(status).json({ message });
      } else {
        next(err);
      }
    });

    // Set up Vite or static serving for non-API routes
    if (app.get("env") === "development") {
      app.use((req, res, next) => {
        if (!req.path.startsWith('/api')) {
          next();
        }
      });
      await setupVite(app, server);
    } else {
      app.use((req, res, next) => {
        if (!req.path.startsWith('/api')) {
          next();
        }
      });
      serveStatic(app);
    }

    // Initialize default settings if none exist
    await initializeDefaultSettings();
    
    // Start the metrics cache service
    startMetricsCacheService();
    log("Started metrics cache service with improved popular items calculation");

    log(`Server running on ${HOST}:${PORT}`);
    log(`API Documentation available at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api-docs`);

    // Handle graceful shutdown
    const shutdown = () => {
      log('Shutting down server...');
      // Stop the metrics cache service
      stopMetricsCacheService();
      server.close(() => {
        log('Server closed. Exiting process.');
        process.exit(0);
      });
      
      // Force exit if server doesn't close in 5 seconds
      setTimeout(() => {
        log('Forcing server shutdown after timeout');
        process.exit(1);
      }, 5000);
    };

    // Listen for termination signals
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    log('Failed to start server: ' + (error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
})();
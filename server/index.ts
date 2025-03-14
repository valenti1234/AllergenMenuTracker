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
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`Error: ${message}`);
      res.status(status).json({ message });
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Initialize default settings if none exist
    await initializeDefaultSettings();
    
    // Start the metrics cache service
    startMetricsCacheService();
    log("Started metrics cache service with improved popular items calculation");

    const port = 5050;
    server.listen({
      port,
      host: "0.0.0.0",
    });
    log(`Server running on port ${port}`);
    log(`API Documentation available at http://localhost:${port}/api-docs`);

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
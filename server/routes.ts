import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertMenuItemSchema, insertUserSchema, insertOrderSchema, orderStatuses } from "@shared/schema";
import { requireAuth, requireRole } from "./auth";
import { generateMenuItem, analyzeDietaryInfo, suggestDietaryModifications, analyzeKitchenWorkflow } from "./services/openai";
import path from "path";
import express from "express";
import mongoose from 'mongoose';
// Import metrics cache service
import { 
  getCachedOverviewMetrics, 
  getCachedOrderMetrics, 
  getCachedRevenueMetrics, 
  getCachedDietaryMetrics,
  startMetricsCacheService
} from "./services/metricsCache";

export async function registerRoutes(app: Express) {
  // Serve uploaded files statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Public routes
  app.get("/api/menu", async (_req, res) => {
    const items = await storage.getMenuItems();
    res.json(items);
  });

  app.get("/api/menu/:id", async (req, res) => {
    const item = await storage.getMenuItem(req.params.id);
    if (!item) {
      res.status(404).json({ message: "Menu item not found" });
      return;
    }
    res.json(item);
  });

  // Order tracking endpoint - public access
  app.get("/api/orders/track/:phoneNumber", async (req, res) => {
    try {
      const phoneNumber = req.params.phoneNumber;
      // Get recent orders (last 24 hours) for this phone number
      const orders = await storage.getOrdersByPhoneNumber(phoneNumber);
      res.json(orders);
    } catch (error) {
      console.error('Track orders error:', error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Orders - accessible by kitchen staff and admin/manager
  app.get("/api/orders", requireAuth, async (_req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/status/:status", requireAuth, async (req, res) => {
    if (!orderStatuses.includes(req.params.status as any)) {
      res.status(400).json({ message: "Invalid order status" });
      return;
    }
    try {
      const orders = await storage.getOrdersByStatus(req.params.status as any);
      res.json(orders);
    } catch (error) {
      console.error('Get orders by status error:', error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Order status updates - accessible by kitchen staff and admin/manager
  app.patch("/api/orders/:id", requireAuth, async (req, res) => {
    if (!req.body.status || !orderStatuses.includes(req.body.status)) {
      res.status(400).json({ message: "Invalid order status" });
      return;
    }
    try {
      const order = await storage.updateOrder(req.params.id, { status: req.body.status });
      res.json(order);
    } catch (error) {
      console.error('Update order error:', error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Add this route after the existing order routes
  app.post("/api/orders", async (req, res) => {
    try {
      const result = insertOrderSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ message: "Invalid order data", errors: result.error });
        return;
      }

      const order = await storage.createOrder(result.data);
      res.status(201).json(order);
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create order" 
      });
    }
  });

  // Admin/Manager only routes - Protected from kitchen staff
  app.post("/api/menu", requireRole(["admin", "manager"]), async (req, res) => {
    const result = insertMenuItemSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: "Invalid menu item", errors: result.error });
      return;
    }
    const item = await storage.createMenuItem(result.data);
    res.status(201).json(item);
  });

  app.patch("/api/menu/:id", requireRole(["admin", "manager"]), async (req, res) => {
    const result = insertMenuItemSchema.partial().safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: "Invalid menu item", errors: result.error });
      return;
    }
    try {
      const item = await storage.updateMenuItem(req.params.id, result.data);
      res.json(item);
    } catch (error) {
      res.status(404).json({ message: "Menu item not found" });
    }
  });

  app.delete("/api/menu/:id", requireRole(["admin", "manager"]), async (req, res) => {
    try {
      await storage.deleteMenuItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(404).json({ message: "Menu item not found" });
    }
  });

  app.post("/api/menu/generate", requireRole(["admin", "manager"]), async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ message: "Name is required" });
        return;
      }

      const menuItem = await generateMenuItem(name);
      if (!menuItem.description || !menuItem.price || !menuItem.category) {
        throw new Error('Generated menu item is missing required fields');
      }

      res.json(menuItem);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Menu generation error:', error);
        res.status(500).json({ message: "Failed to generate menu item", error: error.message });
      }
    }
  });

  app.post("/api/menu/analyze-dietary", requireRole(["admin", "manager"]), async (req, res) => {
    try {
      const { name, ingredients, description } = req.body;

      if (!name || !ingredients?.length || !description) {
        res.status(400).json({ message: "Name, ingredients, and description are required" });
        return;
      }

      const dietaryCategories = await analyzeDietaryInfo(name, ingredients, description);
      res.json({ dietaryCategories });
    } catch (error) {
      if (error instanceof Error) {
        console.error('Dietary analysis error:', error);
        res.status(500).json({ message: "Failed to analyze dietary information", error: error.message });
      }
    }
  });

  app.post("/api/menu/dietary-modifications", async (req, res) => {
    try {
      const { menuItemId, dietaryPreferences } = req.body;

      if (!menuItemId || !dietaryPreferences?.length) {
        res.status(400).json({ message: "Menu item ID and dietary preferences are required" });
        return;
      }

      const menuItem = await storage.getMenuItem(menuItemId);
      if (!menuItem) {
        res.status(404).json({ message: "Menu item not found" });
        return;
      }

      const modifications = await suggestDietaryModifications(menuItem, dietaryPreferences);
      res.json(modifications);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Dietary modifications error:', error);
        res.status(500).json({ message: "Failed to generate dietary modifications", error: error.message });
      }
    }
  });

  // User management - Admin only
  app.get("/api/users", requireRole(["admin"]), async (_req, res) => {
    const users = await storage.getUsers();
    const sanitizedUsers = users.map(user => {
      const { password, ...rest } = user;
      return rest;
    });
    res.json(sanitizedUsers);
  });

  app.get("/api/users/:id", requireRole(["admin"]), async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const { password, ...sanitizedUser } = user;
    res.json(sanitizedUser);
  });

  app.post("/api/users", requireRole(["admin"]), async (req, res) => {
    const result = insertUserSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: "Invalid user data", errors: result.error });
      return;
    }
    try {
      const user = await storage.createUser(result.data);
      const { password, ...sanitizedUser } = user;
      res.status(201).json(sanitizedUser);
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key')) {
        res.status(400).json({ message: "Username or email already exists" });
        return;
      }
      throw error;
    }
  });

  app.patch("/api/users/:id", requireRole(["admin"]), async (req, res) => {
    const result = insertUserSchema.partial().safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: "Invalid user data", errors: result.error });
      return;
    }
    try {
      const user = await storage.updateUser(req.params.id, result.data);
      const { password, ...sanitizedUser } = user;
      res.json(sanitizedUser);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      throw error;
    }
  });

  app.delete("/api/users/:id", requireRole(["admin"]), async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(404).json({ message: "User not found" });
    }
  });

  // Database Management - Admin only
  app.get("/api/admin/database/collections", requireRole(["admin"]), async (_req, res) => {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error("Database connection not established");
      }

      const collections = await db.listCollections().toArray();
      const collectionStats = await Promise.all(
        collections.map(async (collection) => {
          // Use collStats command instead of stats() method
          const stats = await db.command({ collStats: collection.name });
          return {
            name: collection.name,
            count: stats.count,
            size: stats.size,
            avgObjSize: stats.avgObjSize,
            lastModified: new Date(),
          };
        })
      );

      res.json(collectionStats);
    } catch (error) {
      console.error('Database collections error:', error);
      res.status(500).json({ message: "Failed to fetch database collections" });
    }
  });

  app.get("/api/admin/database/collections/:name", requireRole(["admin"]), async (req, res) => {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error("Database connection not established");
      }

      const collection = db.collection(req.params.name);
      const documents = await collection.find({}).limit(100).toArray();

      res.json(documents);
    } catch (error) {
      console.error('Collection documents error:', error);
      res.status(500).json({ message: "Failed to fetch collection documents" });
    }
  });

  // Add the delete collection endpoint after the existing database management routes
  app.delete("/api/admin/database/collections/:name", requireRole(["admin"]), async (req, res) => {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error("Database connection not established");
      }

      await db.dropCollection(req.params.name);
      res.status(204).send();
    } catch (error) {
      console.error('Drop collection error:', error);
      if (error instanceof Error && error.message.includes('ns not found')) {
        res.status(404).json({ message: "Collection not found" });
      } else {
        res.status(500).json({ message: "Failed to drop collection" });
      }
    }
  });

  // Add this after the other admin routes
  app.post("/api/admin/kds/workflow", requireAuth, async (req, res) => {
    try {
      const activeOrders = await storage.getOrdersByStatus(["pending", "preparing"]);
      const { kitchenStaff } = req.body;

      const workflowAnalysis = await analyzeKitchenWorkflow(activeOrders, kitchenStaff);
      res.json(workflowAnalysis);
    } catch (error) {
      console.error('Workflow analysis error:', error);
      res.status(500).json({ message: "Failed to analyze kitchen workflow" });
    }
  });

  // Dashboard metrics endpoints
  app.get("/api/admin/metrics/overview", requireAuth, async (_req, res) => {
    try {
      // Use cached metrics instead of calculating on each request
      const overviewMetrics = getCachedOverviewMetrics();
      res.json(overviewMetrics);
    } catch (error) {
      console.error('Dashboard metrics error:', error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Order metrics by time period
  app.get("/api/admin/metrics/orders", requireAuth, async (_req, res) => {
    try {
      // Use cached metrics instead of calculating on each request
      const orderMetrics = getCachedOrderMetrics();
      res.json(orderMetrics);
    } catch (error) {
      console.error('Order metrics error:', error);
      res.status(500).json({ message: "Failed to fetch order metrics" });
    }
  });

  // Revenue metrics by time period
  app.get("/api/admin/metrics/revenue", requireAuth, async (_req, res) => {
    try {
      // Use cached metrics instead of calculating on each request
      const revenueMetrics = getCachedRevenueMetrics();
      res.json(revenueMetrics);
    } catch (error) {
      console.error('Revenue metrics error:', error);
      res.status(500).json({ message: "Failed to fetch revenue metrics" });
    }
  });

  // Dietary preferences distribution
  app.get("/api/admin/metrics/dietary", requireAuth, async (_req, res) => {
    try {
      // Use cached metrics instead of calculating on each request
      const dietaryMetrics = getCachedDietaryMetrics();
      res.json(dietaryMetrics.data);
    } catch (error) {
      console.error('Dietary metrics error:', error);
      res.status(500).json({ message: "Failed to fetch dietary metrics" });
    }
  });

  // Add a new endpoint to manually trigger metrics update (admin only)
  app.post("/api/admin/metrics/refresh", requireRole(["admin"]), async (_req, res) => {
    try {
      // Import the updateAllMetrics function dynamically to avoid circular dependencies
      const { updateAllMetrics } = await import("./services/metricsCache");
      await updateAllMetrics();
      res.json({ message: "Metrics cache refreshed successfully" });
    } catch (error) {
      console.error('Metrics refresh error:', error);
      res.status(500).json({ message: "Failed to refresh metrics cache" });
    }
  });

  // TEMPORARY: Add a test endpoint to get metrics without authentication (for development only)
  if (process.env.NODE_ENV === 'development') {
    app.get("/api/test/metrics", async (_req, res) => {
      try {
        const overviewMetrics = getCachedOverviewMetrics();
        res.json(overviewMetrics);
      } catch (error) {
        console.error('Test metrics error:', error);
        res.status(500).json({ message: "Failed to fetch test metrics" });
      }
    });
    
    app.post("/api/test/metrics/refresh", async (_req, res) => {
      try {
        const { updateAllMetrics } = await import("./services/metricsCache");
        await updateAllMetrics();
        res.json({ message: "Test metrics refreshed successfully" });
      } catch (error) {
        console.error('Test metrics refresh error:', error);
        res.status(500).json({ message: "Failed to refresh test metrics" });
      }
    });
  }

  return createServer(app);
}
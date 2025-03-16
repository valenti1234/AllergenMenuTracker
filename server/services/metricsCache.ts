import { storage } from "../storage";
import { log } from "../vite";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Type for cached metrics
interface CachedMetrics {
  overview: {
    counts: {
      menuItems: number;
      activeOrders: number;
      completedOrders: number;
      users: number;
    };
    revenue: {
      today: number;
      week: number;
      month: number;
    };
    popularItems: Array<{id: string, name: any, count: number}>;
    orderStatusDistribution: Array<{status: string, count: number}>;
  };
  orders: {
    daily: Array<{date: string, count: number}>;
    hourly: Array<{hour: string, count: number}>;
  };
  revenue: {
    daily: Array<{date: string, revenue: number}>;
    monthly: Array<{month: string, revenue: number}>;
  };
  dietary: Array<{preference: string, count: number}>;
  lastUpdated: {
    overview: Date;
    orders: Date;
    revenue: Date;
    dietary: Date;
  };
}

// Initialize empty cache
const metricsCache: CachedMetrics = {
  overview: {
    counts: {
      menuItems: 0,
      activeOrders: 0,
      completedOrders: 0,
      users: 0
    },
    revenue: {
      today: 0,
      week: 0,
      month: 0
    },
    popularItems: [],
    orderStatusDistribution: []
  },
  orders: {
    daily: [],
    hourly: []
  },
  revenue: {
    daily: [],
    monthly: []
  },
  dietary: [],
  lastUpdated: {
    overview: new Date(0),
    orders: new Date(0),
    revenue: new Date(0),
    dietary: new Date(0)
  }
};

// Function to update all metrics
async function updateAllMetrics() {
  try {
    log("Updating metrics cache...");
    const startTime = Date.now();

    // Update overview metrics
    const [
      menuItemCount,
      activeOrderCount,
      completedOrderCount,
      userCount,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      popularItems,
      orderStatusDistribution
    ] = await Promise.all([
      storage.getMenuItemCount(),
      storage.getActiveOrderCount(),
      storage.getCompletedOrderCount(),
      storage.getUserCount(),
      storage.getTodayRevenue(),
      storage.getWeekRevenue(),
      storage.getMonthRevenue(),
      storage.getPopularMenuItems(5),
      storage.getOrderStatusDistribution()
    ]);

    metricsCache.overview = {
      counts: {
        menuItems: menuItemCount,
        activeOrders: activeOrderCount,
        completedOrders: completedOrderCount,
        users: userCount
      },
      revenue: {
        today: todayRevenue,
        week: weekRevenue,
        month: monthRevenue
      },
      popularItems,
      orderStatusDistribution
    };
    metricsCache.lastUpdated.overview = new Date();

    // Update order metrics
    const [dailyOrders, hourlyOrders] = await Promise.all([
      storage.getDailyOrderCounts(7),
      storage.getHourlyOrderCounts(24)
    ]);

    metricsCache.orders = {
      daily: dailyOrders,
      hourly: hourlyOrders
    };
    metricsCache.lastUpdated.orders = new Date();

    // Update revenue metrics
    const [dailyRevenue, monthlyRevenue] = await Promise.all([
      storage.getDailyRevenue(7),
      storage.getMonthlyRevenue(6)
    ]);

    metricsCache.revenue = {
      daily: dailyRevenue,
      monthly: monthlyRevenue
    };
    metricsCache.lastUpdated.revenue = new Date();

    // Update dietary metrics
    const dietaryDistribution = await storage.getDietaryDistribution();
    metricsCache.dietary = dietaryDistribution;
    metricsCache.lastUpdated.dietary = new Date();

    const duration = Date.now() - startTime;
    log(`Metrics cache updated in ${duration}ms`);
  } catch (error) {
    log(`Error updating metrics cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Initialize metrics cache
async function initializeMetricsCache() {
  await updateAllMetrics();
}

// Start periodic update (every 2 minutes)
let updateInterval: NodeJS.Timeout | null = null;

function startMetricsCacheService() {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  
  // Initial update
  initializeMetricsCache();
  
  // Get interval from environment variable or use default (60 minutes in milliseconds)
  const updateIntervalMs = process.env.METRICS_UPDATE_INTERVAL ? 
    parseInt(process.env.METRICS_UPDATE_INTERVAL) : 60000 * 60;
  
  // Set up interval using the environment variable
  updateInterval = setInterval(updateAllMetrics, updateIntervalMs);
  log(`Metrics cache service started (${updateIntervalMs/1000} seconds interval)`);
}

function stopMetricsCacheService() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
    log("Metrics cache service stopped");
  }
}

// Getters for cached metrics
function getCachedOverviewMetrics() {
  return {
    ...metricsCache.overview,
    lastUpdated: metricsCache.lastUpdated.overview
  };
}

function getCachedOrderMetrics() {
  return {
    ...metricsCache.orders,
    lastUpdated: metricsCache.lastUpdated.orders
  };
}

function getCachedRevenueMetrics() {
  return {
    ...metricsCache.revenue,
    lastUpdated: metricsCache.lastUpdated.revenue
  };
}

function getCachedDietaryMetrics() {
  return {
    data: metricsCache.dietary,
    lastUpdated: metricsCache.lastUpdated.dietary
  };
}

export {
  startMetricsCacheService,
  stopMetricsCacheService,
  getCachedOverviewMetrics,
  getCachedOrderMetrics,
  getCachedRevenueMetrics,
  getCachedDietaryMetrics,
  updateAllMetrics
}; 
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { format, formatDistanceToNow } from "date-fns";
import { it, es } from "date-fns/locale";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingBag, 
  Clock, 
  CheckCircle,
  DollarSign,
  Calendar,
  PieChart as PieChartIcon,
  RefreshCw
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { orderStatuses } from "@shared/schema";
import { Button } from "@/components/ui/button";

// Colors for charts
const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", 
  "#82CA9D", "#FF6B6B", "#6B66FF", "#FFD166", "#06D6A0"
];

// Helper function to get localized text
const getLocalizedText = (text: any, language: string) => {
  if (!text) return "";
  
  // Handle simple string values
  if (typeof text === "string") {
    return text;
  }
  
  // Handle objects with direct language keys (e.g., {en: "Fish & Chips", it: "Pesce e Patatine"})
  if (typeof text === "object" && text !== null) {
    // If it has direct language keys
    if (text[language]) {
      return text[language];
    } else if (text.en) {
      return text.en; // Fallback to English
    }
  }
  
  // If all else fails, convert to string but avoid showing the whole object
  return typeof text === 'object' ? JSON.stringify(text).substring(0, 30) : String(text);
};

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const queryClient = useQueryClient();
  
  // Helper function to format currency
  const formatCurrency = (value: number) => {
    // Convert from cents to dollars
    const dollars = value / 100;
    
    const language = i18n.language;
    const currencyCode = 'USD'; // You can change this based on your requirements
    
    return new Intl.NumberFormat(
      language === 'it' ? 'it-IT' : 
      language === 'es' ? 'es-ES' : 
      'en-US', 
      {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2
      }
    ).format(dollars);
  };

  // Helper function to format the last updated time
  const formatLastUpdated = (lastUpdated: string | Date) => {
    if (!lastUpdated) return "";
    
    const date = typeof lastUpdated === 'string' ? new Date(lastUpdated) : lastUpdated;
    
    // Get the appropriate locale
    const locale = 
      currentLanguage === 'it' ? it :
      currentLanguage === 'es' ? es :
      undefined;
    
    return formatDistanceToNow(date, { 
      addSuffix: true,
      locale
    });
  };
  
  // Fetch overview metrics
  const { data: overviewData, isLoading: isLoadingOverview } = useQuery({
    queryKey: ["/api/admin/metrics/overview"],
    queryFn: () => apiRequest("GET", "/api/admin/metrics/overview"),
  });
  
  // Fetch order metrics
  const { data: orderMetrics, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["/api/admin/metrics/orders"],
    queryFn: () => apiRequest("GET", "/api/admin/metrics/orders"),
  });
  
  // Fetch revenue metrics
  const { data: revenueMetrics, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ["/api/admin/metrics/revenue"],
    queryFn: () => apiRequest("GET", "/api/admin/metrics/revenue"),
  });
  
  // Fetch dietary distribution
  const { data: dietaryResponse, isLoading: isLoadingDietary } = useQuery({
    queryKey: ["/api/admin/metrics/dietary"],
    queryFn: () => apiRequest("GET", "/api/admin/metrics/dietary"),
  });

  // Extract the actual dietary data from the response
  const dietaryData = Array.isArray(dietaryResponse) ? dietaryResponse : [];
  
  // Format order status distribution data for the pie chart
  const orderStatusData = overviewData?.orderStatusDistribution?.map((item: any) => ({
    name: t(`orders.status.${item.status}`, item.status),
    value: item.count
  })) || [];
  
  // Format popular items data
  const popularItemsData = overviewData?.popularItems?.map((item: any) => {
    // Extract name from the item, handling both simple strings and multilingual objects
    let displayName = "";
    
    try {
      // If item.name is a string that looks like an object
      if (typeof item.name === 'string' && (item.name.startsWith('{') || item.name.includes(':'))) {
        try {
          // Try to parse it as JSON
          const parsed = JSON.parse(item.name);
          displayName = parsed[currentLanguage] || parsed.en || Object.values(parsed)[0];
        } catch {
          // If it's a string with language notation like "en: 'Fish & Chips', it: 'Pesce e Patate'"
          const langMatch = new RegExp(`${currentLanguage}:\\s*['"]([^'"]+)['"]`).exec(item.name);
          const enMatch = /en:\s*['"]([^'"]+)['"]/.exec(item.name);
          
          if (langMatch && langMatch[1]) {
            displayName = langMatch[1];
          } else if (enMatch && enMatch[1]) {
            displayName = enMatch[1];
          } else {
            displayName = item.name;
          }
        }
      } 
      // If it's a direct object with language keys
      else if (typeof item.name === 'object' && item.name !== null) {
        displayName = item.name[currentLanguage] || item.name.en || Object.values(item.name)[0] || "";
      }
      // Simple string or other type
      else {
        displayName = String(item.name || "");
      }
    } catch (error) {
      console.error("Error parsing item name", error);
      displayName = String(item.name || "").substring(0, 30);
    }
    
    return {
      name: displayName,
      count: item.count
    };
  }) || [];
  
  // Add a helper function to ensure all chart labels are properly localized
  const ensureLocalizedLabels = (data: any[], nameKey: string) => {
    if (!data) return [];
    
    return data.map(item => ({
      ...item,
      [nameKey]: getLocalizedText(item[nameKey], currentLanguage)
    }));
  };

  // Use the helper function for dietary data
  const localizedDietaryData = dietaryData ? ensureLocalizedLabels(dietaryData, 'preference') : [];

  // Function to manually refresh metrics
  const refreshMetrics = async () => {
    try {
      await apiRequest("POST", "/api/admin/metrics/refresh");
      // Refetch all metrics
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/admin/metrics/overview"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/admin/metrics/orders"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/admin/metrics/revenue"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/admin/metrics/dietary"] })
      ]);
    } catch (error) {
      console.error("Failed to refresh metrics:", error);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">{t("admin.dashboard.title", "Dashboard")}</h1>
          
          {/* Last updated info and refresh button */}
          <div className="flex items-center space-x-4">
            {overviewData?.lastUpdated && (
              <p className="text-sm text-muted-foreground">
                {t("admin.dashboard.lastUpdated", "Last updated")}: {formatLastUpdated(overviewData.lastUpdated)}
              </p>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshMetrics}
              className="flex items-center space-x-1"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              {t("admin.dashboard.refresh", "Refresh")}
            </Button>
          </div>
        </div>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Menu Items Card */}
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("admin.dashboard.menuItems", "Menu Items")}
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingOverview ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <div className="text-2xl font-bold">
                  {overviewData?.counts?.menuItems || 0}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Active Orders Card */}
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("admin.dashboard.activeOrders", "Active Orders")}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingOverview ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <div className="text-2xl font-bold">
                  {overviewData?.counts?.activeOrders || 0}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Completed Orders Card */}
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("admin.dashboard.completedOrders", "Completed Orders")}
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingOverview ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <div className="text-2xl font-bold">
                  {overviewData?.counts?.completedOrders || 0}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Users Card */}
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("admin.dashboard.users", "Users")}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingOverview ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <div className="text-2xl font-bold">
                  {overviewData?.counts?.users || 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Revenue Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Today Revenue */}
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("admin.dashboard.todayRevenue", "Today's Revenue")}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingOverview ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <div className="text-2xl font-bold">
                  {formatCurrency(overviewData?.revenue?.today || 0)}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Weekly Revenue */}
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("admin.dashboard.weekRevenue", "Weekly Revenue")}
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingOverview ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <div className="text-2xl font-bold">
                  {formatCurrency(overviewData?.revenue?.week || 0)}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Monthly Revenue */}
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("admin.dashboard.monthRevenue", "Monthly Revenue")}
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingOverview ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <div className="text-2xl font-bold">
                  {formatCurrency(overviewData?.revenue?.month || 0)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Order Status Distribution */}
          <Card className="col-span-1 bg-card hover:bg-card/90 transition-colors">
            <CardHeader>
              <CardTitle>{t("admin.dashboard.orderStatusDistribution", "Order Status Distribution")}</CardTitle>
              <CardDescription>
                {t("admin.dashboard.orderStatusDescription", "Distribution of orders by status")}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoadingOverview ? (
                <div className="h-full w-full flex items-center justify-center">
                  <Skeleton className="h-64 w-64 rounded-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      innerRadius={40}
                      paddingAngle={5}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {orderStatusData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, t("admin.dashboard.orders", "Orders")]} />
                    <Legend layout="vertical" verticalAlign="middle" align="right" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          {/* Popular Menu Items */}
          <Card className="col-span-1 bg-card hover:bg-card/90 transition-colors">
            <CardHeader>
              <CardTitle>{t("admin.dashboard.popularItems", "Popular Menu Items")}</CardTitle>
              <CardDescription>
                {t("admin.dashboard.popularItemsDescription", "Most ordered menu items")}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80 overflow-auto">
              {isLoadingOverview ? (
                <Skeleton className="h-full w-full" />
              ) : popularItemsData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <p>{t("admin.dashboard.noData", "No data available")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {popularItemsData.slice(0, 5).map((item: any, index: number) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <div className="flex items-center">
                            <span className="text-sm font-bold">{item.count}</span>
                            <span className="ml-1 text-xs text-muted-foreground">{t("admin.dashboard.orders", "orders")}</span>
                          </div>
                        </div>
                        <div className="w-full bg-muted h-2 rounded-full mt-1">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, (item.count / (popularItemsData[0]?.count || 1)) * 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Revenue and Orders Charts */}
        <Tabs defaultValue="revenue" className="mb-8">
          <TabsList className="mb-4 w-full md:w-auto">
            <TabsTrigger value="revenue" className="flex-1 md:flex-none">{t("admin.dashboard.revenueTab", "Revenue")}</TabsTrigger>
            <TabsTrigger value="orders" className="flex-1 md:flex-none">{t("admin.dashboard.ordersTab", "Orders")}</TabsTrigger>
            <TabsTrigger value="dietary" className="flex-1 md:flex-none">{t("admin.dashboard.dietaryTab", "Dietary Preferences")}</TabsTrigger>
          </TabsList>
          
          {/* Revenue Tab */}
          <TabsContent value="revenue">
            <Card className="bg-card hover:bg-card/90 transition-colors">
              <CardHeader>
                <CardTitle>{t("admin.dashboard.revenueOverTime", "Revenue Over Time")}</CardTitle>
                <CardDescription>
                  {t("admin.dashboard.revenueDescription", "Daily revenue for the past week")}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {isLoadingRevenue ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={revenueMetrics?.daily || []}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date: string) => {
                          try {
                            return format(new Date(date), 'MMM dd');
                          } catch (e) {
                            return String(date);
                          }
                        }} 
                      />
                      <YAxis tickFormatter={(value) => `$${value}`} />
                      <Tooltip 
                        formatter={(value: any) => {
                          return [formatCurrency(Number(value)), t("admin.dashboard.revenue", "Revenue")];
                        }} 
                        labelFormatter={(label: any) => {
                          try {
                            return format(new Date(String(label)), 'MMMM dd, yyyy');
                          } catch (e) {
                            return String(label);
                          }
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                        name={t("admin.dashboard.revenue", "Revenue")}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="bg-card hover:bg-card/90 transition-colors">
              <CardHeader>
                <CardTitle>{t("admin.dashboard.ordersOverTime", "Orders Over Time")}</CardTitle>
                <CardDescription>
                  {t("admin.dashboard.ordersDescription", "Daily order count for the past week")}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {isLoadingOrders ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={orderMetrics?.daily || []}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date: string) => {
                          try {
                            return format(new Date(date), 'MMM dd');
                          } catch (e) {
                            return String(date);
                          }
                        }} 
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any) => {
                          return [Number(value), t("admin.dashboard.orders", "Orders")];
                        }} 
                        labelFormatter={(label: any) => {
                          try {
                            return format(new Date(String(label)), 'MMMM dd, yyyy');
                          } catch (e) {
                            return String(label);
                          }
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#82ca9d"
                        activeDot={{ r: 8 }}
                        name={t("admin.dashboard.orderCount", "Order Count")}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Dietary Tab */}
          <TabsContent value="dietary">
            <Card className="bg-card hover:bg-card/90 transition-colors">
              <CardHeader>
                <CardTitle>{t("admin.dashboard.dietaryDistribution", "Dietary Preferences")}</CardTitle>
                <CardDescription>
                  {t("admin.dashboard.dietaryDescription", "Distribution of menu items by dietary preferences")}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {isLoadingDietary ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={localizedDietaryData || []}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="preference" 
                        tickFormatter={(preference: any) => {
                          const translated = t(`dietary.${String(preference)}`, String(preference));
                          return typeof translated === 'string' ? translated : String(preference);
                        }}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any) => {
                          return [Number(value), t("admin.dashboard.menuItems", "Menu Items")];
                        }} 
                        labelFormatter={(label: any) => {
                          const translated = t(`dietary.${String(label)}`, String(label));
                          return typeof translated === 'string' ? translated : String(label);
                        }} 
                      />
                      <Legend />
                      <Bar 
                        dataKey="count" 
                        fill="#82ca9d" 
                        name={t("admin.dashboard.menuItemCount", "Menu Item Count")} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// Placeholder for MenuItems page component.  This needs to be implemented separately.
// This component should contain the full functionality from the original AdminDashboard component.
const MenuItemsPage = () => {
    return <div>This page will display and manage menu items. (Implementation Pending)</div>
};

export {MenuItemsPage};
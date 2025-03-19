import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Order, OrderStatus } from "@shared/schema";
import { orderStatuses } from "@shared/schema";
import { Clock, AlertCircle, Phone, Brain, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface WorkflowAnalysis {
  suggestions: string[];
  priorityOrder: string[];
  estimatedTimes: Record<string, number>;
}

export default function KDS() {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [draggedOrder, setDraggedOrder] = useState<string | null>(null);
  const [kitchenStaff, setKitchenStaff] = useState<number>(2);

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: workflowAnalysis, isLoading: isLoadingAnalysis } = useQuery<WorkflowAnalysis>({
    queryKey: ["/api/admin/kds/workflow", kitchenStaff],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Helper function to extract the correct language from multilingual content
  const getLocalizedText = (textObj: any) => {
    if (!textObj) return "";
    
    // Handle simple string values
    if (typeof textObj === "string") {
      // Check if it's a string that looks like a complex object with language keys
      if (textObj.includes('en:') && textObj.includes('_id:')) {
        try {
          // Try to extract using regex pattern matching for the current language
          const langPattern = new RegExp(`${i18n.language}:\\s*['"]([^'"]+)['"]`);
          const enPattern = /en:\s*['"]([^'"]+)['"]/;
          
          const langMatch = langPattern.exec(textObj);
          if (langMatch && langMatch[1]) {
            return langMatch[1];
          }
          
          const enMatch = enPattern.exec(textObj);
          if (enMatch && enMatch[1]) {
            return enMatch[1];
          }
        } catch (e) {
          // If extraction fails, continue with other methods
        }
      }
      
      return textObj;
    }
    
    // Handle objects with direct language keys (e.g., {en: "Fish & Chips", it: "Pesce e Patatine"})
    if (typeof textObj === "object" && textObj !== null) {
      // Try current language first
      if (textObj[i18n.language]) {
        return textObj[i18n.language];
      } 
      // Fall back to English
      else if (textObj.en) {
        return textObj.en;
      }
      // If no matching language, try any other language
      else if (Object.keys(textObj).length > 0) {
        // Filter out non-language keys like _id
        const langKeys = Object.keys(textObj).filter(k => 
          k !== '_id' && k !== 'id' && typeof textObj[k] === 'string'
        );
        
        if (langKeys.length > 0) {
          return textObj[langKeys[0]];
        }
      }
    }
    
    // If all else fails, convert to string but avoid showing the whole object
    return typeof textObj === 'object' ? JSON.stringify(textObj).substring(0, 30) : String(textObj);
  };

  // Filter out completed and cancelled orders
  const activeOrders = orders?.filter(
    (order) => order.status !== "completed" && order.status !== "cancelled"
  );

  // Filter active statuses for display
  const activeStatuses = orderStatuses.filter(
    (status) => status !== "completed" && status !== "cancelled"
  );

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      apiRequest("PATCH", `/api/orders/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kds/workflow", kitchenStaff] });
      toast({
        title: t("common.success", "Success"),
        description: t("orders.status.changeSuccess", "Order status updated"),
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: t("common.error", "Error"),
        description: t("orders.status.changeError", "Failed to update order status"),
      });
    },
  });

  const handleDragStart = (orderId: string) => {
    setDraggedOrder(orderId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: OrderStatus) => {
    if (draggedOrder) {
      updateStatusMutation.mutate({ id: draggedOrder, status });
      setDraggedOrder(null);
    }
  };

  const getStatusColor = (status: OrderStatus | any) => {
    // Ensure status is a string
    const statusStr = typeof status === 'string' ? status : 
                      typeof status === 'object' && status !== null ? 
                      (Object.keys(status)[0] || 'pending') : 'pending';
    
    switch (statusStr) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500";
      case "preparing":
        return "bg-blue-500/10 text-blue-500";
      case "ready":
        return "bg-green-500/10 text-green-500";
      case "completed":
        return "bg-gray-500/10 text-gray-500";
      case "cancelled":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const ordersByStatus = activeOrders?.reduce((acc, order) => {
    // Ensure order status is a valid string
    const status = typeof order.status === 'string' && orderStatuses.includes(order.status as OrderStatus) 
      ? order.status as OrderStatus 
      : 'pending';
    
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(order);
    return acc;
  }, {} as Record<OrderStatus, Order[]>);

  if (isLoading) {
    return (
      <AdminLayout>
        <div>{t("common.loading", "Loading orders...")}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">{t("kitchen.title", "Kitchen Display System")}</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <Select
                value={kitchenStaff.toString()}
                onValueChange={(value) => setKitchenStaff(Number(value))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("kitchen.staffMembers", "Kitchen Staff")} />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {t("kitchen.staffMembersCount", "Staff Members")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* AI Workflow Suggestions */}
        {workflowAnalysis && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                {t("kitchen.workflowOptimizer", "Kitchen Workflow Optimizer")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">{t("kitchen.suggestions", "Suggestions")}</h3>
                  <ul className="space-y-2">
                    {workflowAnalysis.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        • {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{t("kitchen.priorityOrder", "Priority Order")}</h3>
                  <ol className="space-y-2">
                    {workflowAnalysis.priorityOrder.map((item, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        {index + 1}. {item}
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{t("kitchen.estimatedTimes", "Estimated Times")}</h3>
                  <div className="space-y-2">
                    {Object.entries(workflowAnalysis.estimatedTimes).map(([item, time]) => (
                      <div key={item} className="text-sm text-muted-foreground flex justify-between">
                        <span>{item}:</span>
                        <span>{time} {t("common.minutes", "mins")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {activeStatuses.map((status) => {
            // Verifica che ordersByStatus contenga questa chiave
            const ordersForStatus = ordersByStatus?.[status] || [];
            
            return (
              <div
                key={status}
                className="h-[calc(100vh-12rem)]"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(status)}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex justify-between items-center">
                      <span className="capitalize">{t(`kitchen.columns.${status}`, status)}</span>
                      <Badge variant="secondary">
                        {ordersForStatus.length || 0}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-16rem)]">
                      <div className="p-4 space-y-4">
                        {ordersForStatus.map((order) => (
                          <Card
                            key={order.id}
                            draggable
                            onDragStart={() => handleDragStart(order.id)}
                            className="cursor-move hover:shadow-md transition-shadow"
                          >
                            <CardHeader className="p-4 pb-2">
                              <CardTitle className="text-lg flex flex-col gap-2">
                                <div className="flex justify-between">
                                  <span>
                                    #{order.id.slice(-6)}{" "}
                                    <Badge variant="outline" className="ml-2">
                                      {t(`menu.orderType.${order.type === "dine-in" ? "dineIn" : "takeaway"}`, order.type)}
                                    </Badge>
                                  </span>
                                  <Badge className={getStatusColor(typeof order.status === 'string' ? order.status as OrderStatus : 'pending')}>
                                    {typeof order.status === 'string'
                                      ? t(`kitchen.columns.${order.status}`, order.status)
                                      : typeof order.status === 'object'
                                        ? t(`kitchen.columns.${Object.keys(order.status)[0] || 'pending'}`, "Unknown")
                                        : "Unknown"}
                                  </Badge>
                                </div>
                                <div className="flex items-center text-base font-normal text-muted-foreground">
                                  <Phone className="h-4 w-4 mr-2" />
                                  {order.phoneNumber}
                                </div>
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {order.type === "dine-in"
                                  ? `${t("kitchen.orderInfo.table", "Table")} ${order.tableNumber}`
                                  : `${t("menu.orderType.takeaway", "Takeaway")} - ${order.customerName}`}
                              </p>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <div className="space-y-2">
                                {order.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex justify-between items-start"
                                  >
                                    <div>
                                      <span className="font-medium">
                                        {/* Use a simple approach to display the name */}
                                        {getLocalizedText(item.name)}
                                      </span>
                                      <span className="text-sm text-muted-foreground ml-2">
                                        × {item.quantity}
                                      </span>
                                      {item.specialInstructions && (
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                          <AlertCircle className="h-3 w-3" />
                                          {item.specialInstructions}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {order.specialInstructions && (
                                <div className="mt-2 pt-2 border-t">
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {order.specialInstructions}
                                  </p>
                                </div>
                              )}
                              <div className="mt-2 pt-2 border-t text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(order.createdAt).toLocaleString(i18n.language, { 
                                  hour: '2-digit', 
                                  minute: '2-digit', 
                                  second: '2-digit' 
                                })}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
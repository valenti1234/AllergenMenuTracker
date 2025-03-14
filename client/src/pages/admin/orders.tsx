import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Order, OrderStatus } from "@shared/schema";
import { orderStatuses } from "@shared/schema";
import { Clock, ClipboardList, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";

export default function Orders() {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const { formatPrice } = useSettings();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "all">("all");

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  // Helper function to extract the correct language from multilingual content
  const getLocalizedText = (textObj: any) => {
    if (!textObj) return "";
    
    // If it's already a string, check if it's a MongoDB stringified object
    if (typeof textObj === "string") {
      // Check if it's a MongoDB stringified object with language keys
      if (textObj.includes('en:') || textObj.includes('it:') || textObj.includes('es:')) {
        // Extract the current language using regex
        const currentLangRegex = new RegExp(`${i18n.language}:\\s*['"]([^'"]+)['"]`);
        const enLangRegex = /en:\s*['"]([^'"]+)['"]/;
        const itLangRegex = /it:\s*['"]([^'"]+)['"]/;
        const esLangRegex = /es:\s*['"]([^'"]+)['"]/;
        
        // Try to match the current language first
        const currentLangMatch = currentLangRegex.exec(textObj);
        if (currentLangMatch && currentLangMatch[1]) {
          return currentLangMatch[1];
        }
        
        // Fall back to English
        const enMatch = enLangRegex.exec(textObj);
        if (enMatch && enMatch[1]) {
          return enMatch[1];
        }
        
        // Try other languages
        const itMatch = itLangRegex.exec(textObj);
        if (itMatch && itMatch[1]) {
          return itMatch[1];
        }
        
        const esMatch = esLangRegex.exec(textObj);
        if (esMatch && esMatch[1]) {
          return esMatch[1];
        }
      }
      
      // If it's a regular string, return it
      return textObj;
    }
    
    // If it's an object with language keys
    if (typeof textObj === "object") {
      // Try current language first
      if (textObj[i18n.language]) return textObj[i18n.language];
      
      // Fall back to English
      if (textObj.en) return textObj.en;
      
      // If no matching language, return the first available
      const firstKey = Object.keys(textObj)[0];
      if (firstKey) return textObj[firstKey];
    }
    
    // If all else fails, stringify the object for debugging
    return typeof textObj === "object" ? JSON.stringify(textObj) : String(textObj);
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      apiRequest("PATCH", `/api/orders/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: t("common.success", "Success"),
        description: t("orders.status.changeSuccess", "Order status updated successfully"),
      });
    },
  });

  // Filter out completed and cancelled orders first, then apply status filter
  const activeOrders = orders?.filter(
    (order) => order.status !== "completed" && order.status !== "cancelled"
  );

  const filteredOrders = activeOrders?.filter(
    (order) => selectedStatus === "all" || order.status === selectedStatus
  );

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
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
    }
  };

  // Only show active statuses in the filter dropdown
  const activeStatuses = orderStatuses.filter(
    (status) => status !== "completed" && status !== "cancelled"
  );

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
          <h1 className="text-4xl font-bold">{t("orders.title", "Order Management")}</h1>
          <Select
            value={selectedStatus}
            onValueChange={(value) => setSelectedStatus(value as OrderStatus | "all")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("orders.filterPlaceholder", "Filter by Status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("orders.filters.all", "All Active Orders")}</SelectItem>
              {activeStatuses.map((status) => (
                <SelectItem key={status} value={status} className="capitalize">
                  {t(`orders.status.${status}`, status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6">
          {filteredOrders?.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-4">
                    <div>
                      {t("orders.orderNumber", "Order #")}
                      {order.id.slice(-6)}
                      <Badge
                        variant="secondary"
                        className={`ml-2 capitalize ${getStatusColor(order.status)}`}
                      >
                        {t(`orders.status.${order.status}`, order.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center text-base font-normal text-muted-foreground">
                      <Phone className="h-4 w-4 mr-2" />
                      {order.phoneNumber}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {order.type === "dine-in"
                      ? `${t("orders.table", "Table")} ${order.tableNumber}`
                      : `${t("menu.orderType.takeaway", "Takeaway")} - ${order.customerName}`}
                  </CardDescription>
                </div>
                <Select
                  value={order.status}
                  onValueChange={(value) =>
                    updateStatusMutation.mutate({
                      id: order.id,
                      status: value as OrderStatus,
                    })
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {orderStatuses.map((status) => (
                      <SelectItem key={status} value={status} className="capitalize">
                        {t(`orders.status.${status}`, status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center"
                      >
                        <div>
                          <span className="font-medium">
                            {getLocalizedText(item.name)}
                          </span>
                          <span className="text-sm text-muted-foreground ml-2">
                            × {item.quantity}
                          </span>
                          {item.specialInstructions && (
                            <p className="text-sm text-muted-foreground">
                              {t("orders.note", "Note")}: {item.specialInstructions}
                            </p>
                          )}
                        </div>
                        <span>
                          {formatPrice((item.price * item.quantity))}
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.specialInstructions && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" />
                        {order.specialInstructions}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {new Date(order.createdAt).toLocaleString(i18n.language)}
                    </div>
                    <div className="font-medium">
                      {t("menu.total", "Total")}: {formatPrice(order.total)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredOrders?.length === 0 && (
            <div className="text-center py-8">
              {selectedStatus === "all" 
                ? t("orders.noOrders", "No orders found") 
                : t("orders.noOrdersWithStatus", "No orders with status: {{status}}", { status: selectedStatus })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
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
import { Clock, ClipboardList, Phone, CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { StripeTerminalPayment } from "@/components/pos/StripeTerminalPayment";

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
                        className={`ml-2 capitalize ${getStatusColor(typeof order.status === 'string' ? order.status as OrderStatus : 'pending')}`}
                      >
                        {typeof order.status === 'string' 
                          ? t(`orders.status.${order.status}`, order.status)
                          : typeof order.status === 'object'
                            ? t(`orders.status.${Object.keys(order.status)[0] || 'pending'}`, "Unknown")
                            : "Unknown"}
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
                  value={typeof order.status === 'string' ? order.status : 'pending'}
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
                    {orderStatuses.map((status) => {
                      // Ensure status is a string
                      const statusStr = String(status);
                      return (
                        <SelectItem key={statusStr} value={statusStr} className="capitalize">
                          {t(`orders.status.${statusStr}`, statusStr)}
                        </SelectItem>
                      );
                    })}
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
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled={order.paymentStatus === 'paid'}
                            className="flex items-center gap-1"
                          >
                            <CreditCard className="h-4 w-4" />
                            {order.paymentStatus === 'paid' 
                              ? t("orders.paid", "Paid") 
                              : t("orders.processPayment", "Process Payment")}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <StripeTerminalPayment 
                            order={order} 
                            onPaymentComplete={(success) => {
                              if (success) {
                                // Aggiorna la lista degli ordini
                                queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
                              }
                            }} 
                          />
                        </DialogContent>
                      </Dialog>
                      
                      {/* Pulsante per visualizzare il dettaglio dell'ordine */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            <ClipboardList className="h-4 w-4" />
                            {t("orders.viewDetails", "View Details")}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl">
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold">
                              {t("orders.orderDetails", "Order Details")} #{order.id.slice(-6)}
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="font-medium">{t("orders.orderType", "Order Type")}:</span> 
                                {order.type === "dine-in" 
                                  ? `${t("orders.dineIn", "Dine-in")} - ${t("orders.table", "Table")} ${order.tableNumber}` 
                                  : t("menu.orderType.takeaway", "Takeaway")}
                              </div>
                              <div>
                                <span className="font-medium">{t("orders.customer", "Customer")}:</span> {order.customerName}
                              </div>
                              <div>
                                <span className="font-medium">{t("orders.phone", "Phone")}:</span> {order.phoneNumber}
                              </div>
                              <div>
                                <span className="font-medium">{t("orders.date", "Date")}:</span> {new Date(order.createdAt).toLocaleString(i18n.language)}
                              </div>
                              <div>
                                <span className="font-medium">{t("orders.status", "Status")}:</span> {
                                  typeof order.status === 'string' 
                                    ? t(`orders.status.${order.status}`, order.status)
                                    : (typeof order.status === 'object' ? t(`orders.status.${Object.keys(order.status)[0]}`, "Unknown") : "Unknown")
                                }
                              </div>
                              <div>
                                <span className="font-medium">{t("orders.paymentStatus", "Payment")}:</span> 
                                {order.paymentStatus === 'paid' 
                                  ? t("orders.paid", "Paid") 
                                  : t("orders.pending", "Pending")}
                              </div>
                            </div>
                            
                            <div className="border-t pt-4 mt-4">
                              <h4 className="font-medium mb-2">{t("orders.items", "Order Items")}:</h4>
                              <div className="space-y-2">
                                {order.items.map((item) => (
                                  <div key={item.id} className="flex justify-between">
                                    <div>
                                      <span className="font-medium">{getLocalizedText(item.name)}</span>
                                      <span className="text-sm text-muted-foreground ml-2">× {item.quantity}</span>
                                    </div>
                                    <span>{formatPrice(item.price * item.quantity)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {order.specialInstructions && (
                              <div className="border-t pt-4">
                                <h4 className="font-medium mb-2">{t("orders.specialInstructions", "Special Instructions")}:</h4>
                                <p className="text-sm">{order.specialInstructions}</p>
                              </div>
                            )}
                            
                            <div className="border-t pt-4 flex justify-between">
                              <span className="font-medium">{t("menu.total", "Total")}:</span>
                              <span className="font-bold">{formatPrice(order.total)}</span>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <div className="font-medium">
                        {t("menu.total", "Total")}: {formatPrice(order.total)}
                      </div>
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
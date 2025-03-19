import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Clock, ClipboardList } from "lucide-react";
import type { Order, OrderStatus } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function Archive() {
  const { t, i18n } = useTranslation();
  const { formatPrice } = useSettings();
  const [filterStatus, setFilterStatus] = useState<"completed" | "cancelled" | "all">("all");

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

  const filteredOrders = orders?.filter(
    (order) => {
      // Handle status as string or object
      const statusStr = typeof order.status === 'string' 
        ? order.status 
        : typeof order.status === 'object' && order.status !== null
          ? (Object.keys(order.status)[0] || 'completed')
          : 'completed';
      
      return statusStr === "completed" || statusStr === "cancelled";
    }
  ).filter(
    (order) => {
      if (filterStatus === "all") return true;
      
      // Handle status as string or object
      const statusStr = typeof order.status === 'string' 
        ? order.status 
        : typeof order.status === 'object' && order.status !== null
          ? (Object.keys(order.status)[0] || 'completed')
          : 'completed';
      
      return statusStr === filterStatus;
    }
  );

  const getStatusColor = (status: OrderStatus | any) => {
    // Ensure status is a string
    const statusStr = typeof status === 'string' ? status : 
                      typeof status === 'object' && status !== null ? 
                      (Object.keys(status)[0] || 'completed') : 'completed';
    
    switch (statusStr) {
      case "completed":
        return "bg-gray-500/10 text-gray-500";
      case "cancelled":
        return "bg-red-500/10 text-red-500";
      default:
        return "";
    }
  };

  // Funzione per renderizzare lo stato dell'ordine in modo sicuro
  const renderOrderStatus = (status: any, t: any): string => {
    // Get status string
    const statusStr = typeof status === 'string' 
      ? status 
      : typeof status === 'object' && status !== null
        ? (Object.keys(status)[0] || 'completed')
        : 'completed';
    
    // Get translation
    const translation = t(`orders.status.${statusStr}`, statusStr);
    
    // Ensure we return a string
    if (typeof translation === 'string') {
      return translation;
    } else if (typeof translation === 'object') {
      return JSON.stringify(translation).substring(0, 30);
    } else {
      return String(translation);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div>{t("common.loading", "Loading archived orders...")}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">{t("orders.archive.title", "Archived Orders")}</h1>
          <Select
            value={filterStatus}
            onValueChange={(value) => setFilterStatus(value as "completed" | "cancelled" | "all")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("orders.filterPlaceholder", "Filter by Status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("orders.archive.filters.all", "All Archived")}</SelectItem>
              <SelectItem value="completed">{typeof t("orders.status.completed", "Completed") === 'string' ? t("orders.status.completed", "Completed") : "Completed"}</SelectItem>
              <SelectItem value="cancelled">{typeof t("orders.status.cancelled", "Cancelled") === 'string' ? t("orders.status.cancelled", "Cancelled") : "Cancelled"}</SelectItem>
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
                      {t("orders.orderNumber", "Order #")}{order.id.slice(-6)}
                      <Badge
                        variant="secondary"
                        className={`ml-2 capitalize ${getStatusColor(typeof order.status === 'string' 
? order.status as OrderStatus : 'completed')}`}
                      >
                        {renderOrderStatus(order.status, t)}
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
                          <span className="font-medium">{getLocalizedText(item.name)}</span>
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
                                <span className="font-medium">{t("orders.statusLabel", "Status")}:</span>{" "}
                                {renderOrderStatus(order.status, t)}
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
              {t("orders.archive.noOrders", "No archived orders found")}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

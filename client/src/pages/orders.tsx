import { useState } from "react";
import { OrderListItem } from "@/components/orders/OrderListItem";
import type { Order, OrderStatus } from "@shared/schema";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const { t } = useTranslation();

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      // TODO: Implement API call to update order status
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus } 
            : order
        )
      );
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  const filteredOrders = filter === "all" 
    ? orders 
    : orders.filter(order => order.status === filter);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">{t('orders.title')}</h1>
        <Select
          value={filter}
          onValueChange={(value: typeof filter) => setFilter(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('orders.filterPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('orders.filters.all')}</SelectItem>
            {["pending", "preparing", "delayed", "ready", "served", "completed", "cancelled"].map((status) => (
              <SelectItem key={status} value={status}>
                {t(`kitchen.columns.${status}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredOrders.map(order => (
          <OrderListItem
            key={order.id}
            order={order}
            onStatusChange={handleStatusChange}
          />
        ))}
        {filteredOrders.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            {filter === "all" 
              ? t('orders.noOrders')
              : t('orders.noOrdersWithStatus', { status: t(`kitchen.columns.${filter}`) })}
          </div>
        )}
      </div>
    </div>
  );
} 
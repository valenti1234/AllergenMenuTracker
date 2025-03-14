import { useEffect, useState } from "react";
import { OrderCard } from "@/components/kitchen/OrderCard";
import type { Order, OrderStatus } from "@shared/schema";
import { useTranslation } from "react-i18next";

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<Order[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    // TODO: Set up WebSocket connection to receive real-time order updates
    // For now, we'll use the orders from the example
  }, []);

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

  const getOrdersByStatus = (status: OrderStatus) => {
    return orders.filter(order => order.status === status);
  };

  const renderColumn = (status: OrderStatus, count: number) => (
    <div className="flex-1 min-w-[300px] max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{t(`kitchen.columns.${status}`)}</h2>
        <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-sm">
          {count}
        </span>
      </div>
      <div className="space-y-4">
        {getOrdersByStatus(status).map(order => (
          <OrderCard
            key={order.id}
            order={order}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">{t('kitchen.title')}</h1>
        <div className="text-sm text-muted-foreground">
          {orders.length} {t('kitchen.activeOrders')}
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6">
        {renderColumn("pending", getOrdersByStatus("pending").length)}
        {renderColumn("preparing", getOrdersByStatus("preparing").length)}
        {renderColumn("delayed", getOrdersByStatus("delayed").length)}
        {renderColumn("ready", getOrdersByStatus("ready").length)}
        {renderColumn("served", getOrdersByStatus("served").length)}
      </div>
    </div>
  );
} 
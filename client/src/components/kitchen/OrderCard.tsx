import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Phone, User, Hash } from "lucide-react";
import type { Order, OrderItem, Language, OrderStatus } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
}

export function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language as Language;

  const getItemName = (item: OrderItem) => {
    if (!item.name || typeof item.name !== 'object') return t('errors.generic');
    return item.name[currentLanguage] || item.name.en || Object.values(item.name)[0] || t('errors.generic');
  };

  const formatTime = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <Card className="p-4 space-y-4 bg-card">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant={order.type === "dine-in" ? "default" : "secondary"}>
              {order.type === "dine-in" ? t('menu.orderType.dineIn') : t('menu.orderType.takeaway')}
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Hash className="h-4 w-4" />
              {order.id.slice(0, 6)}
            </span>
          </div>
          
          {order.type === "dine-in" ? (
            <div className="flex items-center gap-1 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              {t('kitchen.orderInfo.table')} {order.tableNumber}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              {t('kitchen.orderInfo.customer')}: {order.customerName}
            </div>
          )}
          
          <div className="flex items-center gap-1 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            {t('kitchen.orderInfo.phone')}: {order.phoneNumber}
          </div>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {formatTime(order.createdAt)}
        </div>
      </div>

      <div className="space-y-2">
        {order.items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Badge variant="outline" className="w-8 h-8 flex items-center justify-center rounded-full">
              {item.quantity}
            </Badge>
            <span className="font-medium">{getItemName(item)}</span>
          </div>
        ))}
      </div>

      {order.specialInstructions && (
        <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
          <div className="font-medium mb-1">{t('kitchen.orderInfo.specialInstructions')}:</div>
          {order.specialInstructions}
        </div>
      )}

      <div className="flex gap-2">
        <Button 
          className="flex-1" 
          onClick={() => onStatusChange(order.id, "preparing")}
          variant="default"
        >
          {t('kitchen.actions.startPreparing')}
        </Button>
        <Button 
          className="flex-1" 
          onClick={() => onStatusChange(order.id, "delayed")}
          variant="destructive"
        >
          {t('kitchen.actions.markDelayed')}
        </Button>
      </div>
    </Card>
  );
} 
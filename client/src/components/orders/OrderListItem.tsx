import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Phone, User } from "lucide-react";
import type { Order, OrderItem, Language, OrderStatus } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettings } from "@/contexts/SettingsContext";

interface OrderListItemProps {
  order: Order;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
}

export function OrderListItem({ order, onStatusChange }: OrderListItemProps) {
  const { t, i18n } = useTranslation();
  const { language } = useLanguage();
  const { formatPrice } = useSettings();
  const currentLanguage = i18n.language as Language;

  const getItemName = (item: OrderItem) => {
    if (!item.name || typeof item.name !== 'object') return t('errors.generic');
    return item.name[currentLanguage] || item.name.en || Object.values(item.name)[0] || t('errors.generic');
  };

  const formatOrderTime = (date: Date) => {
    return format(new Date(date), "dd/MM/yyyy, HH:mm:ss");
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">
                Order #{order.id.slice(0, 6)}
              </h3>
              <Badge variant={order.status === "completed" ? "default" : 
                         order.status === "cancelled" ? "destructive" : 
                         order.status === "delayed" ? "destructive" : 
                         "secondary"}>
                {order.status}
              </Badge>
            </div>
            <Select
              defaultValue={order.status}
              onValueChange={(value: OrderStatus) => onStatusChange(order.id, value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["pending", "preparing", "delayed", "ready", "served", "completed", "cancelled"].map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`kitchen.columns.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {order.type === "dine-in" ? (
                <span>{t('kitchen.orderInfo.table')} {order.tableNumber}</span>
              ) : (
                <span>{order.customerName}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              {order.phoneNumber}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatOrderTime(order.createdAt)}
            </div>
          </div>

          <div className="space-y-1">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.quantity}x</span>
                  <span>{getItemName(item)}</span>
                </div>
                <span className="text-muted-foreground">{formatPrice(item.price)}</span>
              </div>
            ))}
          </div>

          {order.specialInstructions && (
            <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md mt-2">
              <span className="font-medium">{t('kitchen.orderInfo.specialInstructions')}:</span>{" "}
              {order.specialInstructions}
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="font-semibold">{formatPrice(order.total)}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </div>
      </div>
    </Card>
  );
} 
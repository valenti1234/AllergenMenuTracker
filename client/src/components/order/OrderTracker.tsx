import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orderStatuses } from "@shared/schema";
import type { Order, OrderStatus } from "@shared/schema";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Clock,
  ChefHat,
  CheckCircle2,
  XCircle,
  Bell,
  AlertTriangle,
  Utensils,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettings } from "@/contexts/SettingsContext";

interface OrderTrackerProps {
  order: Order;
}

interface StatusInfo {
  icon: LucideIcon;
  color: string;
  step: number;
  label: string;
}

type StatusInfoMap = {
  [K in OrderStatus]: StatusInfo;
};

export function OrderTracker({ order }: OrderTrackerProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { formatPrice } = useSettings();
  const [progress, setProgress] = useState(0);

  const statusInfo: StatusInfoMap = {
    pending: { 
      icon: Clock, 
      color: "text-yellow-500", 
      step: 0,
      label: t('orders.status.received')
    },
    preparing: { 
      icon: ChefHat, 
      color: "text-blue-500", 
      step: 1,
      label: t('orders.status.preparing')
    },
    delayed: { 
      icon: AlertTriangle, 
      color: "text-orange-500", 
      step: 1,
      label: t('orders.status.delayed')
    },
    ready: { 
      icon: Bell, 
      color: "text-green-500", 
      step: 2,
      label: t('orders.status.ready')
    },
    served: { 
      icon: Utensils, 
      color: "text-purple-500", 
      step: 3,
      label: t('orders.status.served')
    },
    completed: { 
      icon: CheckCircle2, 
      color: "text-gray-500", 
      step: 4,
      label: t('orders.status.completed')
    },
    cancelled: { 
      icon: XCircle, 
      color: "text-red-500", 
      step: -1,
      label: t('orders.status.cancelled')
    },
  };

  const currentStep = statusInfo[order.status].step;

  useEffect(() => {
    // Animate progress based on current status
    const targetProgress = (currentStep / 3) * 100; // Now we have 4 main steps (0 to 3)
    setProgress(0);
    const timer = setTimeout(() => setProgress(targetProgress), 100);
    return () => clearTimeout(timer);
  }, [currentStep]);

  if (order.status === "cancelled") {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="py-3 sm:py-4">
          <CardTitle className="flex items-center gap-2 text-red-500 text-sm sm:text-base">
            <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            {t('orders.status.cancelled')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-xs sm:text-sm text-red-600">
            {t('orders.cancelledMessage')}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Define the main timeline statuses (excluding cancelled and completed)
  const timelineStatuses: OrderStatus[] = ["pending", "preparing", "ready", "served"];

  return (
    <Card>
      <CardHeader className="py-3 sm:py-4">
        <CardTitle className="flex items-center justify-between text-sm sm:text-base">
          <span>{t('orders.orderNumber', { id: order.id.slice(-6) })}</span>
          {order.status === "delayed" && (
            <span className={`text-xs sm:text-sm ${statusInfo.delayed.color}`}>
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
              {t('orders.delayedMessage')}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 pb-4">
        <div className="relative pt-6 sm:pt-0">
          {/* Progress bar background */}
          <div className="absolute inset-0 h-1.5 sm:h-2 w-full rounded-full bg-gray-100" />

          {/* Animated progress bar */}
          <motion.div
            className={`absolute inset-0 h-1.5 sm:h-2 rounded-full ${
              order.status === "delayed" ? "bg-orange-500" : "bg-primary"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />

          {/* Status points */}
          <div className="relative flex justify-between">
            {timelineStatuses.map((status) => {
              const isActive = statusInfo[order.status].step >= statusInfo[status].step;
              const isDelayed = order.status === "delayed" && status === "preparing";
              const Icon = isDelayed ? statusInfo.delayed.icon : statusInfo[status].icon;
              const color = isDelayed ? statusInfo.delayed.color : statusInfo[status].color;

              return (
                <motion.div
                  key={status}
                  className={`relative flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 bg-white ${
                    isActive
                      ? "border-primary " + color
                      : "border-gray-300 text-gray-400"
                  }`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: isActive ? 1 : 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="absolute -bottom-5 sm:-bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] sm:text-xs font-medium">
                    {isDelayed ? statusInfo.delayed.label : statusInfo[status].label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 pt-4 sm:pt-0">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">{t('orders.orderType')}:</span>
            <span className="font-medium capitalize">{t(`orders.type.${order.type}`)}</span>
          </div>
          {order.type === "dine-in" ? (
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">{t('orders.tableNumber')}:</span>
              <span className="font-medium">{order.tableNumber}</span>
            </div>
          ) : (
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">{t('orders.customerName')}:</span>
              <span className="font-medium">{order.customerName}</span>
            </div>
          )}
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">{t('orders.phoneNumber')}:</span>
            <span className="font-medium">{order.phoneNumber}</span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">{t('orders.total')}:</span>
            <span className="font-medium">
              {formatPrice(order.total)}
            </span>
          </div>
        </div>

        {/* Pulsante di pagamento per ordini in stato "servito" */}
        {order.status === "served" && (
          <div className="pt-2">
            <Link href={`/payment?id=${order.id}`}>
              <Button 
                variant="default" 
                className="w-full flex items-center justify-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                {t('orders.processPayment')}
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
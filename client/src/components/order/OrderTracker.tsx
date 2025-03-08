import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orderStatuses } from "@shared/schema";
import type { Order, OrderStatus } from "@shared/schema";
import { motion } from "framer-motion";
import {
  Clock,
  ChefHat,
  CheckCircle2,
  XCircle,
  Bell,
  AlertTriangle,
  Utensils,
  type LucideIcon,
} from "lucide-react";

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
  const [progress, setProgress] = useState(0);

  const statusInfo: StatusInfoMap = {
    pending: { 
      icon: Clock, 
      color: "text-yellow-500", 
      step: 0,
      label: "Order Received" 
    },
    preparing: { 
      icon: ChefHat, 
      color: "text-blue-500", 
      step: 1,
      label: "Preparing" 
    },
    delayed: { 
      icon: AlertTriangle, 
      color: "text-orange-500", 
      step: 1,
      label: "Delayed" 
    },
    ready: { 
      icon: Bell, 
      color: "text-green-500", 
      step: 2,
      label: "Ready" 
    },
    served: { 
      icon: Utensils, 
      color: "text-purple-500", 
      step: 3,
      label: "Served" 
    },
    completed: { 
      icon: CheckCircle2, 
      color: "text-gray-500", 
      step: 4,
      label: "Completed" 
    },
    cancelled: { 
      icon: XCircle, 
      color: "text-red-500", 
      step: -1,
      label: "Cancelled" 
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-500">
            <XCircle className="h-5 w-5" />
            Order Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">
            This order has been cancelled. Please contact the restaurant for
            assistance.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Define the main timeline statuses (excluding cancelled and completed)
  const timelineStatuses: OrderStatus[] = ["pending", "preparing", "ready", "served"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Order #{order.id.slice(-6)}</span>
          {order.status === "delayed" && (
            <span className={`text-sm ${statusInfo.delayed.color}`}>
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              Order is Delayed
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative">
          {/* Progress bar background */}
          <div className="absolute inset-0 h-2 w-full rounded-full bg-gray-100" />

          {/* Animated progress bar */}
          <motion.div
            className={`absolute inset-0 h-2 rounded-full ${
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
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white ${
                    isActive
                      ? "border-primary " + color
                      : "border-gray-300 text-gray-400"
                  }`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: isActive ? 1 : 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon className="h-4 w-4" />
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium">
                    {isDelayed ? statusInfo.delayed.label : statusInfo[status].label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order Type:</span>
            <span className="font-medium capitalize">{order.type}</span>
          </div>
          {order.type === "dine-in" ? (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Table Number:</span>
              <span className="font-medium">{order.tableNumber}</span>
            </div>
          ) : (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Customer Name:</span>
              <span className="font-medium">{order.customerName}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Phone Number:</span>
            <span className="font-medium">{order.phoneNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-medium">
              ${(order.total / 100).toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
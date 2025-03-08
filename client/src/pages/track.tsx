import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OrderTracker } from "@/components/order/OrderTracker";
import { Link } from "wouter";
import { Home } from "lucide-react";
import type { Order } from "@shared/schema";
import { CustomerLayout } from "@/components/layouts/CustomerLayout";
import { usePhone } from "@/contexts/PhoneContext";

export default function TrackOrder() {
  const { phoneNumber } = usePhone();
  const [isSearching, setIsSearching] = useState(false);

  // Start searching automatically when component mounts if we have a phone number
  useEffect(() => {
    if (phoneNumber) {
      setIsSearching(true);
    }
  }, [phoneNumber]);

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: [`/api/orders/track/${phoneNumber}`],
    enabled: isSearching && !!phoneNumber,
    refetchInterval: 5000, // Refresh every 5 seconds when tracking
  });

  // Filter out completed and cancelled orders
  const activeOrders = orders?.filter(
    (order) => order.status !== "completed" && order.status !== "cancelled"
  );

  return (
    <CustomerLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Track Your Order</h1>
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Back to Menu
            </Button>
          </Link>
        </div>

        <div className="max-w-xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Your Active Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading && <p>Loading orders...</p>}

                {!isLoading && activeOrders?.length === 0 && (
                  <p className="text-muted-foreground">
                    No active orders found for your phone number.
                  </p>
                )}

                {activeOrders?.map((order) => (
                  <OrderTracker key={order.id} order={order} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CustomerLayout>
  );
}
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OrderTracker } from "@/components/order/OrderTracker";
import { Link } from "wouter";
import { Home } from "lucide-react";
import type { Order } from "@shared/schema";

export default function TrackOrder() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: [`/api/orders/track/${phoneNumber.replace(/\D/g, '')}`],
    enabled: isSearching && phoneNumber.length >= 10,
    refetchInterval: 5000, // Refresh every 5 seconds when tracking
  });

  const handleSearch = () => {
    if (phoneNumber.length >= 10) {
      setIsSearching(true);
    }
  };

  // Filter out completed and cancelled orders
  const activeOrders = orders?.filter(
    (order) => order.status !== "completed" && order.status !== "cancelled"
  );

  return (
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
            <CardTitle>Enter Your Phone Number</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter your phone number"
                    className="flex-1"
                  />
                  <Button onClick={handleSearch}>Track</Button>
                </div>
              </div>

              {isLoading && <p>Loading orders...</p>}

              {activeOrders?.length === 0 && (
                <p className="text-muted-foreground">
                  No active orders found for this phone number.
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
  );
}
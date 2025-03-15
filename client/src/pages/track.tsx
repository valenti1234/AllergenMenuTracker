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
import { useTranslation } from "react-i18next";

export default function TrackOrder() {
  const { phoneNumber } = usePhone();
  const [isSearching, setIsSearching] = useState(false);
  const { t } = useTranslation();

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
      <div className="container mx-auto py-4 sm:py-8 px-3 sm:px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold">{t('orders.trackYourOrder')}</h1>
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2 text-xs sm:text-sm">
              <Home className="h-3 w-3 sm:h-4 sm:w-4" />
              {t('nav.backToMenu')}
            </Button>
          </Link>
        </div>

        <div className="max-w-xl mx-auto">
          <Card>
            <CardHeader className="pb-2 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">{t('orders.yourActiveOrders')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading && (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}

                {!isLoading && activeOrders?.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground text-sm sm:text-base">
                      {t('orders.noActiveOrders')}
                    </p>
                    <Link href="/">
                      <Button variant="outline" size="sm" className="mt-4">
                        {t('nav.placeOrder')}
                      </Button>
                    </Link>
                  </div>
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
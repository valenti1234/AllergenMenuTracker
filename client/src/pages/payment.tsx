import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CustomerLayout } from "@/components/layouts/CustomerLayout";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsContext";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { CreditCard, CheckCircle, ArrowLeft, Home } from "lucide-react";
import { Link } from "wouter";
import type { Order } from "@shared/schema";

export default function Payment() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { formatPrice, settings } = useSettings();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  
  // Verifica se il pagamento al momento dell'ordine è abilitato
  const payAtOrderEnabled = (settings as any)?.paymentOptions?.payAtOrder === true;
  
  // Ottieni l'ID dell'ordine dall'URL
  const orderId = window.location.search.split("=")[1];
  
  // Carica i dettagli dell'ordine
  const { data: order, isLoading, error } = useQuery<Order>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId,
    refetchInterval: false,
    retry: 2, // Riprova 2 volte in caso di errore
    retryDelay: 1000, // Attendi 1 secondo tra i tentativi
  });
  
  // Verifica che l'ordine sia in stato "servito" solo se non è attivo il pagamento al momento dell'ordine
  useEffect(() => {
    console.log("Order status check:", {
      orderId,
      orderStatus: order?.status,
      payAtOrderEnabled
    });
    
    // Se il pagamento al momento dell'ordine è attivo, ignora lo stato dell'ordine
    if (payAtOrderEnabled) {
      console.log("Payment at order is enabled, ignoring order status check");
      return;
    }
    
    // Altrimenti, verifica che l'ordine sia in stato "served"
    if (order && order.status !== "served") {
      console.log("Order status is not 'served', redirecting to track page");
      toast({
        variant: "destructive",
        title: t('payment.invalidOrderStatus'),
        description: t('payment.orderNotServed'),
      });
      setLocation("/track");
    }
  }, [order, setLocation, toast, t, payAtOrderEnabled]);
  
  // Simula il processo di pagamento
  const handlePayment = async () => {
    if (!order) return;
    
    setIsProcessing(true);
    
    try {
      // Simula una richiesta di pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Aggiorna lo stato dell'ordine a "completed" usando l'endpoint pubblico
      await apiRequest("PATCH", `/api/orders/${order.id}/complete`, {});
      
      setPaymentComplete(true);
      
      toast({
        title: t('payment.success'),
        description: t('payment.successDescription'),
      });
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        variant: "destructive",
        title: t('payment.error'),
        description: t('payment.errorDescription'),
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CustomerLayout>
    );
  }
  
  if (error || !order) {
    return (
      <CustomerLayout>
        <div className="container mx-auto py-8 px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>{t('payment.error')}</CardTitle>
              <CardDescription>{t('payment.orderNotFound')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground mb-4">
                {t('payment.errorDescription')}
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/track">
                <Button variant="default" className="w-full flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  {t('payment.backToOrders')}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </CustomerLayout>
    );
  }
  
  return (
    <CustomerLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">{t('payment.title')}</h1>
          <Link href="/menu">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              {t('nav.backToMenu')}
            </Button>
          </Link>
        </div>
        
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{paymentComplete ? t('payment.completed') : t('payment.processPayment')}</CardTitle>
              <CardDescription>
                {paymentComplete 
                  ? t('payment.thankYou') 
                  : t('payment.orderDetails', { id: order.id.slice(-6) })}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {paymentComplete ? (
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-center text-muted-foreground">
                    {t('payment.receiptSent')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">{t('orders.orderNumber')}:</span>
                      <span className="font-medium">#{order.id.slice(-6)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">{t('orders.orderType')}:</span>
                      <span className="font-medium">{t(`orders.type.${order.type}`)}</span>
                    </div>
                    {order.type === "dine-in" ? (
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">{t('orders.tableNumber')}:</span>
                        <span className="font-medium">{order.tableNumber}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">{t('orders.customerName')}:</span>
                        <span className="font-medium">{order.customerName}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t mt-2">
                      <span className="font-medium">{t('orders.total')}:</span>
                      <span className="font-bold text-lg">{formatPrice(order.total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col sm:flex-row gap-3">
              {paymentComplete ? (
                <Link href="/menu">
                  <Button className="w-full sm:w-auto">
                    {t('payment.backToMenu')}
                  </Button>
                </Link>
              ) : (
                <>
                  <Button 
                    variant="default" 
                    className="w-full sm:flex-1 flex items-center justify-center gap-2"
                    onClick={handlePayment}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <CreditCard className="h-4 w-4" />
                    )}
                    {t('payment.payNow')}
                  </Button>
                  <Link href="/track">
                    <Button variant="outline" className="w-full sm:w-auto">
                      {t('payment.cancel')}
                    </Button>
                  </Link>
                </>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </CustomerLayout>
  );
} 
import { useState, useEffect } from "react";
import { CustomerLayout } from "@/components/layouts/CustomerLayout";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { MenuItem, OrderType } from "@shared/schema";
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettings } from "@/contexts/SettingsContext";
import { usePhone } from "@/contexts/PhoneContext";
import { Link, useLocation } from "wouter";

interface CartItem {
  item: MenuItem;
  quantity: number;
}

export default function Cart() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { formatPrice, settings } = useSettings();
  const { toast } = useToast();
  const { phoneNumber } = usePhone();
  const [, setLocation] = useLocation();
  const [cartItems, setCartItems] = useState<Record<string, CartItem>>({});
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");

  const currentLanguage = language as "en" | "it" | "es";

  // Verifica se il pagamento al momento dell'ordine è abilitato
  const payAtOrderEnabled = (settings as any)?.paymentOptions?.payAtOrder === true;

  useEffect(() => {
    // Carica i dati del cliente dal localStorage
    try {
      const customerInfoStr = localStorage.getItem('customerInfo');
      if (customerInfoStr) {
        const customerInfo = JSON.parse(customerInfoStr);
        setOrderType(customerInfo.orderType);
        if (customerInfo.orderType === 'dine-in' && customerInfo.tableNumber) {
          setTableNumber(customerInfo.tableNumber);
        } else if (customerInfo.orderType === 'takeaway' && customerInfo.customerName) {
          setCustomerName(customerInfo.customerName);
        }
      }
    } catch (error) {
      console.error('Error loading customer info:', error);
    }

    // Carica gli elementi del carrello dal localStorage
    try {
      const cartData = localStorage.getItem('cartItems');
      if (cartData) {
        setCartItems(JSON.parse(cartData));
      }
    } catch (error) {
      console.error('Error loading cart items:', error);
    }
  }, []);

  const getItemName = (item: MenuItem) => {
    if (typeof item.name === 'string') return item.name;
    return item.name?.[currentLanguage] || item.name?.en || 'Unnamed Item';
  };

  const addItem = (itemId: string) => {
    setCartItems((prev) => {
      const newCart = { ...prev };
      if (newCart[itemId]) {
        newCart[itemId] = {
          ...newCart[itemId],
          quantity: newCart[itemId].quantity + 1
        };
      }
      saveCartToLocalStorage(newCart);
      return newCart;
    });
  };

  const removeItem = (itemId: string) => {
    setCartItems((prev) => {
      const newCart = { ...prev };
      if (newCart[itemId]) {
        if (newCart[itemId].quantity > 1) {
          newCart[itemId] = {
            ...newCart[itemId],
            quantity: newCart[itemId].quantity - 1
          };
        } else {
          delete newCart[itemId];
        }
      }
      saveCartToLocalStorage(newCart);
      return newCart;
    });
  };

  const deleteItem = (itemId: string) => {
    setCartItems((prev) => {
      const newCart = { ...prev };
      delete newCart[itemId];
      saveCartToLocalStorage(newCart);
      return newCart;
    });
  };

  const saveCartToLocalStorage = (cart: Record<string, CartItem>) => {
    try {
      localStorage.setItem('cartItems', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  };

  const handlePlaceOrder = async () => {
    if (!phoneNumber || !orderType) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide your phone number and order type",
      });
      return;
    }

    if (orderType === 'dine-in' && !tableNumber) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide your table number",
      });
      return;
    }

    if (orderType === 'takeaway' && !customerName) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide your name",
      });
      return;
    }

    if (Object.keys(cartItems).length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Your cart is empty",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedPhoneNumber = phoneNumber.replace(/\D/g, "");
      
      console.log("Sending order request:", {
        type: orderType,
        tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
        customerName: orderType === 'takeaway' ? customerName : undefined,
        phoneNumber: formattedPhoneNumber,
        items: Object.values(cartItems).map(({ item, quantity }) => ({
          menuItemId: item.id,
          name: item.name,
          quantity,
        })),
        specialInstructions: specialInstructions || undefined,
      });

      const order = await apiRequest("POST", "/api/orders", {
        type: orderType,
        tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
        customerName: orderType === 'takeaway' ? customerName : undefined,
        phoneNumber: formattedPhoneNumber,
        items: Object.values(cartItems).map(({ item, quantity }) => ({
          menuItemId: item.id,
          name: item.name,
          quantity,
        })),
        specialInstructions: specialInstructions || undefined,
      });
      
      console.log("Order API response:", order);
      console.log("Order ID:", order?.id);
      console.log("Payment at order enabled:", payAtOrderEnabled);
      console.log("Condition check:", payAtOrderEnabled && order && order.id);

      // Svuota il carrello
      setCartItems({});
      saveCartToLocalStorage({});
      setSpecialInstructions("");
      
      // Se il pagamento al momento dell'ordine è abilitato, reindirizza alla pagina di pagamento
      if (payAtOrderEnabled && order && order.id) {
        console.log("Payment at order is enabled, redirecting to track page");
        
        // Mostra un toast di successo prima del reindirizzamento
        toast({
          title: t('menu.orderSuccess'),
          description: t('menu.trackYourOrder'),
        });
        
        // Reindirizza alla pagina di tracciamento dell'ordine
        setTimeout(() => {
          console.log("Redirecting to track page");
          setLocation('/track');
        }, 2000);
        return;
      }

      // Altrimenti, mostra solo il messaggio di successo
      toast({
        title: t('menu.orderSuccess'),
        description: t('menu.trackYourOrder'),
      });

      // Reindirizza alla pagina di tracciamento
      setTimeout(() => {
        console.log("Redirecting to track page");
        setLocation('/track');
      }, 2000);
    } catch (error) {
      console.error("Order creation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to place order. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const total = Object.values(cartItems).reduce(
    (sum, { item, quantity }) => sum + item.price * quantity,
    0
  );

  const isEmpty = Object.keys(cartItems).length === 0;

  return (
    <CustomerLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold">{t('nav.cart')}</h1>
          <Link href="/menu">
            <Button variant="outline" size="sm" className="flex items-center gap-2 text-xs sm:text-sm">
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              {t('nav.backToMenu')}
            </Button>
          </Link>
        </div>

        {isEmpty ? (
          <Card className="p-6">
            <div className="text-center text-muted-foreground">
              <ShoppingCart className="mx-auto h-12 w-12 mb-3" />
              <p>{t('menu.emptyCart')}</p>
              <Link href="/menu">
                <Button variant="outline" className="mt-4">
                  {t('nav.backToMenu')}
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr,400px]">
            <Card>
              <CardHeader>
                <CardTitle>{t('menu.orderSummary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(cartItems).map(([id, { item, quantity }]) => (
                  <div key={id} className="flex items-center justify-between gap-4 pb-4 border-b">
                    <div className="flex-1">
                      <h4 className="font-medium">{getItemName(item)}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(item.price)} {t('menu.each')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeItem(id)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => addItem(id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteItem(id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="space-y-4 pt-4">
                  <div className="flex justify-between">
                    <span className="font-medium">{t('menu.total')}</span>
                    <span className="font-medium">{formatPrice(total)}</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('menu.specialInstructions')}</label>
                    <Textarea
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder={t('menu.specialInstructionsPlaceholder')}
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t('menu.placingOrder') : t('menu.placeOrder')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('orders.orderType')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>{t('orders.type.' + orderType)}</strong></p>
                    {orderType === 'dine-in' && (
                      <p>{t('orders.tableNumber')}: {tableNumber}</p>
                    )}
                    {orderType === 'takeaway' && (
                      <p>{t('orders.customerName')}: {customerName}</p>
                    )}
                    <p>{t('orders.phoneNumber')}: {phoneNumber}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
} 
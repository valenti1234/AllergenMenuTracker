import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MenuCard } from "@/components/menu/MenuCard";
import { AllergenFilter } from "@/components/menu/AllergenFilter";
import { DietaryFilter } from "@/components/menu/DietaryFilter";
import { OrderSummary } from "@/components/menu/OrderSummary";
import { NewsletterDialog } from "@/components/menu/NewsletterDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { MenuItem, Allergen, Category, OrderType, OrderItem, DietaryPreference } from "@shared/schema";
import { categories } from "@shared/schema";
import { Plus, MapPin } from "lucide-react";
import { usePhone } from '@/contexts/PhoneContext';
import { CustomerLayout } from "@/components/layouts/CustomerLayout";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import '@/i18n';

export default function Menu() {
  const { phoneNumber, setPhoneNumber } = usePhone();
  const [selectedAllergens, setSelectedAllergens] = useState<Allergen[]>([]);
  const [selectedDiets, setSelectedDiets] = useState<DietaryPreference[]>([]);
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [selectedItems, setSelectedItems] = useState<
    Map<string, { item: MenuItem; quantity: number }>
  >(new Map());
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: menuItems, isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  useEffect(() => {
    try {
      const customerInfoStr = localStorage.getItem('customerInfo');
      if (!customerInfoStr) {
        setLocation('/');
        return;
      }

      const customerInfo = JSON.parse(customerInfoStr);
      console.log('Retrieved customer info:', customerInfo);
      
      const isExpired = Date.now() - customerInfo.timestamp > 24 * 60 * 60 * 1000; // 24 hours

      if (isExpired || !customerInfo.phoneNumber || !customerInfo.orderType) {
        localStorage.removeItem('customerInfo');
        setLocation('/');
        return;
      }

      // Set the state from customerInfo
      setPhoneNumber(customerInfo.phoneNumber);
      setOrderType(customerInfo.orderType);
      if (customerInfo.orderType === 'dine-in' && customerInfo.tableNumber) {
        setTableNumber(customerInfo.tableNumber);
      } else if (customerInfo.orderType === 'takeaway' && customerInfo.customerName) {
        setCustomerName(customerInfo.customerName);
      }
      
      // Log newsletter subscription status
      const hasSubscribed = customerInfo.subscribeToNewsletter === true;
      console.log('Newsletter subscription status:', hasSubscribed);
      
      // Se l'utente non ha ancora fatto una scelta sulla newsletter, mostra il dialog
      if (customerInfo.subscribeToNewsletter === undefined) {
        console.log('No newsletter choice found, showing dialog');
        setShowNewsletter(true);
      }
      
    } catch (error) {
      console.error('Error checking customer info:', error);
      setLocation('/');
    }
  }, []); // Empty dependency array - only run once on mount

  const filteredItems = menuItems?.filter((item) => {
    // Filter by allergens
    if (selectedAllergens.length > 0 && item.allergens.some((allergen) => selectedAllergens.includes(allergen))) {
      return false;
    }
    
    // Filter by dietary preferences
    if (selectedDiets.length > 0 && !selectedDiets.every(diet => item.dietaryInfo?.includes(diet))) {
      return false;
    }

    return true;
  });

  const toggleAllergen = (allergen: Allergen) => {
    setSelectedAllergens((current) =>
      current.includes(allergen)
        ? current.filter((a) => a !== allergen)
        : [...current, allergen]
    );
  };

  const toggleDiet = (diet: DietaryPreference) => {
    setSelectedDiets((current) =>
      current.includes(diet)
        ? current.filter((d) => d !== diet)
        : [...current, diet]
    );
  };

  const addItem = useCallback((item: MenuItem) => {
    setSelectedItems((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(item.id);
      
      if (existing) {
        newMap.set(item.id, {
          item,
          quantity: existing.quantity + 1,
        });
      } else {
        newMap.set(item.id, { item, quantity: 1 });
      }
      
      // Salva nel localStorage
      saveCartToLocalStorage(newMap);
      
      return newMap;
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setSelectedItems((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(itemId);
      
      if (existing && existing.quantity > 1) {
        newMap.set(itemId, {
          item: existing.item,
          quantity: existing.quantity - 1,
        });
      } else {
        newMap.delete(itemId);
      }
      
      // Salva nel localStorage
      saveCartToLocalStorage(newMap);
      
      return newMap;
    });
  }, []);

  // Funzione per salvare il carrello nel localStorage
  const saveCartToLocalStorage = (cart: Map<string, { item: MenuItem; quantity: number }>) => {
    try {
      // Converti la Map in un oggetto per il localStorage
      const cartObject: Record<string, { item: MenuItem; quantity: number }> = {};
      cart.forEach((value, key) => {
        cartObject[key] = value;
      });
      
      localStorage.setItem('cartItems', JSON.stringify(cartObject));
      
      // Invia un evento personalizzato per aggiornare il conteggio nel header
      // Utilizziamo setTimeout per evitare aggiornamenti di stato durante il rendering
      setTimeout(() => {
        window.dispatchEvent(new Event('cartUpdated'));
      }, 0);
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  };

  const handleSubscribe = async () => {
    try {
      // Here you would typically make an API call to subscribe the user
      // For now, we'll just show a success message
      toast({
        title: t('newsletter.success'),
      });
      
      // Aggiorna il localStorage con la scelta dell'utente
      try {
        const customerInfoStr = localStorage.getItem('customerInfo');
        if (customerInfoStr) {
          const customerInfo = JSON.parse(customerInfoStr);
          
          // Aggiorna il campo subscribeToNewsletter
          const updatedInfo = {
            ...customerInfo,
            subscribeToNewsletter: true
          };
          
          console.log('Updating customer info with newsletter subscription:', updatedInfo);
          localStorage.setItem('customerInfo', JSON.stringify(updatedInfo));
        }
      } catch (error) {
        console.error('Error updating customer info:', error);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('newsletter.error'),
      });
    } finally {
      setShowNewsletter(false);
    }
  };

  const handleSkipNewsletter = () => {
    try {
      const customerInfoStr = localStorage.getItem('customerInfo');
      if (customerInfoStr) {
        const customerInfo = JSON.parse(customerInfoStr);
        
        // Aggiorna il campo subscribeToNewsletter
        const updatedInfo = {
          ...customerInfo,
          subscribeToNewsletter: false
        };
        
        console.log('Updating customer info with newsletter choice (skipped):', updatedInfo);
        localStorage.setItem('customerInfo', JSON.stringify(updatedInfo));
      }
    } catch (error) {
      console.error('Error updating customer info:', error);
    } finally {
      setShowNewsletter(false);
    }
  };

  const handlePhoneSubmit = () => {
    // This function is no longer needed but kept for compatibility
    console.log('Phone submitted');
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

    if (selectedItems.size === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Your order is empty",
      });
      return;
    }

    setIsSubmittingOrder(true);

    try {
      const formattedPhoneNumber = phoneNumber.replace(/\D/g, "");

      await apiRequest("POST", "/api/orders", {
        type: orderType,
        tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
        customerName: orderType === 'takeaway' ? customerName : undefined,
        phoneNumber: formattedPhoneNumber,
        items: Array.from(selectedItems.values()).map(({ item, quantity }) => ({
          menuItemId: item.id,
          name: item.name,
          quantity,
        })),
        specialInstructions: "",
      });

      toast({
        title: "Success",
        description: "Your order has been placed successfully",
      });

      // Clear the order
      selectedItems.forEach((_, id) => removeItem(id));
    } catch (error) {
      console.error("Order creation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to place order. Please try again.",
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  if (isLoading) {
    return <div>{t('common.loading')}</div>;
  }

  return (
    <CustomerLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="grid gap-8 lg:grid-cols-[300px,1fr]">
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="font-medium">{t('menu.filters.allergens')}</h3>
              <AllergenFilter
                selectedAllergens={selectedAllergens}
                onToggle={toggleAllergen}
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">{t('menu.filters.dietary')}</h3>
              <DietaryFilter
                selectedDiets={selectedDiets}
                onToggle={toggleDiet}
              />
            </div>
          </div>

          <div>
            <Tabs defaultValue={categories[0]}>
              <div className="mb-4 overflow-x-auto pb-2">
                <TabsList className="inline-flex w-auto min-w-full no-scrollbar">
                  {categories.map((category) => (
                    <TabsTrigger key={category} value={category} className="whitespace-nowrap">
                      {t(`menu.categories.${category}`)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {categories.map((category) => (
                <TabsContent key={category} value={category} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredItems
                      ?.filter((item) => item.category === category)
                      .map((item) => (
                        <MenuCard
                          key={item.id}
                          item={item}
                          onAddToOrder={() => addItem(item)}
                        />
                      ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>

      <NewsletterDialog
        open={showNewsletter}
        onOpenChange={setShowNewsletter}
        onSubscribe={handleSubscribe}
        onSkip={handleSkipNewsletter}
      />
    </CustomerLayout>
  );
}
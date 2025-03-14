import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MenuCard } from "@/components/menu/MenuCard";
import { AllergenFilter } from "@/components/menu/AllergenFilter";
import { DietaryFilter } from "@/components/menu/DietaryFilter";
import { OrderTypeSelector } from "@/components/menu/OrderTypeSelector";
import { OrderSummary } from "@/components/menu/OrderSummary";
import { NewsletterDialog } from "@/components/menu/NewsletterDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { MenuItem, Allergen, Category, OrderType } from "@shared/schema";
import { categories } from "@shared/schema";
import { Plus, MapPin } from "lucide-react";
import { usePhone } from '@/contexts/PhoneContext';
import { CustomerLayout } from "@/components/layouts/CustomerLayout";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";

export default function Menu() {
  const { phoneNumber, setPhoneNumber } = usePhone();
  const [selectedAllergens, setSelectedAllergens] = useState<Allergen[]>([]);
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [selectedItems, setSelectedItems] = useState<
    Map<string, { item: MenuItem; quantity: number }>
  >(new Map());
  const { t } = useTranslation();
  const { toast } = useToast();

  const { data: menuItems, isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

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

  const toggleDiet = (diet: string) => {
    setSelectedDiets((current) =>
      current.includes(diet)
        ? current.filter((d) => d !== diet)
        : [...current, diet]
    );
  };

  const addToOrder = (item: MenuItem) => {
    setSelectedItems((current) => {
      const newMap = new Map(current);
      const existing = newMap.get(item.id);
      newMap.set(item.id, {
        item,
        quantity: existing ? existing.quantity + 1 : 1,
      });
      return newMap;
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedItems((current) => {
      const newMap = new Map(current);
      const existing = newMap.get(itemId);
      if (existing) {
        newMap.set(itemId, { ...existing, quantity });
      }
      return newMap;
    });
  };

  const removeItem = (itemId: string) => {
    setSelectedItems((current) => {
      const newMap = new Map(current);
      newMap.delete(itemId);
      return newMap;
    });
  };

  const handlePhoneSubmit = () => {
    setShowNewsletter(true);
  };

  const handleSubscribe = async () => {
    try {
      // Here you would typically make an API call to subscribe the user
      // For now, we'll just show a success message
      toast({
        title: t('newsletter.success'),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('newsletter.error'),
      });
    } finally {
      setShowNewsletter(false);
    }
  };

  if (isLoading) {
    return <div>{t('common.loading')}</div>;
  }

  return (
    <CustomerLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">{t('menu.title')}</h1>
          <Link href="/track">
            <Button variant="outline" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t('nav.trackOrder')}
            </Button>
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[300px,1fr,300px]">
          <div className="space-y-8">
            <OrderTypeSelector
              selectedType={orderType}
              onSelectType={setOrderType}
              tableNumber={tableNumber}
              onTableNumberChange={setTableNumber}
              customerName={customerName}
              onCustomerNameChange={setCustomerName}
              phoneNumber={phoneNumber}
              onPhoneNumberChange={setPhoneNumber}
              onPhoneSubmit={handlePhoneSubmit}
            />
            <AllergenFilter
              selectedAllergens={selectedAllergens}
              onToggle={toggleAllergen}
            />
            <DietaryFilter
              selectedDiets={selectedDiets}
              onToggle={toggleDiet}
            />
          </div>

          <Tabs defaultValue={categories[0]} className="space-y-6">
            <TabsList>
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="capitalize"
                >
                  {t(`menu.categories.${category.toLowerCase()}`)}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category} value={category}>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredItems
                    ?.filter((item) => item.category === category)
                    .map((item) => (
                      <div key={item.id}>
                        <MenuCard 
                          item={item} 
                          onAddToOrder={() => addToOrder(item)}
                        />
                      </div>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <div className="space-y-8">
            <OrderSummary
              selectedItems={selectedItems}
              updateQuantity={updateQuantity}
              removeItem={removeItem}
              orderType={orderType}
              tableNumber={tableNumber}
              customerName={customerName}
              phoneNumber={phoneNumber}
            />
          </div>
        </div>
        <NewsletterDialog
          open={showNewsletter}
          onOpenChange={setShowNewsletter}
          onSubscribe={handleSubscribe}
          onSkip={() => setShowNewsletter(false)}
        />
      </div>
    </CustomerLayout>
  );
}
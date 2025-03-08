import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MenuCard } from "@/components/menu/MenuCard";
import { AllergenFilter } from "@/components/menu/AllergenFilter";
import { OrderTypeSelector } from "@/components/menu/OrderTypeSelector";
import { OrderSummary } from "@/components/menu/OrderSummary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { MenuItem, Allergen, Category, OrderType } from "@shared/schema";
import { categories } from "@shared/schema";
import { Plus, MapPin } from "lucide-react";

export default function Menu() {
  const [selectedAllergens, setSelectedAllergens] = useState<Allergen[]>([]);
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(""); 
  const [selectedItems, setSelectedItems] = useState<
    Map<string, { item: MenuItem; quantity: number }>
  >(new Map());

  const { data: menuItems, isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  const filteredItems = menuItems?.filter((item) => {
    if (selectedAllergens.length === 0) return true;
    return !item.allergens.some((allergen) => selectedAllergens.includes(allergen));
  });

  const toggleAllergen = (allergen: Allergen) => {
    setSelectedAllergens((current) =>
      current.includes(allergen)
        ? current.filter((a) => a !== allergen)
        : [...current, allergen]
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

  if (isLoading) {
    return <div>Loading menu...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Our Menu</h1>
        <Link href="/track">
          <Button variant="outline" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Track Your Order
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
          />
          <AllergenFilter
            selectedAllergens={selectedAllergens}
            onToggleAllergen={toggleAllergen}
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
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category}>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredItems
                  ?.filter((item) => item.category === category)
                  .map((item) => (
                    <div key={item.id} className="relative">
                      <MenuCard item={item} />
                      <Button
                        className="absolute bottom-4 right-4"
                        onClick={() => addToOrder(item)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Order
                      </Button>
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
    </div>
  );
}
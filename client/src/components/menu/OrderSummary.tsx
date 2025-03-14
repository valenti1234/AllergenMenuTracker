import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { MenuItem, OrderType, OrderItem } from "@shared/schema";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface OrderSummaryProps {
  selectedItems: Map<string, { item: MenuItem; quantity: number }>;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  orderType: OrderType | null;
  tableNumber: string;
  customerName: string;
  phoneNumber: string;
}

export function OrderSummary({
  selectedItems,
  updateQuantity,
  removeItem,
  orderType,
  tableNumber,
  customerName,
  phoneNumber,
}: OrderSummaryProps) {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentLanguage = i18n.language as "en" | "it" | "es";

  const getItemName = (item: MenuItem) => {
    if (typeof item.name === 'string') return item.name;
    return item.name?.[currentLanguage] || item.name?.en || 'Unnamed Item';
  };

  const total = Array.from(selectedItems.values()).reduce(
    (sum, { item, quantity }) => sum + item.price * quantity,
    0
  );

  const handleSubmitOrder = async () => {
    if (!orderType) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select an order type",
      });
      return;
    }

    if (!phoneNumber) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a phone number",
      });
      return;
    }

    if (orderType === "dine-in" && !tableNumber) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a table number",
      });
      return;
    }

    if (orderType === "takeaway" && !customerName) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your name",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const orderItems: OrderItem[] = Array.from(selectedItems.entries()).map(
        ([id, { item, quantity }]) => ({
          menuItemId: id,
          quantity,
          price: item.price,
          name: item.name,
          id: "", // This will be set by the server
        })
      );

      // Format phone number to remove any non-digit characters
      const formattedPhoneNumber = phoneNumber.replace(/\D/g, "");

      await apiRequest("POST", "/api/orders", {
        type: orderType,
        customerName: orderType === "takeaway" ? customerName : undefined,
        tableNumber: orderType === "dine-in" ? tableNumber : undefined,
        phoneNumber: formattedPhoneNumber,
        items: orderItems,
        specialInstructions: specialInstructions || undefined,
      });

      toast({
        title: "Success",
        description: "Your order has been placed successfully",
      });

      // Clear the order
      selectedItems.forEach((_, id) => removeItem(id));
      setSpecialInstructions("");
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

  if (selectedItems.size === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <ShoppingCart className="mx-auto h-12 w-12 mb-3" />
          <p>Your cart is empty</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <h3 className="text-lg font-semibold">{t('menu.orderSummary')}</h3>
      <div className="space-y-4">
        {Array.from(selectedItems.entries()).map(([id, { item, quantity }]) => (
          <div key={id} className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-medium">{getItemName(item)}</h4>
              <p className="text-sm text-muted-foreground">
                ${(item.price / 100).toFixed(2)} each
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={quantity}
                onChange={(e) =>
                  updateQuantity(id, parseInt(e.target.value, 10))
                }
                className="w-20"
                min={1}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => removeItem(id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 pt-4 border-t">
        <div className="flex justify-between">
          <span className="font-medium">{t('menu.total')}</span>
          <span className="font-medium">${(total / 100).toFixed(2)}</span>
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
          onClick={handleSubmitOrder}
          disabled={isSubmitting || !orderType}
        >
          {isSubmitting ? t('menu.placingOrder') : t('menu.placeOrder')}
        </Button>
      </div>
    </Card>
  );
}
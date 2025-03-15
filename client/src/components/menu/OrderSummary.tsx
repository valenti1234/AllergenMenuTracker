import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { MenuItem, OrderType, OrderItem } from "@shared/schema";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettings } from "@/contexts/SettingsContext";

interface OrderSummaryProps {
  items: { item: MenuItem; quantity: number }[];
  onRemoveItem: (itemId: string) => void;
  onAddItem: (itemId: string) => void;
  onPlaceOrder: () => Promise<void>;
  isSubmitting?: boolean;
}

export function OrderSummary({
  items,
  onRemoveItem,
  onAddItem,
  onPlaceOrder,
  isSubmitting = false,
}: OrderSummaryProps) {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const { formatPrice } = useSettings();
  const { toast } = useToast();
  const [specialInstructions, setSpecialInstructions] = useState("");
  
  const currentLanguage = language as "en" | "it" | "es";

  const getItemName = (item: MenuItem) => {
    if (typeof item.name === 'string') return item.name;
    return item.name?.[currentLanguage] || item.name?.en || 'Unnamed Item';
  };

  const total = items.reduce(
    (sum, { item, quantity }) => sum + item.price * quantity,
    0
  );

  if (items.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <ShoppingCart className="mx-auto h-12 w-12 mb-3" />
          <p>{t('menu.emptyCart')}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <h3 className="text-lg font-semibold">{t('menu.orderSummary')}</h3>
      <div className="space-y-4">
        {items.map(({ item, quantity }) => (
          <div key={item.id} className="flex items-center justify-between gap-4">
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
                onClick={() => onRemoveItem(item.id)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onAddItem(item.id)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 pt-4 border-t">
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
          onClick={onPlaceOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? t('menu.placingOrder') : t('menu.placeOrder')}
        </Button>
      </div>
    </Card>
  );
}
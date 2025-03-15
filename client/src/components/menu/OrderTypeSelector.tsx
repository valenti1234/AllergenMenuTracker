import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Utensils, Package, Phone } from "lucide-react";
import type { OrderType } from "@shared/schema";
import { useTranslation } from "react-i18next";

interface OrderTypeSelectorProps {
  selectedType: OrderType | null;
  onSelectType: (type: OrderType) => void;
  tableNumber: string;
  onTableNumberChange: (value: string) => void;
  customerName: string;
  onCustomerNameChange: (value: string) => void;
  phoneNumber: string;
  onPhoneNumberChange: (value: string) => void;
  onPhoneSubmit?: () => void;
}

export function OrderTypeSelector({
  selectedType,
  onSelectType,
  tableNumber,
  onTableNumberChange,
  customerName,
  onCustomerNameChange,
  phoneNumber,
  onPhoneNumberChange,
  onPhoneSubmit,
}: OrderTypeSelectorProps) {
  const { t } = useTranslation();

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber && onPhoneSubmit) {
      onPhoneSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">{t('menu.customerInfo.orderTypeTitle')}</h3>
      <div className="flex gap-2">
        <Button
          variant={selectedType === "dine-in" ? "default" : "outline"}
          onClick={() => onSelectType("dine-in")}
        >
          <Utensils className="mr-2 h-4 w-4" />
          {t('menu.customerInfo.dineIn')}
        </Button>
        <Button
          variant={selectedType === "takeaway" ? "default" : "outline"}
          onClick={() => onSelectType("takeaway")}
        >
          <Package className="mr-2 h-4 w-4" />
          {t('menu.customerInfo.takeaway')}
        </Button>
      </div>

      <form onSubmit={handlePhoneSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">{t('menu.customerInfo.phoneNumber')}</Label>
          <Input
            id="phone"
            type="tel"
            value={phoneNumber}
            onChange={(e) => onPhoneNumberChange(e.target.value)}
            placeholder={t('menu.customerInfo.phoneNumberPlaceholder')}
          />
        </div>

        {selectedType === "dine-in" && (
          <div className="space-y-2">
            <Label htmlFor="table">{t('menu.customerInfo.tableNumber')}</Label>
            <Input
              id="table"
              type="text"
              value={tableNumber}
              onChange={(e) => onTableNumberChange(e.target.value)}
              placeholder={t('menu.customerInfo.tableNumberPlaceholder')}
            />
          </div>
        )}

        {selectedType === "takeaway" && (
          <div className="space-y-2">
            <Label htmlFor="name">{t('menu.customerInfo.customerName')}</Label>
            <Input
              id="name"
              type="text"
              value={customerName}
              onChange={(e) => onCustomerNameChange(e.target.value)}
              placeholder={t('menu.customerInfo.customerNamePlaceholder')}
            />
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700" 
          disabled={!phoneNumber}
        >
          <Phone className="mr-2 h-4 w-4" />
          {t('common.continue')}
        </Button>
      </form>
    </div>
  );
}
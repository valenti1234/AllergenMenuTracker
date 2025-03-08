import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Utensils, Package } from "lucide-react";
import type { OrderType } from "@shared/schema";

interface OrderTypeSelectorProps {
  selectedType: OrderType | null;
  onSelectType: (type: OrderType) => void;
  tableNumber: string;
  onTableNumberChange: (value: string) => void;
  customerName: string;
  onCustomerNameChange: (value: string) => void;
  phoneNumber: string;
  onPhoneNumberChange: (value: string) => void;
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
}: OrderTypeSelectorProps) {
  return (
    <div className="flex flex-col gap-4 p-4 bg-card rounded-lg">
      <h3 className="font-medium">Select Order Type</h3>
      <div className="flex gap-4">
        <Button
          variant={selectedType === "dine-in" ? "default" : "outline"}
          className="flex-1"
          onClick={() => onSelectType("dine-in")}
        >
          <Utensils className="mr-2 h-4 w-4" />
          Dine-in
        </Button>
        <Button
          variant={selectedType === "takeaway" ? "default" : "outline"}
          className="flex-1"
          onClick={() => onSelectType("takeaway")}
        >
          <Package className="mr-2 h-4 w-4" />
          Takeaway
        </Button>
      </div>

      {selectedType && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone-number">Phone Number</Label>
            <Input
              id="phone-number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => {
                // Only allow numbers and format the input
                const cleaned = e.target.value.replace(/\D/g, '');
                if (cleaned.length <= 10) {
                  onPhoneNumberChange(cleaned);
                }
              }}
              placeholder="(XXX) XXX-XXXX"
              required
              pattern="[0-9]{10}"
            />
          </div>

          {selectedType === "dine-in" && (
            <div className="space-y-2">
              <Label htmlFor="table-number">Table Number</Label>
              <Input
                id="table-number"
                value={tableNumber}
                onChange={(e) => onTableNumberChange(e.target.value)}
                placeholder="Enter table number"
              />
            </div>
          )}

          {selectedType === "takeaway" && (
            <div className="space-y-2">
              <Label htmlFor="customer-name">Customer Name</Label>
              <Input
                id="customer-name"
                value={customerName}
                onChange={(e) => onCustomerNameChange(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
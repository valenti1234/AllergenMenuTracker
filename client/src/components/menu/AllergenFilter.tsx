import { Badge } from "@/components/ui/badge";
import { allergens } from "@shared/schema";
import type { Allergen } from "@shared/schema";

interface AllergenFilterProps {
  selectedAllergens: Allergen[];
  onToggleAllergen: (allergen: Allergen) => void;
}

export function AllergenFilter({
  selectedAllergens,
  onToggleAllergen,
}: AllergenFilterProps) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-medium">Filter by Allergens</h3>
      <div className="flex flex-wrap gap-2">
        {allergens.map((allergen) => (
          <Badge
            key={allergen}
            variant={selectedAllergens.includes(allergen) ? "default" : "outline"}
            className="cursor-pointer capitalize"
            onClick={() => onToggleAllergen(allergen)}
          >
            {allergen}
          </Badge>
        ))}
      </div>
    </div>
  );
}

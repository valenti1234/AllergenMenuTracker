import { Badge } from "@/components/ui/badge";
import { allergens } from "@shared/schema";
import type { Allergen } from "@shared/schema";
import { useTranslation } from "react-i18next";

interface AllergenFilterProps {
  selectedAllergens: Allergen[];
  onToggle: (allergen: Allergen) => void;
}

export function AllergenFilter({
  selectedAllergens,
  onToggle,
}: AllergenFilterProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-medium">{t('menu.filters.allergens')}</h3>
      <div className="flex flex-wrap gap-2">
        {allergens.map((allergen) => (
          <Badge
            key={allergen}
            variant={selectedAllergens.includes(allergen) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onToggle(allergen)}
          >
            {t(`allergens.${allergen}`)}
          </Badge>
        ))}
      </div>
    </div>
  );
}

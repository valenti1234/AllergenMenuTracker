import { Badge } from "@/components/ui/badge";
import { dietaryPreferences, DietaryPreference } from "@shared/schema";
import { useTranslation } from "react-i18next";

interface DietaryFilterProps {
  selectedDiets: DietaryPreference[];
  onToggle: (diet: DietaryPreference) => void;
}

export function DietaryFilter({ selectedDiets, onToggle }: DietaryFilterProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2">
      {dietaryPreferences.map((diet) => (
        <Badge
          key={diet}
          variant={selectedDiets.includes(diet) ? "default" : "outline"}
          className="cursor-pointer capitalize"
          onClick={() => onToggle(diet)}
        >
          {t(`dietary.${diet.toLowerCase().replace(/-(.)/g, (_, c) => c.toUpperCase())}`)}
        </Badge>
      ))}
    </div>
  );
} 
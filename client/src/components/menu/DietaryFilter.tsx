import { Badge } from "@/components/ui/badge";
import { dietaryPreferences, DietaryPreference } from "@shared/schema";
import { useTranslation } from "react-i18next";

interface DietaryFilterProps {
  selectedDiets: DietaryPreference[];
  onToggle: (diet: DietaryPreference) => void;
}

export function DietaryFilter({ selectedDiets, onToggle }: DietaryFilterProps) {
  const { t } = useTranslation();

  // Funzione per convertire il valore dello schema nella chiave di traduzione
  const getDietaryTranslationKey = (diet: string): string => {
    switch(diet) {
      case 'gluten-free': return 'glutenFree';
      case 'dairy-free': return 'dairyFree';
      default: return diet;
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {dietaryPreferences.map((diet) => (
        <Badge
          key={diet}
          variant={selectedDiets.includes(diet) ? "default" : "outline"}
          className="cursor-pointer capitalize"
          onClick={() => onToggle(diet)}
        >
          {t(`dietary.${getDietaryTranslationKey(diet)}`)}
        </Badge>
      ))}
    </div>
  );
} 
import { Badge } from "@/components/ui/badge";
import { dietaryPreferences } from "@shared/schema";

interface DietaryFilterProps {
  selectedDiets: string[];
  onToggle: (diet: string) => void;
}

export function DietaryFilter({ selectedDiets, onToggle }: DietaryFilterProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium">Dietary Preferences</h3>
      <div className="flex flex-wrap gap-2">
        {dietaryPreferences.map((diet) => (
          <Badge
            key={diet}
            variant={selectedDiets.includes(diet) ? "default" : "outline"}
            className="cursor-pointer capitalize"
            onClick={() => onToggle(diet)}
          >
            {diet}
          </Badge>
        ))}
      </div>
    </div>
  );
} 
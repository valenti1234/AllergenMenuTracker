import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, AlertCircle, Utensils, Flame, LeafyGreen } from "lucide-react";
import { useState } from "react";
import type { MenuItem } from "@shared/schema";

interface MenuCardProps {
  item: MenuItem;
}

export function MenuCard({ item }: MenuCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <Card
        className="overflow-hidden h-full flex flex-col cursor-pointer transition-all hover:shadow-lg"
        onClick={() => setShowDetails(true)}
      >
        <img
          src={item.imageUrl}
          alt={item.name}
          className="h-48 w-full object-cover"
        />
        <CardContent className="flex-1 pt-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold">{item.name}</h3>
            <span className="font-medium text-primary">
              ${(item.price / 100).toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{item.description}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Clock className="h-4 w-4" />
            <span>{item.prepTime} mins</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {item.allergens.map((allergen) => (
              <Tooltip key={allergen}>
                <TooltipTrigger>
                  <Badge variant="outline" className="capitalize">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {allergen}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Contains {allergen}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          {(item.dietaryInfo?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2">
              {(item.dietaryInfo ?? []).map((diet) => (
                <Badge key={diet} variant="secondary" className="capitalize">
                  <LeafyGreen className="h-3 w-3 mr-1" />
                  {diet}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{item.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-64 object-cover rounded-lg"
            />
            <div className="space-y-4">
              <p className="text-muted-foreground">{item.description}</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Utensils className="h-4 w-4" />
                    Ingredients
                  </h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {item.ingredients.map((ingredient, index) => (
                      <li key={index}>{ingredient}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Flame className="h-4 w-4" />
                    Nutritional Info
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>Calories: {item.calories}</div>
                    <div>Protein: {item.protein}g</div>
                    <div>Carbs: {item.carbs}g</div>
                    <div>Fat: {item.fat}g</div>
                  </div>
                </div>
              </div>

              {item.allergens.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Allergens
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {item.allergens.map((allergen) => (
                      <Badge key={allergen} variant="outline" className="capitalize">
                        {allergen}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {(item.dietaryInfo?.length ?? 0) > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <LeafyGreen className="h-4 w-4" />
                    Dietary Information
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(item.dietaryInfo ?? []).map((diet) => (
                      <Badge key={diet} variant="secondary" className="capitalize">
                        {diet}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm text-muted-foreground">
                    {item.prepTime} mins prep time
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
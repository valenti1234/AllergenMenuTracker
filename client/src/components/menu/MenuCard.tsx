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
import { 
  Clock, 
  AlertCircle, 
  Utensils, 
  Flame, 
  LeafyGreen, 
  ChefHat,
  Sparkles,
  Info
} from "lucide-react";
import React, { useState } from "react";
import type { MenuItem } from "@shared/schema";

interface MenuCardProps {
  item: MenuItem;
}

export function MenuCard({ item }: MenuCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Calculate health score (simple version)
  const healthScore = Math.min(100, Math.max(0, 
    ((item.protein ?? 0) * 2) + // Protein is good
    ((item.calories ?? 0) < 600 ? 30 : 0) + // Lower calories
    ((item.fat ?? 0) < 20 ? 20 : 0) + // Lower fat
    (item.dietaryInfo?.includes("vegan") ? 10 : 0) +
    (item.dietaryInfo?.includes("gluten-free") ? 10 : 0)
  ));

  // Helper function to format nutritional values
  const formatNutritionalValue = (value: number | undefined | null): string => {
    return value?.toString() ?? '0';
  };

  // Helper function to calculate percentage for progress bars
  const calculatePercentage = (value: number | undefined | null, max: number): number => {
    return Math.min(100, ((value ?? 0) / max) * 100);
  };

  return (
    <>
      <Card
        className="group overflow-hidden h-full flex flex-col cursor-pointer transition-all hover:shadow-xl relative"
        onClick={() => setShowDetails(true)}
      >
        {/* Image container with overlay */}
        <div className="relative h-48 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
          <img
            src={item.imageUrl}
            alt={item.name}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
          />
          {/* Price tag */}
          <div className="absolute top-4 right-4 z-20 bg-primary text-primary-foreground px-3 py-1 rounded-full font-semibold shadow-lg">
            ${(item.price / 100).toFixed(2)}
          </div>
          {/* Health score */}
          <div className="absolute bottom-4 right-4 z-20">
            <Tooltip>
              <TooltipTrigger>
                <div className={`rounded-full w-10 h-10 flex items-center justify-center ${
                  healthScore >= 80 ? 'bg-green-500' :
                  healthScore >= 60 ? 'bg-yellow-500' :
                  'bg-orange-500'
                } text-white font-semibold text-sm`}>
                  {healthScore}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Health Score: {healthScore}/100</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <CardContent className="flex-1 pt-4">
          {/* Title and prep time */}
          <div className="space-y-2 mb-3">
            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
              {item.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{item.prepTime} mins</span>
            </div>
          </div>

          {/* Description with gradient fade */}
          <div className="relative mb-4">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.description}
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-background to-transparent" />
          </div>

          {/* Tags section */}
          <div className="space-y-3">
            {/* Dietary tags */}
            {(item.dietaryInfo?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(item.dietaryInfo ?? []).map((diet) => (
                  <Badge key={diet} variant="secondary" className="capitalize text-xs">
                    <LeafyGreen className="h-3 w-3 mr-1" />
                    {diet}
                  </Badge>
                ))}
              </div>
            )}

            {/* Allergen warnings */}
            {item.allergens.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.allergens.map((allergen) => (
                  <Tooltip key={allergen}>
                    <TooltipTrigger>
                      <Badge variant="destructive" className="capitalize text-xs">
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
            )}
          </div>

          {/* Quick nutrition facts */}
          <div className="mt-4 pt-3 border-t grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Flame className="h-3 w-3" />
              {formatNutritionalValue(item.calories)} cal
            </div>
            <div className="flex items-center gap-1">
              <ChefHat className="h-3 w-3" />
              {formatNutritionalValue(item.protein)}g protein
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed view dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              {item.name}
              {healthScore >= 80 && (
                <Tooltip>
                  <TooltipTrigger>
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Healthy Choice!</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6">
            {/* Hero image with overlay */}
            <div className="relative rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-64 object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4 z-20 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    ${(item.price / 100).toFixed(2)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span>{item.prepTime} mins prep time</span>
                  </div>
                </div>
              </div>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {/* Description */}
                <div className="prose max-w-none">
                  <p className="text-muted-foreground">{item.description}</p>
                </div>

                {/* Dietary and allergen info */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Dietary tags */}
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

                  {/* Allergens */}
                  {item.allergens.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Allergen Warnings
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {item.allergens.map((allergen) => (
                          <Badge key={allergen} variant="destructive" className="capitalize">
                            {allergen}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Ingredients and nutrition */}
                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Ingredients */}
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Utensils className="h-4 w-4" />
                      Ingredients
                    </h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {item.ingredients.map((ingredient, index) => (
                        <li key={index} className="capitalize">{ingredient}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Nutritional info */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Flame className="h-4 w-4" />
                      Nutritional Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground flex justify-between items-center">
                          <span>Calories</span>
                          <span className="font-medium">{item.calories}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all" 
                            style={{ width: `${calculatePercentage(item.calories, 2000)}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground flex justify-between items-center">
                          <span>Protein</span>
                          <span className="font-medium">{item.protein}g</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 transition-all" 
                            style={{ width: `${Math.min(100, (item.protein / 50) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground flex justify-between items-center">
                          <span>Carbs</span>
                          <span className="font-medium">{item.carbs}g</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-yellow-500 transition-all" 
                            style={{ width: `${Math.min(100, (item.carbs / 300) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground flex justify-between items-center">
                          <span>Fat</span>
                          <span className="font-medium">{item.fat}g</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-500 transition-all" 
                            style={{ width: `${Math.min(100, (item.fat / 65) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Health score explanation */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-medium">Health Score: {healthScore}/100</h4>
                      <p className="text-sm text-muted-foreground">
                        This score is calculated based on protein content, calories, fat content, 
                        and special dietary attributes. A higher score indicates a healthier option.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
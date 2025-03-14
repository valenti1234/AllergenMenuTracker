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
  DialogTrigger,
  DialogDescription
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
  Info,
  Plus
} from "lucide-react";
import React, { useState } from "react";
import type { MenuItem } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart } from "lucide-react";

interface MenuCardProps {
  item: MenuItem;
  onAddToOrder: () => void;
}

export function MenuCard({ item, onAddToOrder }: MenuCardProps) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { language } = useLanguage();
  const { formatPrice } = useSettings();

  const currentLanguage = i18n.language as "en" | "it" | "es";

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
    if (value === undefined || value === null) return "N/A";
    return value.toString();
  };

  // Helper function to calculate percentage for progress bars
  const calculatePercentage = (value: number | undefined | null, max: number): number => {
    if (value === undefined || value === null) return 0;
    return Math.min(100, (value / max) * 100);
  };

  const getName = () => {
    if (typeof item.name === 'string') return item.name;
    return item.name?.[currentLanguage] || item.name?.en || 'Unnamed Item';
  };

  const getDescription = () => {
    if (typeof item.description === 'string') return item.description;
    return item.description?.[currentLanguage] || item.description?.en || '';
  };

  const getIngredients = () => {
    if (Array.isArray(item.ingredients)) return item.ingredients;
    return item.ingredients?.[currentLanguage] || item.ingredients?.en || [];
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-primary/10">
            <div className="relative">
              <div className="absolute top-2 right-2 z-10">
                <Badge variant="secondary" className="bg-black/50 backdrop-blur-sm text-white border-0">
                  {formatPrice(item.price)}
                </Badge>
              </div>
              <div className="relative h-48 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={getName()}
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            </div>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-xl mb-1">{getName()}</h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {getDescription()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{item.prepTime} {t('common.minutes')}</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {item.dietaryInfo.slice(0, 3).map((diet) => (
                    <Badge key={diet} variant="outline" className="text-xs">
                      {t(`dietary.${diet}`)}
                    </Badge>
                  ))}
                  {item.dietaryInfo.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{item.dietaryInfo.length - 3}
                    </Badge>
                  )}
                </div>

                <Button 
                  variant="default"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAddToOrder();
                  }}
                >
                  {t('menu.addToOrder')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{getName()}</DialogTitle>
            <DialogDescription>{getDescription()}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6">
                {/* Header with image */}
                <div className="relative aspect-video overflow-hidden rounded-lg">
                  <img
                    src={item.imageUrl}
                    alt={getName()}
                    className="object-cover"
                  />
                </div>

                {/* Title and description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">{getName()}</h2>
                    <p className="text-lg font-semibold">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                  <p className="text-muted-foreground">
                    {getDescription()}
                  </p>
                </div>

                {/* Preparation time and dietary info */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {item.prepTime} {t('common.minutes')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.dietaryInfo.map((diet) => (
                      <Badge key={diet} variant="secondary">
                        {t(`dietary.${diet}`)}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Ingredients and nutrition */}
                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Ingredients */}
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Utensils className="h-4 w-4" />
                      {t('menu.ingredients')}
                    </h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {getIngredients().map((ingredient, index) => (
                        <li key={index} className="capitalize">{ingredient}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Nutritional info */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Flame className="h-4 w-4" />
                      {t('menu.nutritionalInfo')}
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground flex justify-between items-center">
                          <span>{t('common.calories')}</span>
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
                          <span>{t('common.protein')}</span>
                          <span className="font-medium">{item.protein}{t('common.grams')}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 transition-all" 
                            style={{ width: `${Math.min(100, (item.protein ?? 0 / 50) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground flex justify-between items-center">
                          <span>{t('common.carbs')}</span>
                          <span className="font-medium">{item.carbs}{t('common.grams')}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-yellow-500 transition-all" 
                            style={{ width: `${Math.min(100, (item.carbs ?? 0 / 300) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground flex justify-between items-center">
                          <span>{t('common.fat')}</span>
                          <span className="font-medium">{item.fat}{t('common.grams')}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-500 transition-all" 
                            style={{ width: `${Math.min(100, (item.fat ?? 0 / 65) * 100)}%` }}
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
                      <h4 className="font-medium">{t('common.healthScore')}: {healthScore}/100</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('menu.healthScoreExplanation')}
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
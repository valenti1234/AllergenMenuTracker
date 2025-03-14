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
  Plus,
  X
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
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-primary/10 h-[420px] flex flex-col">
            <div className="relative">
              <div className="absolute top-2 right-2 z-10">
                <Badge variant="secondary" className="bg-black/50 backdrop-blur-sm text-white border-0">
                  {formatPrice(item.price)}
                </Badge>
              </div>
              {item.chefRecommended && (
                <div className="absolute top-2 left-2 z-10">
                  <Badge variant="default" className="bg-amber-500 text-white border-0 flex items-center gap-1">
                    <ChefHat className="h-3 w-3" />
                    {t('menu.chefRecommended')}
                  </Badge>
                </div>
              )}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={getName()}
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            </div>
            
            <div className="flex flex-col flex-1 p-4">
              <div className="flex-1">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-xl mb-1">
                      {getName()}
                      {item.chefRecommended && (
                        <ChefHat className="h-4 w-4 inline-block ml-1 text-amber-500" />
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-3">
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
                </div>
              </div>
              
              <div className="mt-auto pt-2">
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
            </div>
          </Card>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
          <button 
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">{getName()}</h2>
              <p className="text-muted-foreground line-clamp-2">
                {getDescription()}
              </p>
            </div>
            
            <div className="relative aspect-video overflow-hidden rounded-lg">
              <img
                src={item.imageUrl}
                alt={getName()}
                className="object-cover w-full"
              />
            </div>
            
            <p className="text-muted-foreground">
              {getDescription()}
            </p>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{item.prepTime} {t('common.minutes')}</span>
              </div>
              
              {item.dietaryInfo.includes("vegetarian") && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                  {t('dietary.vegetarian')}
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Utensils className="h-5 w-5" />
                  <h3 className="text-lg font-medium">{t('menu.ingredients')}</h3>
                </div>
                <ul className="space-y-2">
                  {getIngredients().map((ingredient, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span className="text-sm">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="h-5 w-5" />
                  <h3 className="text-lg font-medium">{t('menu.nutritionalInfo')}</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>{t('common.calories')}</span>
                    <span className="font-medium">{item.calories || 0}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all" 
                      style={{ width: `${calculatePercentage(item.calories, 2000)}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>{t('common.protein')}</span>
                    <span className="font-medium">{item.protein || 0}{t('common.grams')}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all" 
                      style={{ width: `${calculatePercentage(item.protein, 50)}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>{t('common.carbs')}</span>
                    <span className="font-medium">{item.carbs || 0}{t('common.grams')}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500 transition-all" 
                      style={{ width: `${calculatePercentage(item.carbs, 300)}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>{t('common.fat')}</span>
                    <span className="font-medium">{item.fat || 0}{t('common.grams')}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 transition-all" 
                      style={{ width: `${calculatePercentage(item.fat, 65)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              variant="default"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 mt-4" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToOrder();
                setIsOpen(false);
              }}
            >
              {t('menu.addToOrder')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
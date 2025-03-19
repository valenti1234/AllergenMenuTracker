interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
}

interface RecipeMap {
  [menuItemId: string]: RecipeIngredient[];
}

export const recipeIngredients: RecipeMap = {
  // Primi piatti
  "67d09f18c8430bb46ca8dce3": [ // Bucatini alla Carbonara
    { name: "Pasta Spaghetti", quantity: 0.12, unit: "kg" },
    { name: "Uova", quantity: 1, unit: "pz" },
    { name: "Guanciale", quantity: 0.04, unit: "kg" },
    { name: "Pecorino Romano", quantity: 0.03, unit: "kg" }
  ],
  "pizza-margherita": [
    { name: "Farina 00", quantity: 0.25, unit: "kg" },
    { name: "Pomodori San Marzano", quantity: 0.15, unit: "kg" },
    { name: "Mozzarella di Bufala", quantity: 0.125, unit: "kg" },
    { name: "Olio di Oliva", quantity: 0.015, unit: "l" },
    { name: "Basilico", quantity: 2, unit: "pz" }
  ],
  // Aggiungi altri piatti qui...
};

export function getRecipeIngredients(menuItemId: string): RecipeIngredient[] {
  return recipeIngredients[menuItemId] || [];
} 
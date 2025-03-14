import { AdminLayout } from "@/components/admin/AdminLayout";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import type { MenuItem, Language } from "@shared/schema";
import { insertMenuItemSchema, categories, allergens, dietaryPreferences, languages } from "@shared/schema";
import { z } from "zod";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";

type FormValues = z.infer<typeof insertMenuItemSchema>;

export default function MenuItems() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [currentLanguage, setCurrentLanguage] = useState<Language>("en");
  const { t, i18n } = useTranslation();
  const { formatPrice } = useSettings();

  const { data: menuItems, isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(insertMenuItemSchema),
    defaultValues: {
      name: {
        en: "",
        it: "",
        es: ""
      },
      description: {
        en: "",
        it: "",
        es: ""
      },
      price: 0,
      category: "starters",
      imageUrl: "",
      allergens: [],
      prepTime: 15,
      available: true,
      ingredients: {
        en: [],
        it: [],
        es: []
      },
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      dietaryInfo: [],
    },
    mode: "onChange"
  });

  const createMutation = useMutation({
    mutationFn: (data: FormValues) =>
      apiRequest("POST", "/api/menu", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      form.reset();
      toast({
        title: "Success",
        description: "Menu item created successfully",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormValues }) =>
      apiRequest("PATCH", `/api/menu/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      setEditingId(null);
      form.reset();
      toast({
        title: "Success",
        description: "Menu item updated successfully",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/menu/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      toast({
        title: "Success",
        description: "Menu item deleted successfully",
      });
    },
  });

  const generateMutation = useMutation<
    MenuItem,
    Error,
    string
  >({
    mutationFn: async (name: string) => {
      console.log('Generating menu item for:', name);
      const response = await apiRequest<MenuItem>("POST", "/api/menu/generate", { name });
      if (!response) {
        throw new Error("Failed to generate menu item");
      }
      return response;
    },
    onSuccess: (data) => {
      console.log('Mutation onSuccess received data:', data);
      const formValues = {
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        imageUrl: data.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
        allergens: data.allergens || [],
        prepTime: data.prepTime,
        available: true,
        ingredients: data.ingredients || { en: [], it: [], es: [] },
        calories: data.calories || 0,
        protein: data.protein || 0,
        carbs: data.carbs || 0,
        fat: data.fat || 0,
        dietaryInfo: data.dietaryInfo || [],
      };

      console.log('Setting form values:', formValues);
      form.reset(formValues);
      setImagePreviewUrl(data.imageUrl);

      toast({
        title: "Success",
        description: "Menu item details generated successfully",
      });
    },
    onError: (error) => {
      console.error('Generation error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate menu item details",
      });
    },
  });

  const regenerateImageMutation = useMutation({
    mutationFn: async () => {
      const name = form.watch("name.en");
      if (!name) {
        throw new Error("Please enter a menu item name first");
      }
      return generateMutation.mutate(name);
    },
  });

  const onSubmit = (data: FormValues) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleIngredientsChange = (value: string) => {
    const ingredients = value.split('\n').filter(Boolean);
    form.setValue(`ingredients.${currentLanguage}`, ingredients);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Menu Items</h1>
          <div className="flex gap-4">
            <Select
              value={currentLanguage}
              onValueChange={(value: Language) => setCurrentLanguage(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="it">Italian</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                form.reset();
                setEditingId(null);
              }}
            >
              Clear Form
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name={`name.${currentLanguage}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name ({currentLanguage.toUpperCase()})</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="outline"
                className="mt-2"
                disabled={!form.watch("name.en") || generateMutation.isPending}
                onClick={() => generateMutation.mutate(form.watch("name.en"))}
              >
                {generateMutation.isPending ? "Generating..." : "Generate with AI"}
              </Button>

              <FormField
                control={form.control}
                name={`description.${currentLanguage}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description ({currentLanguage.toUpperCase()})</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`ingredients.${currentLanguage}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ingredients ({currentLanguage.toUpperCase()}) (one per line)</FormLabel>
                    <FormControl>
                      <Textarea
                        value={field.value?.join('\n') || ''}
                        onChange={(e) => handleIngredientsChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (in cents)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <div className="space-y-4">
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={regenerateImageMutation.isPending}
                        onClick={() => regenerateImageMutation.mutate()}
                        className="w-full"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate Image
                      </Button>
                      {field.value && (
                        <div className="relative aspect-video rounded-lg overflow-hidden border">
                          <img
                            src={field.value}
                            alt="Menu item preview"
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dietaryInfo"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center mb-2">
                      <FormLabel>Dietary Information</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7"
                        disabled={!form.watch("ingredients.en") || !form.watch("description.en") || !form.watch("name.en")}
                        onClick={async () => {
                          try {
                            const ingredients = form.getValues("ingredients.en");
                            
                            // Make sure ingredients is an array
                            if (!Array.isArray(ingredients)) {
                              throw new Error("Ingredients must be an array");
                            }

                            const response = await apiRequest("POST", "/api/menu/analyze-dietary", {
                              name: form.getValues("name.en"),
                              ingredients: ingredients,
                              description: form.getValues("description.en")
                            });

                            if (response.dietaryCategories) {
                              // Update the form's dietaryInfo field with the analyzed categories
                              form.setValue("dietaryInfo", response.dietaryCategories);
                              field.onChange(response.dietaryCategories);
                              toast({
                                title: "Success",
                                description: "Dietary information analyzed and updated",
                              });
                            } else {
                              throw new Error("No dietary categories received");
                            }
                          } catch (error) {
                            console.error('Failed to analyze dietary information:', error);
                            toast({
                              variant: "destructive",
                              title: "Error",
                              description: error instanceof Error ? error.message : "Failed to analyze dietary information",
                            });
                          }
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Analyze with AI
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {dietaryPreferences.map((preference) => (
                        <div key={preference} className="flex items-center space-x-2">
                          <Checkbox
                            id={preference}
                            checked={field.value?.includes(preference)}
                            onCheckedChange={(checked) => {
                              const updatedValue = checked
                                ? [...(field.value || []), preference]
                                : (field.value || []).filter((p: string) => p !== preference);
                              field.onChange(updatedValue);
                            }}
                          />
                          <label
                            htmlFor={preference}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                          >
                            {preference}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allergens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allergens</FormLabel>
                    <div className="grid grid-cols-2 gap-4">
                      {allergens.map((allergen) => (
                        <div key={allergen} className="flex items-center space-x-2">
                          <Checkbox
                            id={allergen}
                            checked={field.value?.includes(allergen)}
                            onCheckedChange={(checked) => {
                              const updatedValue = checked
                                ? [...(field.value || []), allergen]
                                : (field.value || []).filter((a: string) => a !== allergen);
                              field.onChange(updatedValue);
                            }}
                          />
                          <label
                            htmlFor={allergen}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                          >
                            {allergen}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prepTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preparation Time (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="available"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Available</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="calories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calories</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="protein"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protein (g)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="carbs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carbohydrates (g)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fat (g)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={
                  createMutation.isPending ||
                  updateMutation.isPending ||
                  !form.formState.isValid
                }
              >
                {editingId ? "Update" : "Create"} Menu Item
              </Button>
            </form>
          </Form>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Current Menu Items</h2>
            {menuItems?.map((item) => (
              <div
                key={item.id}
                className="p-4 border rounded-lg flex justify-between items-center"
              >
                <div>
                  <h3 className="font-medium">
                    {typeof item.name === 'string' ? item.name : item.name?.en || 'Unnamed Item'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.category} - {formatPrice(item.price)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ingredients: {Array.isArray(item.ingredients) 
                      ? item.ingredients.join(", ")
                      : (item.ingredients?.en || []).join(", ")}
                  </p>
                  {item.calories && (
                    <p className="text-sm text-muted-foreground">
                      Calories: {item.calories} | Protein: {item.protein}g | Carbs: {item.carbs}g | Fat: {item.fat}g
                    </p>
                  )}
                  {(item.dietaryInfo?.length ?? 0) > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Dietary Info: {item.dietaryInfo.join(", ")}
                    </p>
                  )}
                </div>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingId(item.id);
                      form.reset({
                        ...item,
                        ingredients: item.ingredients || { en: [], it: [], es: [] },
                        dietaryInfo: item.dietaryInfo || []
                      });
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(item.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
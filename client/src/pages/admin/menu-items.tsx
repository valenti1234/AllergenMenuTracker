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
import type { MenuItem } from "@shared/schema";
import { insertMenuItemSchema, categories, allergens, dietaryPreferences } from "@shared/schema";
import { z } from "zod";
import { RefreshCw } from "lucide-react";

type FormValues = z.infer<typeof insertMenuItemSchema>;

export default function MenuItems() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");

  const { data: menuItems, isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(insertMenuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "starters",
      imageUrl: "",
      allergens: [],
      prepTime: 15,
      available: true,
      ingredients: [],
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      dietaryInfo: [],
    },
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

  const generateMutation = useMutation({
    mutationFn: async (name: string) => {
      console.log('Generating menu item for:', name);
      const data = await apiRequest<MenuItem>("POST", "/api/menu/generate", { name });
      console.log('API Response data:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Mutation onSuccess received data:', data);
      const formValues = {
        name: form.getValues().name,
        description: data.description,
        price: data.price,
        category: data.category,
        imageUrl: data.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
        allergens: data.allergens || [],
        prepTime: data.prepTime,
        available: true,
        ingredients: data.ingredients || [],
        calories: data.calories || 0,
        protein: data.protein || 0,
        carbs: data.carbs || 0,
        fat: data.fat || 0,
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
      const name = form.getValues().name;
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Menu Items</h1>
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

        <div className="grid gap-8 lg:grid-cols-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
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
                disabled={!form.watch("name") || generateMutation.isPending}
                onClick={() => generateMutation.mutate(form.watch("name"))}
              >
                {generateMutation.isPending ? "Generating..." : "Generate with AI"}
              </Button>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
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
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem
                            key={category}
                            value={category}
                            className="capitalize"
                          >
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
                name="allergens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allergens</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {allergens.map((allergen) => (
                        <FormField
                          key={allergen}
                          control={form.control}
                          name="allergens"
                          render={({ field: allergenField }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={allergenField.value?.includes(allergen)}
                                  onCheckedChange={(checked) => {
                                    const allergenList = checked
                                      ? [...(allergenField.value || []), allergen]
                                      : allergenField.value?.filter((a) => a !== allergen) || [];
                                    allergenField.onChange(allergenList);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="capitalize">
                                {allergen}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ingredients"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ingredients (one per line)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value.join('\n')}
                        onChange={(e) => {
                          const ingredients = e.target.value
                            .split('\n')
                            .map((i) => i.trim())
                            .filter((i) => i !== "");
                          field.onChange(ingredients);
                        }}
                        placeholder="Enter ingredients, one per line"
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Added Dietary Information FormField with AI analysis button */}
              <FormField
                control={form.control}
                name="dietaryInfo"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Dietary Information</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7"
                        onClick={async () => {
                          const currentIngredients = form.getValues("ingredients");
                          const description = form.getValues("description");
                          const name = form.getValues("name");

                          if (!currentIngredients.length || !description || !name) {
                            toast({
                              title: "Missing Information",
                              description: "Please fill in the name, description, and ingredients first.",
                              variant: "destructive",
                            });
                            return;
                          }

                          try {
                            const response = await apiRequest("POST", "/api/menu/analyze-dietary", {
                              name,
                              ingredients: currentIngredients,
                              description,
                            });

                            if (response.dietaryCategories) {
                              form.setValue("dietaryInfo", response.dietaryCategories);
                              toast({
                                title: "Success",
                                description: "Dietary information updated based on AI analysis",
                              });
                            }
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to analyze dietary information",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Analyze with AI
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {dietaryPreferences.map((preference) => (
                        <FormField
                          key={preference}
                          control={form.control}
                          name="dietaryInfo"
                          render={({ field: dietaryField }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={dietaryField.value?.includes(preference)}
                                  onCheckedChange={(checked) => {
                                    const preferenceList = checked
                                      ? [...(dietaryField.value || []), preference]
                                      : dietaryField.value?.filter((p) => p !== preference) || [];
                                    dietaryField.onChange(preferenceList);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="capitalize">
                                {preference}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
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



              <Button type="submit" className="w-full">
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
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.category} - ${(item.price / 100).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ingredients: {(item.ingredients || []).join(", ")}
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
                        ingredients: item.ingredients || [],
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
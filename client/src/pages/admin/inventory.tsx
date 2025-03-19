import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Checkbox
} from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, AlertTriangle, Pencil, Trash, Filter, AlignJustify, MoreHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Allergen = "gluten" | "dairy" | "nuts" | "eggs" | "soy" | "shellfish" | "fish" | "peanuts";

interface AllergenAnalysisResult {
  ingredient: string;
  allergens: {
    gluten: boolean;
    dairy: boolean;
    nuts: boolean;
    eggs: boolean;
    soy: boolean;
    shellfish: boolean;
    fish: boolean;
    peanuts: boolean;
  };
  confidence: number;
  description?: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  lastUpdated: string;
  status: "ok" | "low" | "critical";
  allergens?: Allergen[];
}

export default function Inventory() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAllergenDialogOpen, setIsAllergenDialogOpen] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: "",
    category: "",
    quantity: 0,
    unit: "",
    minThreshold: 0,
    allergens: []
  });
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const categories = ["Ingredienti base", "Conserve", "Latticini", "Carni", "Verdure", "Spezie"];
  
  const allergens: Allergen[] = ["gluten", "dairy", "nuts", "eggs", "soy", "shellfish", "fish", "peanuts"];
  
  const allergenLabels: Record<Allergen, string> = {
    gluten: t("allergens.gluten", "Glutine"),
    dairy: t("allergens.dairy", "Latticini"),
    nuts: t("allergens.nuts", "Frutta a guscio"),
    eggs: t("allergens.eggs", "Uova"),
    soy: t("allergens.soy", "Soia"),
    shellfish: t("allergens.shellfish", "Crostacei"),
    fish: t("allergens.fish", "Pesce"),
    peanuts: t("allergens.peanuts", "Arachidi")
  };

  const getStatusColor = (status: "ok" | "low" | "critical"): "default" | "destructive" | "secondary" => {
    switch (status) {
      case "critical":
        return "destructive";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch("/api/inventory");
      if (!response.ok) throw new Error("Failed to fetch inventory");
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error(t("inventory.fetchError", "Errore nel caricamento dell'inventario"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async () => {
    try {
      // Validate required fields
      if (!newItem.name || !newItem.category || !newItem.unit) {
        toast.error(t("inventory.validationError", "Tutti i campi sono obbligatori"));
        return;
      }

      // Ensure quantity and minThreshold are numbers and not negative
      if (typeof newItem.quantity !== 'number' || typeof newItem.minThreshold !== 'number' || 
          newItem.minThreshold < 0) {
        toast.error(t("inventory.numberError", "Quantità e soglia minima devono essere numeri validi"));
        return;
      }

      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Add this to include cookies
        body: JSON.stringify(newItem),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add item");
      }

      const addedItem = await response.json();
      setInventory(prev => [...prev, addedItem]);
      setIsAddDialogOpen(false);
      setNewItem({
        name: "",
        category: "",
        quantity: 0,
        unit: "",
        minThreshold: 0,
        allergens: []
      });
      toast.success(t("inventory.addSuccess", "Articolo aggiunto con successo"));
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error(t("inventory.addError", "Errore nell'aggiunta dell'articolo"));
    }
  };

  const handleEditItem = async (id: string, updates: Partial<InventoryItem>) => {
    console.log(`***HANDLER INVOKED*** handleEditItem for item ${id}`);
    try {
      console.log(`Starting update for inventory item ${id}`);
      console.log(`Update payload original:`, updates);
      
      // Make sure allergenes is at least an empty array if undefined
      if (!updates.allergens) {
        updates.allergens = [];
        console.log("Allergens was undefined, setting to empty array");
      } else {
        console.log(`Allergens in payload: ${updates.allergens.length} items`, updates.allergens);
      }
      
      // Log the full request details to help debug
      console.log(`Making PATCH request to: /api/inventory/${id}`);
      console.log(`With headers:`, {
        "Content-Type": "application/json",
        credentials: "include"
      });
      console.log(`With body:`, JSON.stringify(updates, null, 2));
      
      const response = await fetch(`/api/inventory/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updates),
      });

      console.log(`PATCH response status: ${response.status}`);
      console.log(`PATCH response headers:`, response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("PATCH request failed with status:", response.status);
        console.error("Response text:", errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
          console.error("Parsed error data:", errorData);
        } catch (e) {
          console.error("Could not parse error response as JSON:", e);
          throw new Error(`Server returned ${response.status}: ${errorText}`);
        }
        
        throw new Error(errorData.message || `Failed to update item (${response.status})`);
      }

      const updatedItem = await response.json();
      console.log("Successfully updated item:", updatedItem);
      
      // Update inventory with the new item data
      setInventory(prev => {
        const newInventory = prev.map(item => 
          item.id === id ? updatedItem : item
        );
        console.log("Updated inventory state:", newInventory);
        return newInventory;
      });
      
      toast.success(t("inventory.updateSuccess", "Articolo aggiornato con successo"));
    } catch (error) {
      console.error("Error updating item:", error);
      // Show a more detailed error message
      if (error instanceof Error) {
        toast.error(`${t("inventory.updateError", "Errore nell'aggiornamento dell'articolo")}: ${error.message}`);
      } else {
        toast.error(t("inventory.updateError", "Errore nell'aggiornamento dell'articolo"));
      }
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to delete item");

      setInventory(prev => prev.filter(item => item.id !== id));
      toast.success(t("inventory.deleteSuccess", "Articolo eliminato con successo"));
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error(t("inventory.deleteError", "Errore nell'eliminazione dell'articolo"));
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Funzione per l'analisi degli allergeni
  const analyzeAllergens = async () => {
    if (selectedItems.length === 0) {
      toast.error(t("inventory.noItemsSelected", "Seleziona almeno un ingrediente da analizzare"));
      return;
    }

    setIsAnalyzing(true);

    try {
      const itemsToAnalyze = inventory.filter(item => selectedItems.includes(item.id));
      
      // Chiamata all'API di OpenAI per analizzare gli allergeni
      const analyzeWithOpenAI = async (ingredientNames: string[]): Promise<AllergenAnalysisResult[]> => {
        try {
          const response = await fetch("/api/analyze-allergens", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ ingredients: ingredientNames }),
          });
          
          if (!response.ok) {
            throw new Error("Errore nella chiamata all'API di analisi allergeni");
          }
          
          return await response.json();
        } catch (error) {
          console.error("Errore nella chiamata all'API OpenAI:", error);
          throw error;
        }
      };
      
      // Preparo la lista di nomi di ingredienti per l'analisi
      const ingredientNames = itemsToAnalyze.map(item => item.name);
      
      // Chiamata ad OpenAI
      const analysisResults: AllergenAnalysisResult[] = await analyzeWithOpenAI(ingredientNames);
      
      // Aggiorno l'inventario con i risultati dell'analisi
      const updatedInventory = inventory.map(item => {
        if (selectedItems.includes(item.id)) {
          // Cerco i risultati per questo ingrediente nell'analisi di OpenAI
          const analysis = analysisResults.find((result: AllergenAnalysisResult) => 
            result.ingredient.toLowerCase() === item.name.toLowerCase()
          );
          
          if (analysis && analysis.allergens) {
            // Converto gli allergeni identificati da OpenAI nel formato del nostro sistema
            const detectedAllergens: Allergen[] = [];
            
            if (analysis.allergens.gluten) detectedAllergens.push('gluten');
            if (analysis.allergens.dairy) detectedAllergens.push('dairy');
            if (analysis.allergens.nuts) detectedAllergens.push('nuts');
            if (analysis.allergens.eggs) detectedAllergens.push('eggs');
            if (analysis.allergens.soy) detectedAllergens.push('soy');
            if (analysis.allergens.shellfish) detectedAllergens.push('shellfish');
            if (analysis.allergens.fish) detectedAllergens.push('fish');
            if (analysis.allergens.peanuts) detectedAllergens.push('peanuts');
            
            return {
              ...item,
              allergens: Array.from(new Set([...(item.allergens || []), ...detectedAllergens]))
            };
          }
        }
        return item;
      });
      
      // Salvo le modifiche nel database
      try {
        // Per ogni ingrediente che ha allergeni, invio una richiesta PATCH
        await Promise.all(updatedInventory
          .filter(item => selectedItems.includes(item.id))
          .map(async (item) => {
            const response = await fetch(`/api/inventory/${item.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({ 
                allergens: item.allergens 
              }),
            });
            
            if (!response.ok) {
              throw new Error(`Errore nell'aggiornamento dell'ingrediente: ${item.name}`);
            }
            
            return response.json();
          })
        );
        
        // Aggiorno lo stato locale
        setInventory(updatedInventory);
        toast.success(t("inventory.analyzeSuccess", "Analisi degli allergeni completata con OpenAI e salvata nel database"));
      } catch (updateError) {
        console.error("Errore nel salvataggio degli allergeni:", updateError);
        toast.error(t("inventory.updateError", "Errore nel salvataggio degli allergeni nel database"));
        // Aggiorno comunque lo stato locale
        setInventory(updatedInventory);
      }
      
      setIsAllergenDialogOpen(false);
    } catch (error) {
      console.error("Error analyzing allergens:", error);
      toast.error(t("inventory.analyzeError", "Errore durante l'analisi degli allergeni con OpenAI"));
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{t("inventory.title", "Gestione Inventario")}</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                {t("inventory.addItem", "Aggiungi Articolo")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("inventory.addItem", "Aggiungi Articolo")}</DialogTitle>
                <DialogDescription>
                  {t("inventory.addItemDescription", "Inserisci i dettagli del nuovo articolo")}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    {t("inventory.itemName", "Nome Articolo")}
                  </Label>
                  <Input
                    id="name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    {t("inventory.category", "Categoria")}
                  </Label>
                  <Select
                    value={newItem.category}
                    onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={t("inventory.selectCategory", "Seleziona categoria")} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantity" className="text-right">
                    {t("inventory.quantity", "Quantità")}
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unit" className="text-right">
                    {t("inventory.unit", "Unità")}
                  </Label>
                  <Input
                    id="unit"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="minThreshold" className="text-right">
                    {t("inventory.minThreshold", "Soglia Minima")}
                  </Label>
                  <Input
                    id="minThreshold"
                    type="number"
                    value={newItem.minThreshold}
                    onChange={(e) => setNewItem({ ...newItem, minThreshold: Number(e.target.value) })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">
                    {t("inventory.allergens", "Allergeni")}
                  </Label>
                  <div className="col-span-3 grid grid-cols-2 gap-2">
                    {allergens.map((allergen) => (
                      <div key={allergen} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`allergen-${allergen}`}
                          checked={newItem.allergens?.includes(allergen)}
                          onCheckedChange={(checked) => {
                            const currentAllergens = newItem.allergens || [];
                            setNewItem({
                              ...newItem,
                              allergens: checked 
                                ? [...currentAllergens, allergen]
                                : currentAllergens.filter(a => a !== allergen)
                            });
                          }}
                        />
                        <label
                          htmlFor={`allergen-${allergen}`}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {allergenLabels[allergen]}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  {t("common.cancel", "Annulla")}
                </Button>
                <Button onClick={handleAddItem}>
                  {t("common.save", "Salva")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button 
            variant="outline" 
            className="ml-2"
            onClick={() => setIsAllergenDialogOpen(true)}
          >
            <Filter className="w-4 h-4 mr-2" />
            {t("inventory.analyzeAllergens", "Analizza Allergeni")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("inventory.currentStock", "Magazzino Attuale")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("inventory.searchPlaceholder", "Cerca articolo...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={t("inventory.filterByCategory", "Filtra per categoria")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("inventory.allCategories", "Tutte le categorie")}</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("inventory.itemName", "Nome Articolo")}</TableHead>
                  <TableHead>{t("inventory.category", "Categoria")}</TableHead>
                  <TableHead>{t("inventory.quantity", "Quantità")}</TableHead>
                  <TableHead>{t("inventory.unit", "Unità")}</TableHead>
                  <TableHead>{t("inventory.status", "Stato")}</TableHead>
                  <TableHead>{t("inventory.allergens", "Allergeni")}</TableHead>
                  <TableHead>{t("inventory.lastUpdated", "Ultimo Aggiornamento")}</TableHead>
                  <TableHead className="text-right">{t("common.actions", "Azioni")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(item.status)}>
                        {item.status === "critical" && <AlertTriangle className="w-4 h-4 mr-1" />}
                        {t(`inventory.status.${item.status}`, item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.allergens?.map(allergen => (
                          <Badge key={allergen} variant="outline" className="bg-red-100 border border-red-300 text-red-700 font-semibold py-1 px-2 text-xs">
                            {allergenLabels[allergen]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(item.lastUpdated).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem 
                            onClick={() => {
                              setEditingItem(item);
                              setIsEditDialogOpen(true);
                            }}
                            className="flex items-center cursor-pointer"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            {t("common.edit", "Modifica")}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteItem(item.id)}
                            className="flex items-center cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            {t("common.delete", "Elimina")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog per l'analisi degli allergeni */}
        <Dialog open={isAllergenDialogOpen} onOpenChange={setIsAllergenDialogOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{t("inventory.analyzeAllergens", "Analizza Allergeni")}</DialogTitle>
              <DialogDescription>
                {t("inventory.analyzeAllergensDescription", "Identifica gli allergeni nei tuoi ingredienti usando l'intelligenza artificiale")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedItems.length === inventory.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedItems(inventory.map(item => item.id));
                          } else {
                            setSelectedItems([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>{t("inventory.itemName", "Nome Articolo")}</TableHead>
                    <TableHead>{t("inventory.category", "Categoria")}</TableHead>
                    <TableHead>{t("inventory.allergens", "Allergeni")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedItems([...selectedItems, item.id]);
                            } else {
                              setSelectedItems(selectedItems.filter(id => id !== item.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.allergens?.map(allergen => (
                            <Badge key={allergen} variant="outline" className="bg-red-100 border border-red-300 text-red-700 font-semibold py-1 px-2 text-xs">
                              {allergenLabels[allergen]}
                            </Badge>
                          ))}
                          {(!item.allergens || item.allergens.length === 0) && (
                            <span className="text-sm text-muted-foreground italic">
                              {t("inventory.noAllergens", "Nessun allergene identificato")}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAllergenDialogOpen(false)}>
                {t("common.cancel", "Annulla")}
              </Button>
              <Button 
                onClick={analyzeAllergens} 
                disabled={isAnalyzing || selectedItems.length === 0}
                className="relative"
              >
                {isAnalyzing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary rounded-md">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  </div>
                )}
                {t("inventory.analyze", "Analizza")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("inventory.editItem", "Modifica Articolo")}</DialogTitle>
              <DialogDescription>
                {t("inventory.editItemDescription", "Modifica i dettagli dell'articolo")}
              </DialogDescription>
            </DialogHeader>
            {editingItem && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    {t("inventory.itemName", "Nome Articolo")}
                  </Label>
                  <Input
                    id="edit-name"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-category" className="text-right">
                    {t("inventory.category", "Categoria")}
                  </Label>
                  <Select
                    value={editingItem.category}
                    onValueChange={(value) => setEditingItem({ ...editingItem, category: value })}
                  >
                    <SelectTrigger className="col-span-3">
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
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-quantity" className="text-right">
                    {t("inventory.quantity", "Quantità")}
                  </Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: Number(e.target.value) })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-unit" className="text-right">
                    {t("inventory.unit", "Unità")}
                  </Label>
                  <Input
                    id="edit-unit"
                    value={editingItem.unit}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-minThreshold" className="text-right">
                    {t("inventory.minThreshold", "Soglia Minima")}
                  </Label>
                  <Input
                    id="edit-minThreshold"
                    type="number"
                    value={editingItem.minThreshold}
                    onChange={(e) => setEditingItem({ ...editingItem, minThreshold: Number(e.target.value) })}
                    className="col-span-3"
                  />
                </div>
                <div className="mt-4">
                  <Label>{t("inventory.allergens", "Allergeni")}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {allergens.map((allergen) => (
                      <Badge 
                        key={allergen} 
                        variant={editingItem?.allergens?.includes(allergen) ? "default" : "outline"}
                        className={`cursor-pointer text-sm font-medium py-1.5 px-3 ${
                          editingItem?.allergens?.includes(allergen) 
                            ? "bg-blue-600 hover:bg-blue-700 text-white" 
                            : "border-2 hover:bg-slate-100"
                        }`}
                        onClick={() => {
                          if (editingItem) {
                            const newAllergens = editingItem.allergens?.includes(allergen)
                              ? editingItem.allergens.filter(a => a !== allergen)
                              : [...(editingItem.allergens || []), allergen];
                            setEditingItem({ ...editingItem, allergens: newAllergens });
                          }
                        }}
                      >
                        {allergenLabels[allergen]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                setEditingItem(null);
              }}>
                {t("common.cancel", "Annulla")}
              </Button>
              <Button onClick={() => {
                if (editingItem) {
                  console.log("Save button clicked, data:", editingItem);
                  
                  // Validate required fields
                  if (!editingItem.name || !editingItem.category || !editingItem.unit) {
                    toast.error(t("inventory.validationError", "Tutti i campi sono obbligatori"));
                    return;
                  }

                  // Ensure quantity and minThreshold are numbers and not negative
                  if (isNaN(editingItem.quantity) || isNaN(editingItem.minThreshold) || 
                      editingItem.minThreshold < 0) {
                    toast.error(t("inventory.numberError", "Quantità e soglia minima devono essere numeri validi"));
                    return;
                  }

                  // Create a payload object with only the fields we want to update
                  const payload = {
                    name: editingItem.name,
                    category: editingItem.category,
                    quantity: editingItem.quantity,
                    unit: editingItem.unit,
                    minThreshold: editingItem.minThreshold,
                    allergens: editingItem.allergens || []
                  };
                  
                  console.log("Save button in DialogFooter: Sending PATCH with payload:", payload);
                  
                  // First close the dialog, then update the item
                  const itemId = editingItem.id;
                  setIsEditDialogOpen(false);
                  setEditingItem(null);
                  
                  // Call handleEditItem directly
                  handleEditItem(itemId, payload);
                }
              }}>
                {t("common.save", "Salva")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
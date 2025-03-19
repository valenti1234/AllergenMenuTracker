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
import { Badge } from "@/components/ui/badge";
import { Search, Plus, AlertTriangle, Pencil, Trash } from "lucide-react";
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

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  lastUpdated: string;
  status: "ok" | "low" | "critical";
}

export default function Inventory() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: "",
    category: "",
    quantity: 0,
    unit: "",
    minThreshold: 0
  });
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const categories = ["Ingredienti base", "Conserve", "Latticini", "Carni", "Verdure", "Spezie"];

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
          newItem.quantity < 0 || newItem.minThreshold < 0) {
        toast.error(t("inventory.numberError", "Quantità e soglia minima devono essere numeri positivi"));
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
        minThreshold: 0
      });
      toast.success(t("inventory.addSuccess", "Articolo aggiunto con successo"));
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error(t("inventory.addError", "Errore nell'aggiunta dell'articolo"));
    }
  };

  const handleEditItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update item");
      }

      const updatedItem = await response.json();
      setInventory(prev => prev.map(item => 
        item.id === id ? updatedItem : item
      ));
      setIsEditDialogOpen(false);
      setEditingItem(null);
      toast.success(t("inventory.updateSuccess", "Articolo aggiornato con successo"));
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error(t("inventory.updateError", "Errore nell'aggiornamento dell'articolo"));
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
                    <TableCell>{new Date(item.lastUpdated).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setEditingItem(item);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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
                  // Validate required fields
                  if (!editingItem.name || !editingItem.category || !editingItem.unit) {
                    toast.error(t("inventory.validationError", "Tutti i campi sono obbligatori"));
                    return;
                  }

                  // Ensure quantity and minThreshold are numbers and not negative
                  if (typeof editingItem.quantity !== 'number' || typeof editingItem.minThreshold !== 'number' || 
                      editingItem.quantity < 0 || editingItem.minThreshold < 0) {
                    toast.error(t("inventory.numberError", "Quantità e soglia minima devono essere numeri positivi"));
                    return;
                  }

                  handleEditItem(editingItem.id, {
                    name: editingItem.name,
                    category: editingItem.category,
                    quantity: editingItem.quantity,
                    unit: editingItem.unit,
                    minThreshold: editingItem.minThreshold
                  });
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
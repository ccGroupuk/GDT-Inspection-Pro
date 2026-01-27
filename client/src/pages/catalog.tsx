import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Plus, 
  Search, 
  Package, 
  FolderOpen, 
  Edit, 
  Trash2, 
  Clock, 
  Wrench, 
  ShoppingBag, 
  Box,
  Building2,
  Star,
  Loader2,
  ExternalLink,
} from "lucide-react";
import type { ProductCategory, CatalogItem, InsertProductCategory, InsertCatalogItem, Supplier, SupplierCatalogItem } from "@shared/schema";

const ITEM_TYPES = [
  { value: "product", label: "Product", icon: Package },
  { value: "labour", label: "Labour", icon: Clock },
  { value: "material", label: "Material", icon: Box },
  { value: "consumable", label: "Consumable", icon: ShoppingBag },
] as const;

const UNITS_OF_MEASURE = [
  { value: "each", label: "Each" },
  { value: "hour", label: "Hour" },
  { value: "day", label: "Day" },
  { value: "metre", label: "Metre" },
  { value: "sqm", label: "Square Metre" },
  { value: "litre", label: "Litre" },
  { value: "kg", label: "Kilogram" },
  { value: "set", label: "Set" },
  { value: "pack", label: "Pack" },
  { value: "fixed", label: "Fixed Price" },
] as const;

const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  displayOrder: z.coerce.number().optional(),
  isActive: z.boolean().optional(),
});

const itemFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  type: z.string().default("product"),
  sku: z.string().optional(),
  unitPrice: z.coerce.number().min(0, "Price must be positive"),
  unitOfMeasure: z.string().default("each"),
  defaultQuantity: z.coerce.number().min(0).default(1),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;
type ItemFormData = z.infer<typeof itemFormSchema>;

export default function Catalog() {
  const [activeTab, setActiveTab] = useState("items");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  
  const { toast } = useToast();

  const { data: categories = [], isLoading: loadingCategories } = useQuery<ProductCategory[]>({
    queryKey: ["/api/product-categories"],
  });

  const { data: items = [], isLoading: loadingItems } = useQuery<CatalogItem[]>({
    queryKey: ["/api/catalog-items"],
  });

  // Suppliers for linking
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  // Supplier links for the currently editing item
  const { data: itemSuppliers = [], isLoading: loadingItemSuppliers } = useQuery<SupplierCatalogItem[]>({
    queryKey: ["/api/catalog-items", editingItem?.id, "suppliers"],
    queryFn: async () => {
      if (!editingItem?.id) return [];
      const res = await fetch(`/api/catalog-items/${editingItem.id}/suppliers`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!editingItem?.id,
  });

  // State for adding new supplier link
  const [addingSupplier, setAddingSupplier] = useState(false);
  const [newSupplierLink, setNewSupplierLink] = useState<{
    supplierId: string;
    supplierPrice: string;
    supplierSku: string;
  }>({ supplierId: "", supplierPrice: "", supplierSku: "" });

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      displayOrder: 0,
      isActive: true,
    },
  });

  const itemForm = useForm<ItemFormData>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: null,
      type: "product",
      sku: "",
      unitPrice: 0,
      unitOfMeasure: "each",
      defaultQuantity: 1,
      isActive: true,
      notes: "",
    },
  });

  const categoryMutation = useMutation({
    mutationFn: async (values: CategoryFormData) => {
      if (editingCategory) {
        return apiRequest("PATCH", `/api/product-categories/${editingCategory.id}`, values);
      }
      return apiRequest("POST", "/api/product-categories", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-categories"] });
      toast({
        title: editingCategory ? "Category Updated" : "Category Created",
        description: `Category has been ${editingCategory ? "updated" : "created"} successfully.`,
      });
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      categoryForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save category. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/product-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-categories"] });
      toast({ title: "Category Deleted" });
    },
  });

  const itemMutation = useMutation({
    mutationFn: async (values: ItemFormData) => {
      if (editingItem) {
        return apiRequest("PATCH", `/api/catalog-items/${editingItem.id}`, values);
      }
      return apiRequest("POST", "/api/catalog-items", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalog-items"] });
      toast({
        title: editingItem ? "Item Updated" : "Item Created",
        description: `Catalog item has been ${editingItem ? "updated" : "created"} successfully.`,
      });
      setIsItemDialogOpen(false);
      setEditingItem(null);
      itemForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/catalog-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalog-items"] });
      toast({ title: "Item Deleted" });
    },
  });

  // Supplier link mutations
  const addSupplierLinkMutation = useMutation({
    mutationFn: async (data: { supplierId: string; catalogItemId: string; supplierPrice?: string; supplierSku?: string }) => {
      return apiRequest("POST", "/api/supplier-catalog-items", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalog-items", editingItem?.id, "suppliers"] });
      setAddingSupplier(false);
      setNewSupplierLink({ supplierId: "", supplierPrice: "", supplierSku: "" });
      toast({ title: "Supplier linked", description: "Supplier has been linked to this item." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to link supplier.", variant: "destructive" });
    },
  });

  const removeSupplierLinkMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/supplier-catalog-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalog-items", editingItem?.id, "suppliers"] });
      toast({ title: "Supplier removed", description: "Supplier link has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove supplier link.", variant: "destructive" });
    },
  });

  const handleAddSupplierLink = () => {
    if (!editingItem?.id || !newSupplierLink.supplierId) return;
    addSupplierLinkMutation.mutate({
      catalogItemId: editingItem.id,
      supplierId: newSupplierLink.supplierId,
      supplierPrice: newSupplierLink.supplierPrice || undefined,
      supplierSku: newSupplierLink.supplierSku || undefined,
    });
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || "Unknown Supplier";
  };

  const openEditCategory = (category: ProductCategory) => {
    setEditingCategory(category);
    categoryForm.reset({
      name: category.name,
      description: category.description || "",
      displayOrder: category.displayOrder || 0,
      isActive: category.isActive ?? true,
    });
    setIsCategoryDialogOpen(true);
  };

  const openCreateCategory = () => {
    setEditingCategory(null);
    categoryForm.reset({
      name: "",
      description: "",
      displayOrder: 0,
      isActive: true,
    });
    setIsCategoryDialogOpen(true);
  };

  const openEditItem = (item: CatalogItem) => {
    setEditingItem(item);
    itemForm.reset({
      name: item.name,
      description: item.description || "",
      categoryId: item.categoryId || null,
      type: item.type || "product",
      sku: item.sku || "",
      unitPrice: parseFloat(String(item.unitPrice)) || 0,
      unitOfMeasure: item.unitOfMeasure || "each",
      defaultQuantity: parseFloat(String(item.defaultQuantity)) || 1,
      isActive: item.isActive ?? true,
      notes: "",
    });
    setIsItemDialogOpen(true);
  };

  const openCreateItem = () => {
    setEditingItem(null);
    itemForm.reset({
      name: "",
      description: "",
      categoryId: null,
      type: "product",
      sku: "",
      unitPrice: 0,
      unitOfMeasure: "each",
      defaultQuantity: 1,
      isActive: true,
      notes: "",
    });
    setIsItemDialogOpen(true);
  };

  const filteredItems = items.filter((item) => {
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    if (categoryFilter !== "all" && item.categoryId !== categoryFilter) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.sku?.toLowerCase().includes(query)
    );
  });

  const getTypeIcon = (type: string) => {
    const typeInfo = ITEM_TYPES.find((t) => t.value === type);
    return typeInfo?.icon || Package;
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "Unknown";
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Product Catalog</h1>
          <p className="text-muted-foreground">
            Manage products, labour charges, materials and consumables for quick quote building
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="items" data-testid="tab-items">
            <Package className="w-4 h-4 mr-2" />
            Catalog Items ({items.length})
          </TabsTrigger>
          <TabsTrigger value="categories" data-testid="tab-categories">
            <FolderOpen className="w-4 h-4 mr-2" />
            Categories ({categories.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap space-y-0 pb-4">
              <div className="flex items-center gap-4 flex-wrap flex-1">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-items"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40" data-testid="select-type-filter">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {ITEM_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48" data-testid="select-category-filter">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={openCreateItem} className="gap-2" data-testid="button-add-item">
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              {loadingItems ? (
                <div className="py-8 text-center text-muted-foreground">Loading items...</div>
              ) : filteredItems.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="No catalog items"
                  description="Add products, labour charges, materials and consumables to your catalog for quick quote building."
                  action={{
                    label: "Add First Item",
                    onClick: openCreateItem,
                  }}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const TypeIcon = getTypeIcon(item.type);
                      return (
                        <TableRow key={item.id} data-testid={`row-catalog-item-${item.id}`}>
                          <TableCell>
                            {(() => {
                              const productUrl = item.description?.match(/URL:\s*(https?:\/\/[^\s|]+)/i)?.[1];
                              return (
                                <div className="flex items-center gap-2">
                                  <div>
                                    <div className="font-medium">{item.name}</div>
                                    {item.sku && (
                                      <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                                    )}
                                  </div>
                                  {productUrl && (
                                    <a
                                      href={productUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-muted-foreground hover:text-foreground"
                                      data-testid={`link-product-${item.id}`}
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  )}
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              <TypeIcon className="w-3 h-3" />
                              {ITEM_TYPES.find((t) => t.value === item.type)?.label || item.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{getCategoryName(item.categoryId)}</TableCell>
                          <TableCell className="font-medium">
                            {"\u00A3"}{parseFloat(String(item.unitPrice)).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {UNITS_OF_MEASURE.find((u) => u.value === item.unitOfMeasure)?.label || item.unitOfMeasure}
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.isActive ? "default" : "secondary"}>
                              {item.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditItem(item)}
                                data-testid={`button-edit-item-${item.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteItemMutation.mutate(item.id)}
                                data-testid={`button-delete-item-${item.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
              <CardTitle>Categories</CardTitle>
              <Button onClick={openCreateCategory} className="gap-2" data-testid="button-add-category">
                <Plus className="w-4 h-4" />
                Add Category
              </Button>
            </CardHeader>
            <CardContent>
              {loadingCategories ? (
                <div className="py-8 text-center text-muted-foreground">Loading categories...</div>
              ) : categories.length === 0 ? (
                <EmptyState
                  icon={FolderOpen}
                  title="No categories"
                  description="Create categories to organize your catalog items."
                  action={{
                    label: "Add First Category",
                    onClick: openCreateCategory,
                  }}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => {
                      const itemCount = items.filter((i) => i.categoryId === category.id).length;
                      return (
                        <TableRow key={category.id} data-testid={`row-category-${category.id}`}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {category.description || "-"}
                          </TableCell>
                          <TableCell>{itemCount}</TableCell>
                          <TableCell>
                            <Badge variant={category.isActive ? "default" : "secondary"}>
                              {category.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditCategory(category)}
                                data-testid={`button-edit-category-${category.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteCategoryMutation.mutate(category.id)}
                                disabled={itemCount > 0}
                                data-testid={`button-delete-category-${category.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={categoryForm.handleSubmit((data) => categoryMutation.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                {...categoryForm.register("name")}
                placeholder="e.g. Media Wall Packages"
                data-testid="input-category-name"
              />
              {categoryForm.formState.errors.name && (
                <p className="text-xs text-destructive">{categoryForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                {...categoryForm.register("description")}
                placeholder="Optional description"
                data-testid="input-category-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                {...categoryForm.register("displayOrder")}
                type="number"
                placeholder="0"
                data-testid="input-category-order"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={categoryForm.watch("isActive") ?? true}
                onCheckedChange={(checked) => categoryForm.setValue("isActive", checked)}
                data-testid="switch-category-active"
              />
              <Label>Active</Label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCategoryDialogOpen(false)}
                data-testid="button-cancel-category"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={categoryMutation.isPending}
                data-testid="button-save-category"
              >
                {categoryMutation.isPending ? "Saving..." : editingCategory ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add Catalog Item"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={itemForm.handleSubmit((data) => itemMutation.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  {...itemForm.register("name")}
                  placeholder="e.g. Media Wall Installation"
                  data-testid="input-item-name"
                />
                {itemForm.formState.errors.name && (
                  <p className="text-xs text-destructive">{itemForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  {...itemForm.register("sku")}
                  placeholder="Optional product code"
                  data-testid="input-item-sku"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={itemForm.watch("type") || "product"}
                  onValueChange={(value) => itemForm.setValue("type", value)}
                >
                  <SelectTrigger data-testid="select-item-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <Select
                  value={itemForm.watch("categoryId") || "uncategorized"}
                  onValueChange={(value) => itemForm.setValue("categoryId", value === "uncategorized" ? null : value)}
                >
                  <SelectTrigger data-testid="select-item-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncategorized">Uncategorized</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                {...itemForm.register("description")}
                placeholder="Detailed description for quotes"
                data-testid="input-item-description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price ({"\u00A3"}) *</Label>
                <Input
                  {...itemForm.register("unitPrice")}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  data-testid="input-item-price"
                />
                {itemForm.formState.errors.unitPrice && (
                  <p className="text-xs text-destructive">{itemForm.formState.errors.unitPrice.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitOfMeasure">Unit of Measure</Label>
                <Select
                  value={itemForm.watch("unitOfMeasure") || "each"}
                  onValueChange={(value) => itemForm.setValue("unitOfMeasure", value)}
                >
                  <SelectTrigger data-testid="select-item-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS_OF_MEASURE.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultQuantity">Default Quantity</Label>
                <Input
                  {...itemForm.register("defaultQuantity")}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1"
                  data-testid="input-item-quantity"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                {...itemForm.register("notes")}
                placeholder="Notes for staff only (not shown on quotes)"
                data-testid="input-item-notes"
              />
            </div>

            {/* Suppliers Section - only shown when editing existing item */}
            {editingItem && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between gap-4">
                  <Label className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Linked Suppliers
                  </Label>
                  {!addingSupplier && suppliers.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAddingSupplier(true)}
                      data-testid="button-add-supplier-link"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Link Supplier
                    </Button>
                  )}
                </div>

                {loadingItemSuppliers ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : itemSuppliers.length === 0 && !addingSupplier ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No suppliers linked to this item yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {itemSuppliers.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between gap-4 p-3 bg-muted/50 rounded-md"
                        data-testid={`supplier-link-${link.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm flex items-center gap-2">
                            {getSupplierName(link.supplierId)}
                            {link.isPreferred && (
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                            {link.supplierSku && <span>SKU: {link.supplierSku}</span>}
                            {link.supplierPrice && (
                              <span>Cost: {"\u00A3"}{parseFloat(String(link.supplierPrice)).toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeSupplierLinkMutation.mutate(link.id)}
                          disabled={removeSupplierLinkMutation.isPending}
                          data-testid={`button-remove-supplier-${link.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add supplier form */}
                {addingSupplier && (
                  <div className="p-3 border rounded-md space-y-3 bg-muted/30">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Supplier *</Label>
                        <Select
                          value={newSupplierLink.supplierId}
                          onValueChange={(value) => setNewSupplierLink({ ...newSupplierLink, supplierId: value })}
                        >
                          <SelectTrigger data-testid="select-new-supplier">
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers
                              .filter(s => !itemSuppliers.some(link => link.supplierId === s.id))
                              .map((supplier) => (
                                <SelectItem key={supplier.id} value={supplier.id}>
                                  {supplier.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Supplier SKU</Label>
                        <Input
                          value={newSupplierLink.supplierSku}
                          onChange={(e) => setNewSupplierLink({ ...newSupplierLink, supplierSku: e.target.value })}
                          placeholder="Supplier's product code"
                          data-testid="input-supplier-sku"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Cost Price ({"\u00A3"})</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newSupplierLink.supplierPrice}
                          onChange={(e) => setNewSupplierLink({ ...newSupplierLink, supplierPrice: e.target.value })}
                          placeholder="0.00"
                          data-testid="input-supplier-cost"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAddingSupplier(false);
                          setNewSupplierLink({ supplierId: "", supplierPrice: "", supplierSku: "" });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddSupplierLink}
                        disabled={!newSupplierLink.supplierId || addSupplierLinkMutation.isPending}
                        data-testid="button-save-supplier-link"
                      >
                        {addSupplierLinkMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        ) : null}
                        Add Link
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                checked={itemForm.watch("isActive") ?? true}
                onCheckedChange={(checked) => itemForm.setValue("isActive", checked)}
                data-testid="switch-item-active"
              />
              <Label>Active</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsItemDialogOpen(false)}
                data-testid="button-cancel-item"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={itemMutation.isPending}
                data-testid="button-save-item"
              >
                {itemMutation.isPending ? "Saving..." : editingItem ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

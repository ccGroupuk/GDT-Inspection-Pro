import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  DialogFooter,
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
  FileText, 
  Edit, 
  Trash2, 
  Copy,
  Package,
  GripVertical,
  X,
} from "lucide-react";
import type { QuoteTemplate, CatalogItem, ProductCategory } from "@shared/schema";

type QuoteTemplateItem = {
  id?: string;
  catalogItemId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  sortOrder: number;
};

type TemplateWithItems = QuoteTemplate & {
  items: QuoteTemplateItem[];
};

const templateFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

export default function QuoteTemplates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateWithItems | null>(null);
  const [templateItems, setTemplateItems] = useState<QuoteTemplateItem[]>([]);
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);
  
  const { toast } = useToast();

  const { data: templates = [], isLoading } = useQuery<QuoteTemplate[]>({
    queryKey: ["/api/quote-templates"],
  });

  const { data: catalogItems = [] } = useQuery<CatalogItem[]>({
    queryKey: ["/api/catalog-items"],
  });

  const { data: categories = [] } = useQuery<ProductCategory[]>({
    queryKey: ["/api/product-categories"],
  });

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: null,
      isActive: true,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: TemplateFormData) => {
      const payload = {
        ...values,
        items: templateItems.map((item, index) => ({
          catalogItemId: item.catalogItemId,
          description: item.description,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
          sortOrder: index,
        })),
      };
      
      if (editingTemplate) {
        return apiRequest("PATCH", `/api/quote-templates/${editingTemplate.id}`, payload);
      }
      return apiRequest("POST", "/api/quote-templates", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quote-templates"] });
      toast({
        title: editingTemplate ? "Template Updated" : "Template Created",
        description: `Quote template has been ${editingTemplate ? "updated" : "created"} successfully.`,
      });
      setIsDialogOpen(false);
      setEditingTemplate(null);
      setTemplateItems([]);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/quote-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quote-templates"] });
      toast({ title: "Template Deleted" });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (template: QuoteTemplate) => {
      const response = await fetch(`/api/quote-templates/${template.id}`);
      const fullTemplate = await response.json() as TemplateWithItems;
      
      return apiRequest("POST", "/api/quote-templates", {
        name: `${template.name} (Copy)`,
        description: template.description,
        categoryId: template.categoryId,
        isActive: true,
        items: fullTemplate.items?.map((item: QuoteTemplateItem, index: number) => ({
          catalogItemId: item.catalogItemId,
          description: item.description,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
          sortOrder: index,
        })) || [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quote-templates"] });
      toast({ title: "Template Duplicated" });
    },
  });

  const openEditTemplate = async (template: QuoteTemplate) => {
    try {
      const response = await fetch(`/api/quote-templates/${template.id}`);
      const fullTemplate = await response.json() as TemplateWithItems;
      
      setEditingTemplate(fullTemplate);
      form.reset({
        name: fullTemplate.name,
        description: fullTemplate.description || "",
        categoryId: fullTemplate.categoryId || null,
        isActive: fullTemplate.isActive ?? true,
      });
      setTemplateItems(
        fullTemplate.items?.map((item: QuoteTemplateItem) => ({
          id: item.id,
          catalogItemId: item.catalogItemId,
          description: item.description,
          quantity: parseFloat(String(item.quantity)),
          unitPrice: parseFloat(String(item.unitPrice)),
          sortOrder: item.sortOrder,
        })) || []
      );
      setIsDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load template details.",
        variant: "destructive",
      });
    }
  };

  const openCreateTemplate = () => {
    setEditingTemplate(null);
    form.reset({
      name: "",
      description: "",
      categoryId: null,
      isActive: true,
    });
    setTemplateItems([]);
    setIsDialogOpen(true);
  };

  const addCatalogItemToTemplate = (item: CatalogItem) => {
    const newItem: QuoteTemplateItem = {
      catalogItemId: item.id,
      description: item.name,
      quantity: parseFloat(String(item.defaultQuantity)) || 1,
      unitPrice: parseFloat(String(item.unitPrice)) || 0,
      sortOrder: templateItems.length,
    };
    setTemplateItems([...templateItems, newItem]);
    setShowCatalogPicker(false);
  };

  const addManualItem = () => {
    const newItem: QuoteTemplateItem = {
      catalogItemId: null,
      description: "",
      quantity: 1,
      unitPrice: 0,
      sortOrder: templateItems.length,
    };
    setTemplateItems([...templateItems, newItem]);
  };

  const updateTemplateItem = (index: number, updates: Partial<QuoteTemplateItem>) => {
    const updated = [...templateItems];
    updated[index] = { ...updated[index], ...updates };
    setTemplateItems(updated);
  };

  const removeTemplateItem = (index: number) => {
    setTemplateItems(templateItems.filter((_, i) => i !== index));
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === templateItems.length - 1)
    ) {
      return;
    }
    const newIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...templateItems];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setTemplateItems(updated);
  };

  const filteredTemplates = templates.filter((template) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query)
    );
  });

  const calculateTemplateTotal = (items: QuoteTemplateItem[]) => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const groupedCatalogItems = catalogItems.reduce((acc, item) => {
    const categoryId = item.categoryId || "uncategorized";
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(item);
    return acc;
  }, {} as Record<string, CatalogItem[]>);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Quote Templates</h1>
          <p className="text-muted-foreground">
            Create reusable quote packages for common jobs
          </p>
        </div>
        <Button onClick={openCreateTemplate} className="gap-2" data-testid="button-add-template">
          <Plus className="w-4 h-4" />
          Create Template
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-templates"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading templates...</div>
          ) : filteredTemplates.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No quote templates"
              description="Create templates for common jobs like media walls or under-stairs storage to speed up quoting."
              action={{
                label: "Create First Template",
                onClick: openCreateTemplate,
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="hover-elevate" data-testid={`card-template-${template.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{template.name}</CardTitle>
                        {template.categoryId && (
                          <Badge variant="outline" className="mt-1">
                            {categories.find(c => c.id === template.categoryId)?.name || "Uncategorized"}
                          </Badge>
                        )}
                      </div>
                      <Badge variant={template.isActive ? "default" : "secondary"}>
                        {template.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {template.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {template.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditTemplate(template)}
                          data-testid={`button-edit-template-${template.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => duplicateMutation.mutate(template)}
                          data-testid={`button-duplicate-template-${template.id}`}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(template.id)}
                          data-testid={`button-delete-template-${template.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Create Quote Template"}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  {...form.register("name")}
                  placeholder="e.g. Media Wall Package - Premium"
                  data-testid="input-template-name"
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <Select
                  value={form.watch("categoryId") || "none"}
                  onValueChange={(value) => form.setValue("categoryId", value === "none" ? null : value)}
                >
                  <SelectTrigger data-testid="select-template-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Category</SelectItem>
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
                {...form.register("description")}
                placeholder="Describe what this template includes"
                data-testid="input-template-description"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={form.watch("isActive") ?? true}
                onCheckedChange={(checked) => form.setValue("isActive", checked)}
                data-testid="switch-template-active"
              />
              <Label>Active</Label>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Template Items</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addManualItem}
                    data-testid="button-add-manual-item"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Manual Item
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setShowCatalogPicker(true)}
                    data-testid="button-add-catalog-item"
                  >
                    <Package className="w-4 h-4 mr-1" />
                    From Catalog
                  </Button>
                </div>
              </div>

              {templateItems.length === 0 ? (
                <div className="border border-dashed rounded-md p-6 text-center text-muted-foreground">
                  Add items from your catalog or create manual line items
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-24">Qty</TableHead>
                      <TableHead className="w-32">Unit Price</TableHead>
                      <TableHead className="w-32 text-right">Total</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templateItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.description}
                            onChange={(e) => updateTemplateItem(index, { description: e.target.value })}
                            placeholder="Item description"
                            data-testid={`input-item-description-${index}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => updateTemplateItem(index, { quantity: parseFloat(e.target.value) || 0 })}
                            data-testid={`input-item-quantity-${index}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{"\u00A3"}</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => updateTemplateItem(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                              className="pl-7"
                              data-testid={`input-item-price-${index}`}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {"\u00A3"}{(item.quantity * item.unitPrice).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeTemplateItem(index)}
                            data-testid={`button-remove-item-${index}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-semibold">
                        Template Total:
                      </TableCell>
                      <TableCell className="text-right font-bold text-lg">
                        {"\u00A3"}{calculateTemplateTotal(templateItems).toFixed(2)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                data-testid="button-cancel-template"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                data-testid="button-save-template"
              >
                {saveMutation.isPending ? "Saving..." : editingTemplate ? "Update Template" : "Create Template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showCatalogPicker} onOpenChange={setShowCatalogPicker}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add from Catalog</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {Object.entries(groupedCatalogItems).map(([categoryId, items]) => {
              const category = categories.find((c) => c.id === categoryId);
              const categoryName = category?.name || "Uncategorized";
              
              return (
                <div key={categoryId}>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">{categoryName}</h3>
                  <div className="space-y-1">
                    {items.filter((item) => item.isActive).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-md hover-elevate cursor-pointer"
                        onClick={() => addCatalogItemToTemplate(item)}
                        data-testid={`catalog-item-${item.id}`}
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {"\u00A3"}{parseFloat(String(item.unitPrice)).toFixed(2)} / {item.unitOfMeasure}
                          </p>
                        </div>
                        <Plus className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

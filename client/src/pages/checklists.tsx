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
import { Checkbox } from "@/components/ui/checkbox";
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
  ClipboardCheck, 
  Edit, 
  Trash2, 
  Copy,
  GripVertical,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import type { ChecklistTemplate, ChecklistItem, ChecklistInstance } from "@shared/schema";

type TemplateWithItems = ChecklistTemplate & {
  items: ChecklistItem[];
};

type ChecklistItemInput = {
  label: string;
  itemType: string;
  isRequired: boolean;
  helpText?: string;
};

const templateFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").regex(/^[a-z_]+$/, "Code must be lowercase with underscores only"),
  description: z.string().optional(),
  targetType: z.string().min(1, "Target type is required"),
  isActive: z.boolean().optional(),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

const targetTypeLabels: Record<string, string> = {
  job: "Job",
  job_emergency: "Emergency Call-out",
  asset_tool: "Tool Check",
  asset_vehicle: "Vehicle Check",
  payroll: "Payroll",
  team_paid: "Team Paid Confirmation",
};

const itemTypeLabels: Record<string, string> = {
  checkbox: "Checkbox (Yes/No)",
  text: "Text Input",
  photo: "Photo Upload",
  signature: "Signature",
  number: "Number Input",
};

export default function Checklists() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateWithItems | null>(null);
  const [templateItems, setTemplateItems] = useState<ChecklistItemInput[]>([]);
  const [activeTab, setActiveTab] = useState<"templates" | "instances">("templates");
  
  const { toast } = useToast();

  const { data: templates = [], isLoading: loadingTemplates } = useQuery<ChecklistTemplate[]>({
    queryKey: ["/api/checklist-templates"],
  });

  const { data: instances = [], isLoading: loadingInstances } = useQuery<ChecklistInstance[]>({
    queryKey: ["/api/checklist-instances"],
  });

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      targetType: "job",
      isActive: true,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: TemplateFormData) => {
      const payload = {
        ...values,
        items: templateItems.map((item, index) => ({
          label: item.label,
          itemType: item.itemType,
          isRequired: item.isRequired,
          helpText: item.helpText,
          itemOrder: index,
        })),
      };
      
      if (editingTemplate) {
        return apiRequest("PATCH", `/api/checklist-templates/${editingTemplate.id}`, payload);
      }
      return apiRequest("POST", "/api/checklist-templates", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates"] });
      toast({
        title: editingTemplate ? "Template Updated" : "Template Created",
        description: `Checklist template has been ${editingTemplate ? "updated" : "created"} successfully.`,
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
      return apiRequest("DELETE", `/api/checklist-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates"] });
      toast({ title: "Template Deleted" });
    },
  });

  const openEditTemplate = async (template: ChecklistTemplate) => {
    try {
      const response = await fetch(`/api/checklist-templates/${template.id}`);
      const fullTemplate = await response.json() as TemplateWithItems;
      
      setEditingTemplate(fullTemplate);
      form.reset({
        name: fullTemplate.name,
        code: fullTemplate.code,
        description: fullTemplate.description || "",
        targetType: fullTemplate.targetType,
        isActive: fullTemplate.isActive ?? true,
      });
      setTemplateItems(
        fullTemplate.items?.map((item) => ({
          label: item.label,
          itemType: item.itemType,
          isRequired: item.isRequired ?? true,
          helpText: item.helpText || "",
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
      code: "",
      description: "",
      targetType: "job",
      isActive: true,
    });
    setTemplateItems([]);
    setIsDialogOpen(true);
  };

  const addItem = () => {
    setTemplateItems([
      ...templateItems,
      {
        label: "",
        itemType: "checkbox",
        isRequired: true,
        helpText: "",
      },
    ]);
  };

  const updateItem = (index: number, updates: Partial<ChecklistItemInput>) => {
    const updated = [...templateItems];
    updated[index] = { ...updated[index], ...updates };
    setTemplateItems(updated);
  };

  const removeItem = (index: number) => {
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
      template.code.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"><AlertTriangle className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Mandatory Checklists</h1>
          <p className="text-muted-foreground">
            Non-negotiable compliance checklists for jobs, tools, vehicles, and payroll
          </p>
        </div>
        {activeTab === "templates" && (
          <Button onClick={openCreateTemplate} className="gap-2" data-testid="button-add-checklist">
            <Plus className="w-4 h-4" />
            Create Checklist
          </Button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === "templates" ? "default" : "outline"}
          onClick={() => setActiveTab("templates")}
          className="gap-2"
          data-testid="tab-templates"
        >
          <ClipboardCheck className="w-4 h-4" />
          Templates
        </Button>
        <Button
          variant={activeTab === "instances" ? "default" : "outline"}
          onClick={() => setActiveTab("instances")}
          className="gap-2"
          data-testid="tab-instances"
        >
          <ShieldCheck className="w-4 h-4" />
          Active Checklists
        </Button>
      </div>

      {activeTab === "templates" && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search checklists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-checklists"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingTemplates ? (
              <div className="py-8 text-center text-muted-foreground">Loading checklists...</div>
            ) : filteredTemplates.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title="No checklist templates"
                description="Create mandatory checklists to ensure compliance for emergency jobs, tool checks, and more."
                action={{
                  label: "Create First Checklist",
                  onClick: openCreateTemplate,
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover-elevate" data-testid={`card-checklist-${template.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{template.name}</CardTitle>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {targetTypeLabels[template.targetType] || template.targetType}
                            </Badge>
                            <Badge variant="secondary" className="text-xs font-mono">
                              {template.code}
                            </Badge>
                          </div>
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
                            data-testid={`button-edit-checklist-${template.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(template.id)}
                            data-testid={`button-delete-checklist-${template.id}`}
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
      )}

      {activeTab === "instances" && (
        <Card>
          <CardHeader>
            <CardTitle>Active Checklist Instances</CardTitle>
            <CardDescription>
              View all pending and in-progress checklists across jobs and assets
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingInstances ? (
              <div className="py-8 text-center text-muted-foreground">Loading instances...</div>
            ) : instances.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="No active checklists"
                description="Checklists will appear here when created for jobs, assets, or payroll."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Target</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instances.map((instance) => {
                    const template = templates.find(t => t.id === instance.templateId);
                    return (
                      <TableRow key={instance.id} data-testid={`row-instance-${instance.id}`}>
                        <TableCell>
                          <Badge variant="outline">
                            {instance.targetType}: {instance.targetId?.slice(0, 8)}...
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {template?.name || "Unknown Template"}
                        </TableCell>
                        <TableCell>{getStatusBadge(instance.status || "pending")}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {instance.createdAt ? new Date(instance.createdAt).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {instance.dueDate ? new Date(instance.dueDate).toLocaleDateString() : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Checklist Template" : "Create Checklist Template"}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Emergency Job Completion Checklist"
                  {...form.register("name")}
                  data-testid="input-template-name"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="code">Unique Code</Label>
                <Input
                  id="code"
                  placeholder="e.g., emergency_job_completion"
                  {...form.register("code")}
                  disabled={!!editingTemplate}
                  data-testid="input-template-code"
                />
                {form.formState.errors.code && (
                  <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose of this checklist..."
                {...form.register("description")}
                data-testid="input-template-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetType">Target Type</Label>
                <Select
                  value={form.watch("targetType")}
                  onValueChange={(value) => form.setValue("targetType", value)}
                >
                  <SelectTrigger data-testid="select-target-type">
                    <SelectValue placeholder="Select target type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(targetTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2 pt-8">
                <Switch
                  checked={form.watch("isActive") ?? true}
                  onCheckedChange={(checked) => form.setValue("isActive", checked)}
                  data-testid="switch-is-active"
                />
                <Label>Active</Label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Checklist Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem} data-testid="button-add-item">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>

              {templateItems.length === 0 ? (
                <div className="border border-dashed rounded-md p-8 text-center text-muted-foreground">
                  No checklist items yet. Click "Add Item" to create your first item.
                </div>
              ) : (
                <div className="space-y-3">
                  {templateItems.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-md" data-testid={`checklist-item-${index}`}>
                      <div className="flex flex-col gap-1 mt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveItem(index, "up")}
                          disabled={index === 0}
                        >
                          <GripVertical className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div className="col-span-2 space-y-2">
                          <Input
                            placeholder="Checklist item label"
                            value={item.label}
                            onChange={(e) => updateItem(index, { label: e.target.value })}
                            data-testid={`input-item-label-${index}`}
                          />
                          <Input
                            placeholder="Help text (optional)"
                            value={item.helpText || ""}
                            onChange={(e) => updateItem(index, { helpText: e.target.value })}
                            className="text-sm"
                            data-testid={`input-item-help-${index}`}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Select
                            value={item.itemType}
                            onValueChange={(value) => updateItem(index, { itemType: value })}
                          >
                            <SelectTrigger data-testid={`select-item-type-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(itemTypeLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={item.isRequired}
                              onCheckedChange={(checked) => updateItem(index, { isRequired: !!checked })}
                              data-testid={`checkbox-required-${index}`}
                            />
                            <Label className="text-sm">Required</Label>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        data-testid={`button-remove-item-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-template">
                {saveMutation.isPending ? "Saving..." : editingTemplate ? "Update Template" : "Create Template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

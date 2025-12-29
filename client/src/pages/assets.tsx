import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Asset, Employee } from "@shared/schema";
import { 
  Plus, 
  Truck, 
  Wrench, 
  Package, 
  AlertTriangle, 
  Calendar, 
  Trash2, 
  Edit,
  Bell,
  FileWarning,
  User
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

const assetFormSchema = z.object({
  type: z.enum(["vehicle", "tool", "equipment"]),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  registrationNumber: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  assignedToId: z.string().optional(),
  status: z.enum(["active", "in_service", "faulty", "retired"]),
  motDate: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  nextServiceDate: z.string().optional(),
});

type AssetFormData = z.infer<typeof assetFormSchema>;

const faultFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

type FaultFormData = z.infer<typeof faultFormSchema>;

const typeIcons = {
  vehicle: Truck,
  tool: Wrench,
  equipment: Package,
};

const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-600 dark:text-green-400",
  in_service: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  faulty: "bg-red-500/10 text-red-600 dark:text-red-400",
  retired: "bg-muted text-muted-foreground",
};

function getMotCountdown(motDate: string | Date | null | undefined): { days: number; label: string; color: string } | null {
  if (!motDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const mot = typeof motDate === 'string' ? new Date(motDate) : new Date(motDate);
  mot.setHours(0, 0, 0, 0);
  const days = differenceInDays(mot, today);
  
  if (days < 0) {
    return { days: Math.abs(days), label: `${Math.abs(days)}d overdue`, color: "bg-red-500 text-white" };
  } else if (days === 0) {
    return { days: 0, label: "Due today", color: "bg-red-500 text-white" };
  } else if (days <= 7) {
    return { days, label: `${days}d left`, color: "bg-red-500/10 text-red-600 dark:text-red-400" };
  } else if (days <= 30) {
    return { days, label: `${days}d left`, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
  } else {
    return { days, label: `${days}d left`, color: "bg-green-500/10 text-green-600 dark:text-green-400" };
  }
}

export default function AssetsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFaultDialog, setShowFaultDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedAssetForFault, setSelectedAssetForFault] = useState<Asset | null>(null);

  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: faults = [] } = useQuery<any[]>({
    queryKey: ["/api/asset-faults"],
  });

  const { data: reminders = [] } = useQuery<any[]>({
    queryKey: ["/api/asset-reminders", { upcoming: 30 }],
  });

  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      type: "tool",
      name: "",
      status: "active",
    },
  });

  const faultForm = useForm<FaultFormData>({
    resolver: zodResolver(faultFormSchema),
    defaultValues: {
      title: "",
      priority: "medium",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: AssetFormData) => apiRequest("POST", "/api/assets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/asset-reminders"] });
      toast({ title: "Asset created successfully" });
      setShowCreateDialog(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create asset", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AssetFormData> }) =>
      apiRequest("PATCH", `/api/assets/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({ title: "Asset updated successfully" });
      setShowCreateDialog(false);
      setSelectedAsset(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to update asset", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/assets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({ title: "Asset deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete asset", variant: "destructive" });
    },
  });

  const createFaultMutation = useMutation({
    mutationFn: (data: FaultFormData & { assetId: string; reportedById: string }) =>
      apiRequest("POST", "/api/asset-faults", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-faults"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({ title: "Fault reported successfully", description: "A task has been created in the Task Manager." });
      setShowFaultDialog(false);
      setSelectedAssetForFault(null);
      faultForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to report fault", variant: "destructive" });
    },
  });

  const onSubmit = (data: AssetFormData) => {
    if (selectedAsset) {
      updateMutation.mutate({ id: selectedAsset.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const onFaultSubmit = (data: FaultFormData) => {
    if (!selectedAssetForFault) return;
    createFaultMutation.mutate({
      ...data,
      assetId: selectedAssetForFault.id,
      reportedById: employees[0]?.id || "", // TODO: Use current user
    });
  };

  const handleEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    form.reset({
      type: asset.type as "vehicle" | "tool" | "equipment",
      name: asset.name,
      description: asset.description || "",
      registrationNumber: asset.registrationNumber || "",
      serialNumber: asset.serialNumber || "",
      purchaseDate: asset.purchaseDate ? format(new Date(asset.purchaseDate), "yyyy-MM-dd") : "",
      purchasePrice: asset.purchasePrice || "",
      warrantyExpiry: asset.warrantyExpiry ? format(new Date(asset.warrantyExpiry), "yyyy-MM-dd") : "",
      assignedToId: asset.assignedToId || "",
      status: asset.status as "active" | "in_service" | "faulty" | "retired",
      motDate: asset.motDate ? format(new Date(asset.motDate), "yyyy-MM-dd") : "",
      insuranceExpiry: asset.insuranceExpiry ? format(new Date(asset.insuranceExpiry), "yyyy-MM-dd") : "",
      nextServiceDate: asset.nextServiceDate ? format(new Date(asset.nextServiceDate), "yyyy-MM-dd") : "",
    });
    setShowCreateDialog(true);
  };

  const handleReportFault = (asset: Asset) => {
    setSelectedAssetForFault(asset);
    faultForm.reset({ title: "", priority: "medium" });
    setShowFaultDialog(true);
  };

  const filteredAssets = activeTab === "all" 
    ? assets 
    : assets.filter(a => a.type === activeTab);

  const openFaults = faults.filter(f => f.status === "open" || f.status === "in_progress");
  const upcomingReminders = reminders.filter(r => !r.acknowledged);

  const getEmployeeName = (id: string | null) => {
    if (!id) return null;
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : null;
  };

  const assetCounts = {
    all: assets.length,
    vehicle: assets.filter(a => a.type === "vehicle").length,
    tool: assets.filter(a => a.type === "tool").length,
    equipment: assets.filter(a => a.type === "equipment").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Tools & Vehicles</h1>
          <p className="text-muted-foreground">Manage company assets, vehicles, and equipment</p>
        </div>
        <Button onClick={() => { setSelectedAsset(null); form.reset(); setShowCreateDialog(true); }} data-testid="button-add-asset">
          <Plus className="w-4 h-4 mr-2" />
          Add Asset
        </Button>
      </div>

      {(openFaults.length > 0 || upcomingReminders.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {openFaults.length > 0 && (
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileWarning className="w-4 h-4 text-red-500" />
                  Open Faults ({openFaults.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {openFaults.slice(0, 3).map((fault: any) => (
                  <div key={fault.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{fault.title} - {fault.asset?.name}</span>
                    <Badge variant="outline" className={statusColors[fault.status]}>{fault.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {upcomingReminders.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500" />
                  Upcoming Reminders ({upcomingReminders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {upcomingReminders.slice(0, 3).map((reminder: any) => (
                  <div key={reminder.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{reminder.reminderType?.replace(/_/g, " ")} - {reminder.asset?.name}</span>
                    <span className="text-muted-foreground">{format(new Date(reminder.dueDate), "dd MMM")}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">All ({assetCounts.all})</TabsTrigger>
          <TabsTrigger value="vehicle" data-testid="tab-vehicles">
            <Truck className="w-4 h-4 mr-1" />
            Vehicles ({assetCounts.vehicle})
          </TabsTrigger>
          <TabsTrigger value="tool" data-testid="tab-tools">
            <Wrench className="w-4 h-4 mr-1" />
            Tools ({assetCounts.tool})
          </TabsTrigger>
          <TabsTrigger value="equipment" data-testid="tab-equipment">
            <Package className="w-4 h-4 mr-1" />
            Equipment ({assetCounts.equipment})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAssets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No assets found</h3>
                <p className="text-muted-foreground mb-4">Add your first asset to get started</p>
                <Button onClick={() => { setSelectedAsset(null); form.reset(); setShowCreateDialog(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Asset
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAssets.map((asset) => {
                const Icon = typeIcons[asset.type as keyof typeof typeIcons] || Package;
                const assignee = getEmployeeName(asset.assignedToId);
                
                return (
                  <Card key={asset.id} data-testid={`card-asset-${asset.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-md bg-muted">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{asset.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">{asset.assetNumber}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className={statusColors[asset.status]}>{asset.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {asset.description && (
                        <p className="text-sm text-muted-foreground">{asset.description}</p>
                      )}
                      {asset.registrationNumber && (
                        <div className="flex items-center gap-2 text-sm">
                          <Truck className="w-4 h-4 text-muted-foreground" />
                          <span>{asset.registrationNumber}</span>
                        </div>
                      )}
                      {assignee && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>{assignee}</span>
                        </div>
                      )}
                      {asset.type === "vehicle" && asset.motDate && (() => {
                        const motCountdown = getMotCountdown(asset.motDate);
                        return (
                          <div className="flex items-center justify-between gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>MOT: {format(new Date(asset.motDate), "dd MMM yyyy")}</span>
                            </div>
                            {motCountdown && (
                              <Badge variant="secondary" className={motCountdown.color}>
                                {motCountdown.label}
                              </Badge>
                            )}
                          </div>
                        );
                      })()}
                      
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(asset)} data-testid={`button-edit-${asset.id}`}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleReportFault(asset)} data-testid={`button-fault-${asset.id}`}>
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Report Fault
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteMutation.mutate(asset.id)}
                          data-testid={`button-delete-${asset.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAsset ? "Edit Asset" : "Add New Asset"}</DialogTitle>
            <DialogDescription>
              {selectedAsset ? "Update the asset details below" : "Enter the details for the new asset"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vehicle">Vehicle</SelectItem>
                          <SelectItem value="tool">Tool</SelectItem>
                          <SelectItem value="equipment">Equipment</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="in_service">In Service</SelectItem>
                          <SelectItem value="faulty">Faulty</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Asset name" data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Brief description" data-testid="input-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("type") === "vehicle" && (
                  <FormField
                    control={form.control}
                    name="registrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="AB12 CDE" data-testid="input-registration" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Serial number" data-testid="input-serial" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignedToId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(val === "unassigned" ? null : val)} 
                        value={field.value || "unassigned"}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-assignee">
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.firstName} {emp.lastName}
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
                  name="purchaseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-purchase-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchasePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Price</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="0.00" data-testid="input-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="warrantyExpiry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warranty Expiry</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-warranty" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("type") === "vehicle" && (
                  <>
                    <FormField
                      control={form.control}
                      name="motDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>MOT Due</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-mot" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="insuranceExpiry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance Expiry</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-insurance" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nextServiceDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Next Service</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-service" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit-asset"
                >
                  {selectedAsset ? "Update Asset" : "Create Asset"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showFaultDialog} onOpenChange={setShowFaultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Fault</DialogTitle>
            <DialogDescription>
              Report an issue with {selectedAssetForFault?.name}. A task will be automatically created.
            </DialogDescription>
          </DialogHeader>
          <Form {...faultForm}>
            <form onSubmit={faultForm.handleSubmit(onFaultSubmit)} className="space-y-4">
              <FormField
                control={faultForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Brief description of the issue" data-testid="input-fault-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={faultForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Details</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Provide more details about the fault..." data-testid="input-fault-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={faultForm.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-fault-priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowFaultDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createFaultMutation.isPending}
                  data-testid="button-submit-fault"
                >
                  Report Fault
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

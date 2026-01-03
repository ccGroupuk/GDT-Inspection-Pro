import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FormSkeleton } from "@/components/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Save, CheckCircle, Handshake, RefreshCw, Plus, Trash2, Package, FileStack, Search, X, ChevronRight, Eye, EyeOff, Percent } from "lucide-react";
import { Link } from "wouter";
import type { Job, Contact, TradePartner, InsertJob, QuoteItem, CatalogItem, ProductCategory, QuoteTemplate, QuoteTemplateItem, JobPartner } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  insertJobSchema, 
  SERVICE_TYPES, 
  LEAD_SOURCES, 
  DELIVERY_TYPES,
  TRADE_CATEGORIES,
  PIPELINE_STAGES,
} from "@shared/schema";

interface QuoteLineItem {
  id?: string;
  description: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
}

const formSchema = insertJobSchema.extend({
  contactId: z.string().min(1, "Please select a contact"),
  serviceType: z.string().min(1, "Please select a service type"),
  jobAddress: z.string().min(1, "Job address is required"),
  jobPostcode: z.string().min(1, "Job postcode is required"),
});

type FormData = z.infer<typeof formSchema>;

interface JobFormData {
  job?: Job;
  contacts: Contact[];
  partners: TradePartner[];
  quoteItems?: QuoteItem[];
}

export default function JobForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id) && id !== "new";
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Quote items state
  const [quoteItems, setQuoteItems] = useState<QuoteLineItem[]>([]);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState("20");
  const [discountType, setDiscountType] = useState<string | null>(null);
  const [discountValue, setDiscountValue] = useState("");
  
  // Client visibility settings
  const [useDefaultMarkup, setUseDefaultMarkup] = useState(true);
  const [customMarkupPercent, setCustomMarkupPercent] = useState("");
  const [hideClientCostBreakdown, setHideClientCostBreakdown] = useState(true);
  const [showClientPreview, setShowClientPreview] = useState(false);
  
  // Default markup from system settings
  const { data: defaultMarkupSetting } = useQuery<{ settingValue: string } | null>({
    queryKey: ["/api/company-settings/default_material_markup_percent"],
  });
  const defaultMarkupPercent = defaultMarkupSetting?.settingValue || "15";
  
  // Catalog & Template picker states
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogTypeFilter, setCatalogTypeFilter] = useState<string>("all");
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>("all");
  const [templateSearch, setTemplateSearch] = useState("");
  
  // Multi-partner dialog state
  const [showAddPartnerDialog, setShowAddPartnerDialog] = useState(false);
  const [newPartnerFormData, setNewPartnerFormData] = useState({
    partnerId: "",
    chargeType: "fixed",
    chargeAmount: "",
    notes: "",
  });
  
  // Fetch catalog items
  const { data: catalogItems = [] } = useQuery<CatalogItem[]>({
    queryKey: ["/api/catalog-items"],
  });
  
  // Fetch product categories
  const { data: productCategories = [] } = useQuery<ProductCategory[]>({
    queryKey: ["/api/product-categories"],
  });
  
  // Fetch quote templates with their items
  const { data: templates = [] } = useQuery<QuoteTemplate[]>({
    queryKey: ["/api/quote-templates"],
  });

  const { data: editData, isLoading: editLoading } = useQuery<JobFormData>({
    queryKey: ["/api/jobs", id],
    enabled: isEdit,
  });

  // Fetch quote items for edit mode
  const { data: existingQuoteItems } = useQuery<QuoteItem[]>({
    queryKey: ["/api/jobs", id, "quote-items"],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${id}/quote-items`);
      if (!response.ok) throw new Error("Failed to fetch quote items");
      return response.json();
    },
    enabled: isEdit && !!id,
  });

  // Fetch job partners for edit mode (multi-partner support)
  type JobPartnerWithDetails = JobPartner & { partner?: TradePartner };
  const { data: jobPartnersData = [], isLoading: jobPartnersLoading } = useQuery<JobPartnerWithDetails[]>({
    queryKey: ["/api/jobs", id, "partners"],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${id}/partners`);
      if (!response.ok) throw new Error("Failed to fetch job partners");
      return response.json();
    },
    enabled: isEdit && !!id,
  });

  // Add partner to job mutation
  const addJobPartnerMutation = useMutation({
    mutationFn: async (partnerData: { partnerId: string; chargeType?: string; chargeAmount?: string; notes?: string }) => {
      return apiRequest("POST", `/api/jobs/${id}/partners`, partnerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "partners"] });
      toast({ title: "Partner added to job" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add partner", description: error.message, variant: "destructive" });
    },
  });

  // Update job partner mutation
  const updateJobPartnerMutation = useMutation({
    mutationFn: async ({ partnerId, data }: { partnerId: string; data: Partial<JobPartner> }) => {
      return apiRequest("PATCH", `/api/job-partners/${partnerId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "partners"] });
      toast({ title: "Partner details updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update partner", description: error.message, variant: "destructive" });
    },
  });

  // Remove partner from job mutation
  const removeJobPartnerMutation = useMutation({
    mutationFn: async (jobPartnerId: string) => {
      return apiRequest("DELETE", `/api/job-partners/${jobPartnerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id, "partners"] });
      toast({ title: "Partner removed from job" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to remove partner", description: error.message, variant: "destructive" });
    },
  });

  // Load existing quote items and job settings when editing
  useEffect(() => {
    if (existingQuoteItems && existingQuoteItems.length > 0) {
      setQuoteItems(existingQuoteItems.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })));
    }
  }, [existingQuoteItems]);

  useEffect(() => {
    if (editData?.job) {
      setTaxEnabled(editData.job.taxEnabled || false);
      setTaxRate(editData.job.taxRate || "20");
      setDiscountType(editData.job.discountType || null);
      setDiscountValue(editData.job.discountValue || "");
      // Client visibility settings
      setUseDefaultMarkup(editData.job.useDefaultMarkup ?? true);
      setCustomMarkupPercent(editData.job.customMarkupPercent || "");
      setHideClientCostBreakdown(editData.job.hideClientCostBreakdown ?? true);
    }
  }, [editData?.job]);

  const { data: formData, isLoading: formDataLoading } = useQuery<{ contacts: Contact[]; partners: TradePartner[] }>({
    queryKey: ["/api/jobs"],
    enabled: !isEdit,
  });

  const data = isEdit ? editData : { job: undefined, contacts: formData?.contacts || [], partners: formData?.partners || [] };
  const isLoading = isEdit ? editLoading : formDataLoading;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contactId: "",
      serviceType: "",
      description: "",
      jobAddress: "",
      jobPostcode: "",
      leadSource: "",
      deliveryType: "in_house",
      tradeCategory: "",
      partnerId: null,
      status: "new_enquiry",
      quoteType: "fixed",
      quotedValue: null,
      depositRequired: false,
      depositType: "fixed",
      depositAmount: null,
      depositReceived: false,
      partnerChargeType: "fixed",
      partnerCharge: null,
      cccMargin: null,
      partnerInvoiceReceived: false,
      partnerPaid: false,
      partnerStatus: null,
    },
    values: data?.job ? {
      contactId: data.job.contactId,
      serviceType: data.job.serviceType,
      description: data.job.description || "",
      jobAddress: data.job.jobAddress,
      jobPostcode: data.job.jobPostcode,
      leadSource: data.job.leadSource || "",
      deliveryType: data.job.deliveryType,
      tradeCategory: data.job.tradeCategory || "",
      partnerId: data.job.partnerId,
      status: data.job.status,
      quoteType: data.job.quoteType || "fixed",
      quotedValue: data.job.quotedValue,
      depositRequired: data.job.depositRequired || false,
      depositType: data.job.depositType || "fixed",
      depositAmount: data.job.depositAmount,
      depositReceived: data.job.depositReceived || false,
      partnerChargeType: data.job.partnerChargeType || "fixed",
      partnerCharge: data.job.partnerCharge,
      cccMargin: data.job.cccMargin,
      partnerInvoiceReceived: data.job.partnerInvoiceReceived || false,
      partnerPaid: data.job.partnerPaid || false,
      partnerStatus: data.job.partnerStatus,
    } : undefined,
  });

  const deliveryType = form.watch("deliveryType");
  const isPartnerJob = deliveryType === "partner" || deliveryType === "hybrid";

  // Quote item helpers
  const addQuoteItem = () => {
    setQuoteItems([...quoteItems, { description: "", quantity: "1", unitPrice: "", lineTotal: "0" }]);
  };

  const removeQuoteItem = (index: number) => {
    setQuoteItems(quoteItems.filter((_, i) => i !== index));
  };

  const updateQuoteItem = (index: number, field: keyof QuoteLineItem, value: string) => {
    const updated = [...quoteItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Recalculate line total when quantity or unit price changes
    if (field === "quantity" || field === "unitPrice") {
      const qty = parseFloat(updated[index].quantity) || 0;
      const price = parseFloat(updated[index].unitPrice) || 0;
      updated[index].lineTotal = (qty * price).toFixed(2);
    }
    
    setQuoteItems(updated);
  };
  
  // Add catalog item to quote
  const addCatalogItemToQuote = (item: CatalogItem, quantityOverride?: number) => {
    const qty = quantityOverride || parseFloat(item.defaultQuantity || "1");
    const price = parseFloat(item.unitPrice);
    const lineTotal = (qty * price).toFixed(2);
    
    setQuoteItems([...quoteItems, {
      description: item.name,
      quantity: qty.toString(),
      unitPrice: item.unitPrice,
      lineTotal,
    }]);
    
    toast({
      title: "Item added",
      description: `${item.name} added to quote`,
    });
  };
  
  // Apply template - adds all template items to the quote
  const applyTemplate = async (template: QuoteTemplate) => {
    try {
      // Fetch template items
      const response = await fetch(`/api/quote-templates/${template.id}/items`);
      if (!response.ok) throw new Error("Failed to fetch template items");
      const templateItems: QuoteTemplateItem[] = await response.json();
      
      // Add all template items to quote
      const newItems = templateItems.map(item => {
        const qty = parseFloat(item.quantity);
        const price = parseFloat(item.unitPrice);
        return {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: (qty * price).toFixed(2),
        };
      });
      
      setQuoteItems([...quoteItems, ...newItems]);
      setShowTemplatePicker(false);
      
      toast({
        title: "Template applied",
        description: `${newItems.length} items from "${template.name}" added to quote`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply template",
        variant: "destructive",
      });
    }
  };
  
  // Filtered catalog items
  const filteredCatalogItems = useMemo(() => {
    return catalogItems.filter(item => {
      if (!item.isActive) return false;
      if (catalogTypeFilter !== "all" && item.type !== catalogTypeFilter) return false;
      if (catalogCategoryFilter !== "all" && item.categoryId !== catalogCategoryFilter) return false;
      if (catalogSearch) {
        const search = catalogSearch.toLowerCase();
        return item.name.toLowerCase().includes(search) || 
               (item.description?.toLowerCase().includes(search) || false);
      }
      return true;
    });
  }, [catalogItems, catalogTypeFilter, catalogCategoryFilter, catalogSearch]);
  
  // Filtered templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      if (!t.isActive) return false;
      if (templateSearch) {
        const search = templateSearch.toLowerCase();
        return t.name.toLowerCase().includes(search) || 
               (t.description?.toLowerCase().includes(search) || false);
      }
      return true;
    });
  }, [templates, templateSearch]);
  
  // Group catalog items by category
  const catalogByCategory = useMemo(() => {
    const groups: Record<string, CatalogItem[]> = {};
    filteredCatalogItems.forEach(item => {
      const cat = productCategories.find(c => c.id === item.categoryId);
      const catName = cat?.name || "Uncategorized";
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(item);
    });
    return groups;
  }, [filteredCatalogItems, productCategories]);

  // Calculate quote totals
  const quoteTotals = useMemo(() => {
    const subtotal = quoteItems.reduce((sum, item) => sum + (parseFloat(item.lineTotal) || 0), 0);
    
    let discountAmount = 0;
    if (discountType && discountValue) {
      if (discountType === "percentage") {
        discountAmount = subtotal * (parseFloat(discountValue) / 100);
      } else if (discountType === "fixed") {
        discountAmount = parseFloat(discountValue) || 0;
      }
    }
    
    const afterDiscount = subtotal - discountAmount;
    
    let taxAmount = 0;
    if (taxEnabled && taxRate) {
      taxAmount = afterDiscount * (parseFloat(taxRate) / 100);
    }
    
    const grandTotal = afterDiscount + taxAmount;
    
    return { subtotal, discountAmount, taxAmount, grandTotal };
  }, [quoteItems, discountType, discountValue, taxEnabled, taxRate]);

  const mutation = useMutation({
    mutationFn: async (values: FormData) => {
      // Include quote settings and client visibility in the job data
      const jobData = {
        ...values,
        taxEnabled,
        taxRate,
        discountType: discountType || null,
        discountValue: discountValue || null,
        quotedValue: quoteTotals.grandTotal.toFixed(2),
        // Client visibility settings
        useDefaultMarkup,
        customMarkupPercent: customMarkupPercent || null,
        hideClientCostBreakdown,
      };

      let jobResponse;
      if (isEdit) {
        jobResponse = await apiRequest("PATCH", `/api/jobs/${id}`, jobData);
      } else {
        jobResponse = await apiRequest("POST", "/api/jobs", jobData);
      }

      // Save quote items
      const jobId = isEdit ? id : (await jobResponse.json()).id;
      if (quoteItems.length > 0) {
        const itemsToSave = quoteItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        }));
        await apiRequest("PUT", `/api/jobs/${jobId}/quote-items`, { items: itemsToSave });
      }

      return jobResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: isEdit ? "Job updated" : "Job created",
        description: isEdit ? "The job has been updated successfully." : "The new job has been created.",
      });
      navigate("/jobs");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormData) => {
    mutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-6">
          <Link href="/jobs">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-semibold">{isEdit ? "Edit Job" : "New Job"}</h1>
        </div>
        <FormSkeleton />
      </div>
    );
  }

  const contacts = data?.contacts || [];
  const partners = data?.partners || [];
  const activePartners = partners.filter(p => p.isActive);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-6">
        <Link href="/jobs">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-xl sm:text-2xl font-semibold">{isEdit ? "Edit Job" : "New Job"}</h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl w-full">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client & Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="contactId">Client *</Label>
                <Select
                  value={form.watch("contactId")}
                  onValueChange={(value) => form.setValue("contactId", value)}
                >
                  <SelectTrigger data-testid="select-contact">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map(contact => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name} - {contact.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.contactId && (
                  <p className="text-xs text-destructive">{form.formState.errors.contactId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceType">Service Type *</Label>
                <Select
                  value={form.watch("serviceType")}
                  onValueChange={(value) => form.setValue("serviceType", value)}
                >
                  <SelectTrigger data-testid="select-service-type">
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.serviceType && (
                  <p className="text-xs text-destructive">{form.formState.errors.serviceType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobAddress">Job Address *</Label>
                <Input
                  {...form.register("jobAddress")}
                  placeholder="Enter job address"
                  data-testid="input-job-address"
                />
                {form.formState.errors.jobAddress && (
                  <p className="text-xs text-destructive">{form.formState.errors.jobAddress.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobPostcode">Job Postcode *</Label>
                <Input
                  {...form.register("jobPostcode")}
                  placeholder="e.g. CF10 1AA"
                  data-testid="input-job-postcode"
                />
                {form.formState.errors.jobPostcode && (
                  <p className="text-xs text-destructive">{form.formState.errors.jobPostcode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="leadSource">Lead Source</Label>
                <Select
                  value={form.watch("leadSource") || ""}
                  onValueChange={(value) => form.setValue("leadSource", value)}
                >
                  <SelectTrigger data-testid="select-lead-source">
                    <SelectValue placeholder="Select lead source" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCES.map(source => (
                      <SelectItem key={source} value={source}>{source}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isEdit && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(value) => form.setValue("status", value)}
                  >
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {PIPELINE_STAGES.map(stage => (
                        <SelectItem key={stage.value} value={stage.value}>{stage.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                {...form.register("description")}
                placeholder="Describe the job requirements..."
                className="min-h-[100px]"
                data-testid="textarea-description"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Delivery Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DELIVERY_TYPES.map(type => {
                const Icon = type.value === "in_house" ? CheckCircle : type.value === "partner" ? Handshake : RefreshCw;
                const isSelected = form.watch("deliveryType") === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => form.setValue("deliveryType", type.value)}
                    className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                      isSelected 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover-elevate"
                    }`}
                    data-testid={`button-delivery-${type.value}`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {isPartnerJob && (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                <div className="space-y-2">
                  <Label htmlFor="tradeCategory">Trade Category</Label>
                  <Select
                    value={form.watch("tradeCategory") || ""}
                    onValueChange={(value) => form.setValue("tradeCategory", value)}
                  >
                    <SelectTrigger data-testid="select-trade-category">
                      <SelectValue placeholder="Select trade category" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRADE_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partnerId">Primary Partner</Label>
                  <Select
                    value={form.watch("partnerId") || ""}
                    onValueChange={(value) => form.setValue("partnerId", value || null)}
                  >
                    <SelectTrigger data-testid="select-partner">
                      <SelectValue placeholder="Select a partner (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {activePartners.map(partner => (
                        <SelectItem key={partner.id} value={partner.id}>
                          {partner.businessName} ({partner.tradeCategory})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Multi-partner section for hybrid jobs (only in edit mode) */}
              {isEdit && deliveryType === "hybrid" && (
                <div className="pt-4 mt-4 border-t border-border space-y-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <Label className="text-base font-medium">Additional Partners</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Assign multiple trade partners with individual charge settings
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddPartnerDialog(true)}
                      data-testid="button-add-partner"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Partner
                    </Button>
                  </div>

                  {/* Add partner dialog using shadcn Dialog */}
                  <Dialog open={showAddPartnerDialog} onOpenChange={setShowAddPartnerDialog}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Partner to Job</DialogTitle>
                        <DialogDescription>
                          Select a partner and configure their charge settings for this job.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Partner</Label>
                          <Select
                            value={newPartnerFormData.partnerId}
                            onValueChange={(value) => setNewPartnerFormData(prev => ({ ...prev, partnerId: value }))}
                          >
                            <SelectTrigger data-testid="select-new-partner">
                              <SelectValue placeholder="Select a partner" />
                            </SelectTrigger>
                            <SelectContent>
                              {activePartners
                                .filter(p => !jobPartnersData.some(jp => jp.partnerId === p.id) && p.id !== form.watch("partnerId"))
                                .map(partner => (
                                  <SelectItem key={partner.id} value={partner.id}>
                                    {partner.businessName} ({partner.tradeCategory})
                                  </SelectItem>
                                ))
                              }
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Charge Type</Label>
                            <Select
                              value={newPartnerFormData.chargeType}
                              onValueChange={(value) => setNewPartnerFormData(prev => ({ ...prev, chargeType: value }))}
                            >
                              <SelectTrigger data-testid="select-charge-type">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                                <SelectItem value="percentage">Percentage</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>{newPartnerFormData.chargeType === "percentage" ? "Percentage" : "Amount (£)"}</Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={newPartnerFormData.chargeAmount}
                              onChange={(e) => setNewPartnerFormData(prev => ({ ...prev, chargeAmount: e.target.value }))}
                              data-testid="input-charge-amount"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Notes (what this partner handles)</Label>
                          <Textarea
                            placeholder="e.g. Electrical work, plumbing..."
                            rows={2}
                            value={newPartnerFormData.notes}
                            onChange={(e) => setNewPartnerFormData(prev => ({ ...prev, notes: e.target.value }))}
                            data-testid="input-partner-notes"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 mt-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowAddPartnerDialog(false)}
                          data-testid="button-cancel-add-partner"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          disabled={!newPartnerFormData.partnerId || addJobPartnerMutation.isPending}
                          onClick={() => {
                            addJobPartnerMutation.mutate(newPartnerFormData, {
                              onSuccess: () => {
                                setShowAddPartnerDialog(false);
                                setNewPartnerFormData({ partnerId: "", chargeType: "fixed", chargeAmount: "", notes: "" });
                              },
                            });
                          }}
                          data-testid="button-confirm-add-partner"
                        >
                          {addJobPartnerMutation.isPending ? "Adding..." : "Add Partner"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* List of assigned partners */}
                  {jobPartnersLoading ? (
                    <div className="text-center py-4 text-muted-foreground">Loading partners...</div>
                  ) : jobPartnersData.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground border rounded-md">
                      <Handshake className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-sm">No additional partners assigned yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {jobPartnersData.map((jp) => (
                        <div key={jp.id} className="flex items-start justify-between gap-4 p-3 border rounded-md" data-testid={`job-partner-${jp.id}`}>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium" data-testid={`text-partner-name-${jp.id}`}>{jp.partner?.businessName || "Unknown Partner"}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                              {jp.partner?.tradeCategory && <Badge variant="secondary">{jp.partner.tradeCategory}</Badge>}
                              <span data-testid={`text-partner-charge-${jp.id}`}>
                                {jp.chargeType === "percentage" ? (
                                  <>{jp.chargeAmount}% of job value</>
                                ) : jp.chargeAmount ? (
                                  <>£{parseFloat(jp.chargeAmount).toFixed(2)} fixed</>
                                ) : (
                                  <span className="text-muted-foreground">No charge set</span>
                                )}
                              </span>
                            </div>
                            {jp.notes && <div className="text-sm text-muted-foreground mt-1" data-testid={`text-partner-notes-${jp.id}`}>{jp.notes}</div>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={jp.status === "completed" ? "default" : jp.status === "in_progress" ? "secondary" : "outline"}>
                              {jp.status || "assigned"}
                            </Badge>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => removeJobPartnerMutation.mutate(jp.id)}
                              disabled={removeJobPartnerMutation.isPending}
                              data-testid={`button-remove-partner-${jp.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle className="text-base">Quote Builder</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplatePicker(true)}
                  data-testid="button-apply-template"
                >
                  <FileStack className="w-4 h-4 mr-2" />
                  Apply Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCatalogPicker(true)}
                  data-testid="button-add-from-catalog"
                >
                  <Package className="w-4 h-4 mr-2" />
                  From Catalog
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addQuoteItem}
                  data-testid="button-add-quote-item"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Manual Item
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {quoteItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="mb-2">No items added yet.</p>
                <p className="text-sm">Use the buttons above to add items from your catalog, apply a template, or add manually.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {quoteItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-start" data-testid={`quote-item-${index}`}>
                    <div className="col-span-12 md:col-span-5 space-y-1">
                      {index === 0 && <Label className="text-xs text-muted-foreground">Description</Label>}
                      <Input
                        value={item.description}
                        onChange={(e) => updateQuoteItem(index, "description", e.target.value)}
                        placeholder="Item description"
                        data-testid={`input-item-description-${index}`}
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2 space-y-1">
                      {index === 0 && <Label className="text-xs text-muted-foreground">Qty</Label>}
                      <Input
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateQuoteItem(index, "quantity", e.target.value)}
                        placeholder="1"
                        data-testid={`input-item-quantity-${index}`}
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2 space-y-1">
                      {index === 0 && <Label className="text-xs text-muted-foreground">Unit Price</Label>}
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateQuoteItem(index, "unitPrice", e.target.value)}
                        placeholder="0.00"
                        data-testid={`input-item-price-${index}`}
                      />
                    </div>
                    <div className="col-span-3 md:col-span-2 space-y-1">
                      {index === 0 && <Label className="text-xs text-muted-foreground">Total</Label>}
                      <div className="h-9 flex items-center font-mono text-sm">
                        £{parseFloat(item.lineTotal || "0").toFixed(2)}
                      </div>
                    </div>
                    <div className="col-span-1 space-y-1">
                      {index === 0 && <Label className="text-xs text-muted-foreground invisible">Del</Label>}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuoteItem(index)}
                        data-testid={`button-remove-item-${index}`}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {quoteItems.length > 0 && (
              <>
                <div className="border-t border-border pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={taxEnabled}
                          onCheckedChange={setTaxEnabled}
                          data-testid="switch-tax-enabled"
                        />
                        <Label>Include Tax (VAT)</Label>
                        {taxEnabled && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={taxRate}
                              onChange={(e) => setTaxRate(e.target.value)}
                              className="w-20"
                              data-testid="input-tax-rate"
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Discount</Label>
                        <div className="flex items-center gap-2">
                          <Select
                            value={discountType || "none"}
                            onValueChange={(value) => setDiscountType(value === "none" ? null : value)}
                          >
                            <SelectTrigger className="w-36" data-testid="select-discount-type">
                              <SelectValue placeholder="No discount" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No discount</SelectItem>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="fixed">Fixed amount</SelectItem>
                            </SelectContent>
                          </Select>
                          {discountType && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={discountValue}
                                onChange={(e) => setDiscountValue(e.target.value)}
                                className="w-24"
                                placeholder="0"
                                data-testid="input-discount-value"
                              />
                              <span className="text-sm text-muted-foreground">
                                {discountType === "percentage" ? "%" : "£"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 bg-muted/50 rounded-lg p-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-mono">£{quoteTotals.subtotal.toFixed(2)}</span>
                      </div>
                      {discountType && quoteTotals.discountAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Discount {discountType === "percentage" ? `(${discountValue}%)` : ""}
                          </span>
                          <span className="font-mono text-green-600 dark:text-green-400">
                            -£{quoteTotals.discountAmount.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {taxEnabled && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">VAT ({taxRate}%)</span>
                          <span className="font-mono">£{quoteTotals.taxAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-border">
                        <span className="font-semibold">Grand Total</span>
                        <span className="font-mono font-semibold text-lg">
                          £{quoteTotals.grandTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client Visibility Settings */}
                <div className="border-t border-border pt-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Client Visibility Settings</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={hideClientCostBreakdown}
                          onCheckedChange={setHideClientCostBreakdown}
                          data-testid="switch-hide-cost-breakdown"
                        />
                        <div>
                          <Label>Hide Cost Breakdown</Label>
                          <p className="text-xs text-muted-foreground">Client sees final prices only</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Switch
                          checked={useDefaultMarkup}
                          onCheckedChange={(checked) => {
                            setUseDefaultMarkup(checked);
                            if (checked) setCustomMarkupPercent("");
                          }}
                          data-testid="switch-use-default-markup"
                        />
                        <div>
                          <Label>Apply Material Markup ({defaultMarkupPercent}%)</Label>
                          <p className="text-xs text-muted-foreground">Adds hidden markup to material items</p>
                        </div>
                      </div>

                      {!useDefaultMarkup && (
                        <div className="flex items-center gap-2 pl-8">
                          <Label className="text-sm text-muted-foreground">Custom markup:</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={customMarkupPercent}
                            onChange={(e) => setCustomMarkupPercent(e.target.value)}
                            className="w-20"
                            placeholder="0"
                            data-testid="input-custom-markup"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowClientPreview(true)}
                        data-testid="button-preview-client-quote"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview Client Quote
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        See exactly what the client will see
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deposit & Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="quoteType">Quote Type</Label>
                <Select
                  value={form.watch("quoteType") || "fixed"}
                  onValueChange={(value) => form.setValue("quoteType", value)}
                >
                  <SelectTrigger data-testid="select-quote-type">
                    <SelectValue placeholder="Select quote type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Quote</SelectItem>
                    <SelectItem value="estimate">Estimate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={form.watch("depositRequired") || false}
                  onCheckedChange={(checked) => form.setValue("depositRequired", checked)}
                  data-testid="switch-deposit-required"
                />
                <Label>Deposit Required</Label>
              </div>

              {form.watch("depositRequired") && (
                <>
                  <div className="space-y-2">
                    <Label>Deposit Type</Label>
                    <Select
                      value={form.watch("depositType") || "fixed"}
                      onValueChange={(value) => form.setValue("depositType", value)}
                    >
                      <SelectTrigger data-testid="select-deposit-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Amount (£)</SelectItem>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="depositAmount">
                      {form.watch("depositType") === "percentage" ? "Deposit (%)" : "Deposit Amount (£)"}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...form.register("depositAmount")}
                      placeholder={form.watch("depositType") === "percentage" ? "e.g. 25" : "0.00"}
                      data-testid="input-deposit-amount"
                    />
                  </div>
                </>
              )}
            </div>

            {isPartnerJob && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border">
                <div className="space-y-2">
                  <Label>Partner Charge Type</Label>
                  <Select
                    value={form.watch("partnerChargeType") || "fixed"}
                    onValueChange={(value) => form.setValue("partnerChargeType", value)}
                  >
                    <SelectTrigger data-testid="select-partner-charge-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Amount (£)</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partnerCharge">
                    {form.watch("partnerChargeType") === "percentage" ? "Partner Charge (%)" : "Partner Charge (£)"}
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register("partnerCharge")}
                    placeholder={form.watch("partnerChargeType") === "percentage" ? "e.g. 15" : "0.00"}
                    data-testid="input-partner-charge"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cccMargin">CCC Margin (£)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register("cccMargin")}
                    placeholder="0.00"
                    data-testid="input-ccc-margin"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" className="gap-2" disabled={mutation.isPending} data-testid="button-submit">
            <Save className="w-4 h-4" />
            {mutation.isPending ? "Saving..." : isEdit ? "Update Job" : "Create Job"}
          </Button>
          <Link href="/jobs">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
        </div>
      </form>
      
      {/* Catalog Picker Dialog */}
      <Dialog open={showCatalogPicker} onOpenChange={setShowCatalogPicker}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Add from Catalog
            </DialogTitle>
            <DialogDescription>
              Select items from your catalog to add to the quote
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search catalog..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="pl-9"
                data-testid="input-catalog-search"
              />
              {catalogSearch && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2"
                  onClick={() => setCatalogSearch("")}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Select value={catalogTypeFilter} onValueChange={setCatalogTypeFilter}>
              <SelectTrigger className="w-36" data-testid="select-catalog-type-filter">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="labour">Labour</SelectItem>
                <SelectItem value="material">Materials</SelectItem>
                <SelectItem value="consumable">Consumables</SelectItem>
              </SelectContent>
            </Select>
            <Select value={catalogCategoryFilter} onValueChange={setCatalogCategoryFilter}>
              <SelectTrigger className="w-40" data-testid="select-catalog-category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {productCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <ScrollArea className="flex-1 -mx-6 px-6">
            {filteredCatalogItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p>No items found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(catalogByCategory).map(([categoryName, items]) => (
                  <div key={categoryName}>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">{categoryName}</h4>
                    <div className="space-y-2">
                      {items.map(item => (
                        <div 
                          key={item.id} 
                          className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border hover-elevate"
                          data-testid={`catalog-item-${item.id}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium truncate">{item.name}</span>
                              <Badge variant="outline" className="capitalize text-xs">{item.type}</Badge>
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm whitespace-nowrap">
                              £{parseFloat(item.unitPrice).toFixed(2)}/{item.unitOfMeasure || "each"}
                            </span>
                            <Button 
                              type="button"
                              size="sm" 
                              onClick={() => addCatalogItemToQuote(item)}
                              data-testid={`button-add-catalog-item-${item.id}`}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">{filteredCatalogItems.length} items</p>
            <Button type="button" variant="outline" onClick={() => setShowCatalogPicker(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Template Picker Dialog */}
      <Dialog open={showTemplatePicker} onOpenChange={setShowTemplatePicker}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileStack className="w-5 h-5" />
              Apply Quote Template
            </DialogTitle>
            <DialogDescription>
              Select a template to add all its items to your quote
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              className="pl-9"
              data-testid="input-template-search"
            />
            {templateSearch && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2"
                onClick={() => setTemplateSearch("")}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          <ScrollArea className="flex-1 -mx-6 px-6">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileStack className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p>No templates found</p>
                <Link href="/templates">
                  <Button type="button" variant="ghost" className="mt-2">
                    Create your first template
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTemplates.map(template => {
                  const category = productCategories.find(c => c.id === template.categoryId);
                  return (
                    <div 
                      key={template.id} 
                      className="p-4 rounded-lg border border-border hover-elevate cursor-pointer"
                      onClick={() => applyTemplate(template)}
                      data-testid={`template-option-${template.id}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{template.name}</span>
                            {category && (
                              <Badge variant="outline" className="text-xs">{category.name}</Badge>
                            )}
                          </div>
                          {template.description && (
                            <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">{filteredTemplates.length} templates</p>
            <Button type="button" variant="outline" onClick={() => setShowTemplatePicker(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Client Quote Preview Dialog */}
      <Dialog open={showClientPreview} onOpenChange={setShowClientPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Client Quote Preview
            </DialogTitle>
            <DialogDescription>
              This is exactly what the client will see. Markup is applied to material items and cost breakdowns are hidden.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {quoteItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No quote items to preview</p>
            ) : (
              <>
                <div className="border rounded-lg divide-y divide-border">
                  {quoteItems.map((item, index) => {
                    const markupPercent = useDefaultMarkup 
                      ? parseFloat(defaultMarkupPercent) 
                      : parseFloat(customMarkupPercent) || 0;
                    const basePrice = parseFloat(item.unitPrice) || 0;
                    const qty = parseFloat(item.quantity) || 0;
                    const clientUnitPrice = basePrice * (1 + markupPercent / 100);
                    const clientLineTotal = qty * clientUnitPrice;
                    
                    return (
                      <div key={index} className="p-3 flex justify-between items-center gap-4">
                        <div className="flex-1">
                          <span className="font-medium">{item.description || "Item"}</span>
                          {!hideClientCostBreakdown && (
                            <span className="text-sm text-muted-foreground ml-2">x{qty}</span>
                          )}
                        </div>
                        <div className="text-right font-mono">
                          {hideClientCostBreakdown ? (
                            <span>£{clientLineTotal.toFixed(2)}</span>
                          ) : (
                            <div className="text-sm">
                              <div>£{clientUnitPrice.toFixed(2)} x {qty}</div>
                              <div className="font-medium">£{clientLineTotal.toFixed(2)}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  {(() => {
                    const markupPercent = useDefaultMarkup 
                      ? parseFloat(defaultMarkupPercent) 
                      : parseFloat(customMarkupPercent) || 0;
                    const clientSubtotal = quoteItems.reduce((sum, item) => {
                      const basePrice = parseFloat(item.unitPrice) || 0;
                      const qty = parseFloat(item.quantity) || 0;
                      const clientUnitPrice = basePrice * (1 + markupPercent / 100);
                      return sum + (qty * clientUnitPrice);
                    }, 0);
                    
                    let clientDiscount = 0;
                    if (discountType && discountValue) {
                      if (discountType === "percentage") {
                        clientDiscount = clientSubtotal * (parseFloat(discountValue) / 100);
                      } else {
                        clientDiscount = parseFloat(discountValue) || 0;
                      }
                    }
                    
                    const afterDiscount = clientSubtotal - clientDiscount;
                    const clientTax = taxEnabled ? afterDiscount * (parseFloat(taxRate) / 100) : 0;
                    const clientTotal = afterDiscount + clientTax;
                    
                    return (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-mono">£{clientSubtotal.toFixed(2)}</span>
                        </div>
                        {clientDiscount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Discount</span>
                            <span className="font-mono text-green-600">-£{clientDiscount.toFixed(2)}</span>
                          </div>
                        )}
                        {taxEnabled && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">VAT ({taxRate}%)</span>
                            <span className="font-mono">£{clientTax.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-border">
                          <span className="font-semibold">Total</span>
                          <span className="font-mono font-semibold text-lg">£{clientTotal.toFixed(2)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
                
                {(() => {
                  const effectiveMarkup = useDefaultMarkup 
                    ? parseFloat(defaultMarkupPercent) 
                    : parseFloat(customMarkupPercent) || 0;
                  return effectiveMarkup > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                      <Percent className="w-3 h-3" />
                      <span>
                        {effectiveMarkup}% markup applied to all items (admin view only - hidden from client)
                      </span>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
          
          <div className="flex justify-end pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setShowClientPreview(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

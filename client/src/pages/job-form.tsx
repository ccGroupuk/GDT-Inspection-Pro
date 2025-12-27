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
import { ArrowLeft, Save, CheckCircle, Handshake, RefreshCw, Plus, Trash2 } from "lucide-react";
import { Link } from "wouter";
import type { Job, Contact, TradePartner, InsertJob, QuoteItem } from "@shared/schema";
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
      // Include quote settings in the job data
      const jobData = {
        ...values,
        taxEnabled,
        taxRate,
        discountType: discountType || null,
        discountValue: discountValue || null,
        quotedValue: quoteTotals.grandTotal.toFixed(2),
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

  if (isLoading && isEdit) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/jobs">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Edit Job</h1>
        </div>
        <FormSkeleton />
      </div>
    );
  }

  const contacts = data?.contacts || [];
  const partners = data?.partners || [];
  const activePartners = partners.filter(p => p.isActive);

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/jobs">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Job" : "New Job"}</h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
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
                  <Label htmlFor="partnerId">Assign Partner</Label>
                  <Select
                    value={form.watch("partnerId") || ""}
                    onValueChange={(value) => form.setValue("partnerId", value || null)}
                  >
                    <SelectTrigger data-testid="select-partner">
                      <SelectValue placeholder="Select a partner" />
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
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle className="text-base">Quote Builder</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addQuoteItem}
                data-testid="button-add-quote-item"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {quoteItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No items added yet. Click "Add Item" to build your quote.</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                <div className="space-y-2">
                  <Label htmlFor="partnerCharge">Partner Charge (£)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register("partnerCharge")}
                    placeholder="0.00"
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
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Search, Handshake, Phone, Mail, Star, Edit, Trash2, CheckCircle, UserPlus, Copy, ExternalLink, MessageSquare, KeyRound, Eye, EyeOff, Landmark } from "lucide-react";
import { SendMessageDialog } from "@/components/send-message-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { TradePartner, InsertTradePartner } from "@shared/schema";
import { insertTradePartnerSchema, TRADE_CATEGORIES } from "@shared/schema";
import { z } from "zod";

type PartnerPortalAccessWithToken = {
  id: string | null;
  partnerId: string;
  isActive: boolean;
  inviteStatus?: "accepted" | "pending";
  portalToken?: string;
  accessToken?: string | null;
};

const formSchema = insertTradePartnerSchema.extend({
  businessName: z.string().min(1, "Business name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  phone: z.string().min(1, "Phone is required"),
  tradeCategory: z.string().min(1, "Trade category is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function Partners() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<TradePartner | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [resetPasswordPartner, setResetPasswordPartner] = useState<TradePartner | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const { data: partners = [], isLoading } = useQuery<TradePartner[]>({
    queryKey: ["/api/partners"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      contactName: "",
      phone: "",
      email: "",
      tradeCategory: "",
      coverageAreas: "",
      paymentTerms: "",
      commissionType: "percentage",
      commissionValue: "10",
      insuranceVerified: false,
      rating: 5,
      notes: "",
      isActive: true,
      emergencyAvailable: false,
      emergencyCalloutFee: "",

      // Bank details
      bankName: "",
      bankAccountName: "",
      bankSortCode: "",
      bankAccountNumber: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: FormData) => {
      if (editingPartner) {
        return apiRequest("PATCH", `/api/partners/${editingPartner.id}`, values);
      }
      return apiRequest("POST", "/api/partners", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: editingPartner ? "Partner updated" : "Partner added",
        description: editingPartner ? "The partner has been updated." : "New trade partner has been added.",
      });
      setIsDialogOpen(false);
      setEditingPartner(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/partners/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Partner removed" });
    },
    onError: () => {
      toast({ title: "Error removing partner", variant: "destructive" });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      const response = await apiRequest("POST", `/api/partners/${partnerId}/send-portal-invite`);
      return response.json();
    },
    onSuccess: (data) => {
      const inviteUrl = `${window.location.origin}${data.inviteLink}`;
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partners/portal-access"] });
      toast({
        title: "Invitation sent",
        description: `Invite link: ${inviteUrl}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ partnerId, password }: { partnerId: string; password: string }) => {
      const response = await apiRequest("POST", `/api/partners/${partnerId}/reset-password`, { newPassword: password });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Password Reset",
        description: data.message || "Password has been reset successfully.",
      });
      setResetPasswordPartner(null);
      setNewPassword("");
      setShowPassword(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  const getPartnerPortalAccess = async (partnerId: string): Promise<PartnerPortalAccessWithToken | null> => {
    try {
      const response = await fetch(`/api/partners/${partnerId}/portal-access`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch {
      return null;
    }
  };

  const copyPartnerPortalLink = (token: string, isPending: boolean) => {
    const path = isPending ? `/partner-portal/invite/${token}` : `/partner-portal/login?token=${token}`;
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: isPending ? "Invite link copied to clipboard" : "Portal link copied to clipboard",
    });
  };

  const openPartnerPortal = (token: string, isPending: boolean = false) => {
    const path = isPending ? `/partner-portal/invite/${token}` : `/partner-portal/login?token=${token}`;
    window.open(path, "_blank");
  };

  const { data: partnerPortalAccessMap = {} } = useQuery({
    queryKey: ["/api/partners/portal-access", partners.map(p => p.id).join(",")],
    queryFn: async () => {
      const accessMap: Record<string, PartnerPortalAccessWithToken | null> = {};
      await Promise.all(
        partners.map(async (partner) => {
          accessMap[partner.id] = await getPartnerPortalAccess(partner.id);
        })
      );
      return accessMap;
    },
    enabled: partners.length > 0,
  });

  const filteredPartners = partners.filter(partner => {
    // Search filter
    const query = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      partner.businessName.toLowerCase().includes(query) ||
      partner.contactName.toLowerCase().includes(query) ||
      partner.tradeCategory.toLowerCase().includes(query) ||
      partner.coverageAreas?.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter === "all") return true;
    if (statusFilter === "applicants") return partner.status === "applicant";
    if (statusFilter === "active") return partner.status === "active" && partner.isActive;
    if (statusFilter === "inactive") return !partner.isActive || partner.status === "inactive";

    return true;
  });

  const openEditDialog = (partner: TradePartner) => {
    setEditingPartner(partner);
    form.reset({
      businessName: partner.businessName,
      contactName: partner.contactName,
      phone: partner.phone,
      email: partner.email || "",
      tradeCategory: partner.tradeCategory,
      coverageAreas: partner.coverageAreas || "",
      paymentTerms: partner.paymentTerms || "",
      commissionType: partner.commissionType || "percentage",
      commissionValue: partner.commissionValue || "10",
      insuranceVerified: partner.insuranceVerified || false,
      rating: partner.rating || 5,
      notes: partner.notes || "",
      isActive: partner.isActive ?? true,
      emergencyAvailable: partner.emergencyAvailable || false,
      emergencyCalloutFee: partner.emergencyCalloutFee || "",
      bankName: partner.bankName || "",
      bankAccountName: partner.bankAccountName || "",
      bankSortCode: partner.bankSortCode || "",
      bankAccountNumber: partner.bankAccountNumber || "",
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingPartner(null);
    form.reset({
      businessName: "",
      contactName: "",
      phone: "",
      email: "",
      tradeCategory: "",
      coverageAreas: "",
      paymentTerms: "",
      commissionType: "percentage",
      commissionValue: "10",
      insuranceVerified: false,
      rating: 5,
      notes: "",
      isActive: true,
      emergencyAvailable: false,
      emergencyCalloutFee: "",
      bankName: "",
      bankAccountName: "",
      bankSortCode: "",
      bankAccountNumber: "",
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Trade Partners</h1>
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="applicants" className="relative">
                Applicants
                {partners.filter(p => p.status === "applicant").length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                )}
              </TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openCreateDialog} data-testid="button-add-partner">
              <Plus className="w-4 h-4" />
              Add Partner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPartner ? "Edit Partner" : "Add Trade Partner"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    {...form.register("businessName")}
                    placeholder="Company name"
                    data-testid="input-partner-business-name"
                  />
                  {form.formState.errors.businessName && (
                    <p className="text-xs text-destructive">{form.formState.errors.businessName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name *</Label>
                  <Input
                    {...form.register("contactName")}
                    placeholder="Primary contact"
                    data-testid="input-partner-contact-name"
                  />
                  {form.formState.errors.contactName && (
                    <p className="text-xs text-destructive">{form.formState.errors.contactName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    {...form.register("phone")}
                    placeholder="Phone number"
                    data-testid="input-partner-phone"
                  />
                  {form.formState.errors.phone && (
                    <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    {...form.register("email")}
                    type="email"
                    placeholder="Email address"
                    data-testid="input-partner-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tradeCategory">Trade Category *</Label>
                  <Select
                    value={form.watch("tradeCategory")}
                    onValueChange={(value) => form.setValue("tradeCategory", value)}
                  >
                    <SelectTrigger data-testid="select-partner-trade-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRADE_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.tradeCategory && (
                    <p className="text-xs text-destructive">{form.formState.errors.tradeCategory.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coverageAreas">Coverage Areas</Label>
                  <Input
                    {...form.register("coverageAreas")}
                    placeholder="e.g. Cardiff, Caerphilly"
                    data-testid="input-partner-coverage"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="commissionType">Commission Type</Label>
                  <Select
                    value={form.watch("commissionType") || "percentage"}
                    onValueChange={(value) => form.setValue("commissionType", value)}
                  >
                    <SelectTrigger data-testid="select-commission-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Fee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commissionValue">
                    {form.watch("commissionType") === "percentage" ? "Commission %" : "Fixed Fee (£)"}
                  </Label>
                  <Input
                    {...form.register("commissionValue")}
                    type="number"
                    step="0.01"
                    placeholder="10"
                    data-testid="input-commission-value"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Input
                    {...form.register("paymentTerms")}
                    placeholder="e.g. Net 30"
                    data-testid="input-payment-terms"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.watch("insuranceVerified") || false}
                    onCheckedChange={(checked) => form.setValue("insuranceVerified", checked)}
                    data-testid="switch-insurance"
                  />
                  <Label>Insurance Verified</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.watch("isActive") ?? true}
                    onCheckedChange={(checked) => form.setValue("isActive", checked)}
                    data-testid="switch-active"
                  />
                  <Label>Active Partner</Label>
                </div>
              </div>

              {/* Emergency Callout Section */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3">Emergency Callout</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.watch("emergencyAvailable") || false}
                      onCheckedChange={(checked) => form.setValue("emergencyAvailable", checked)}
                      data-testid="switch-emergency-available"
                    />
                    <Label>Available for Emergency Callouts</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyCalloutFee">First Hour Callout Fee</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                      <Input
                        {...form.register("emergencyCalloutFee")}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-7"
                        data-testid="input-emergency-callout-fee"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Labour charge for first hour of emergency work</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Landmark className="w-4 h-4" />
                  Bank Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      {...form.register("bankName")}
                      placeholder="e.g. Barclays"
                      data-testid="input-bank-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankAccountName">Account Name</Label>
                    <Input
                      {...form.register("bankAccountName")}
                      placeholder="Account holder name"
                      data-testid="input-bank-account-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankSortCode">Sort Code</Label>
                    <Input
                      {...form.register("bankSortCode")}
                      placeholder="XX-XX-XX"
                      data-testid="input-bank-sort-code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankAccountNumber">Account Number</Label>
                    <Input
                      {...form.register("bankAccountNumber")}
                      placeholder="12345678"
                      data-testid="input-bank-account-number"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  {...form.register("notes")}
                  placeholder="Additional notes about this partner..."
                  data-testid="textarea-partner-notes"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-partner">
                  {createMutation.isPending ? "Saving..." : editingPartner ? "Update" : "Add Partner"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search partners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-partners"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPartners.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="No trade partners"
          description={searchQuery ? "Try adjusting your search" : "Add your first trade partner to start assigning jobs"}
          action={!searchQuery ? { label: "Add Partner", onClick: openCreateDialog } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map(partner => (
            <Card key={partner.id} className={!partner.isActive ? "opacity-60" : ""} data-testid={`partner-card-${partner.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{partner.businessName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{partner.contactName}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <SendMessageDialog
                      recipientId={partner.id}
                      recipientName={partner.businessName}
                      recipientType="partner"
                      trigger={
                        <Button variant="ghost" size="icon" data-testid={`button-message-partner-${partner.id}`}>
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      }
                    />
                    {(partnerPortalAccessMap[partner.id]?.isActive || partnerPortalAccessMap[partner.id]?.inviteStatus === "pending") && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setResetPasswordPartner(partner)}
                            data-testid={`button-reset-password-partner-${partner.id}`}
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Reset Password</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(partner)}
                      data-testid={`button-edit-partner-${partner.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Remove this partner?")) {
                          deleteMutation.mutate(partner.id);
                        }
                      }}
                      data-testid={`button-delete-partner-${partner.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{partner.tradeCategory}</Badge>
                  {partner.insuranceVerified && (
                    <Badge variant="outline" className="gap-1 text-green-600 border-green-600/20">
                      <CheckCircle className="w-3 h-3" />
                      Insured
                    </Badge>
                  )}
                  {partner.status === "applicant" && (
                    <Badge variant="default" className="bg-primary hover:bg-primary/90">Applicant</Badge>
                  )}
                  {!partner.isActive && (
                    <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    <a href={`tel:${partner.phone}`} className="hover:underline">{partner.phone}</a>
                  </div>
                  {partner.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      <a href={`mailto:${partner.email}`} className="hover:underline truncate">{partner.email}</a>
                    </div>
                  )}
                </div>

                {partner.coverageAreas && (
                  <p className="text-xs text-muted-foreground">
                    Coverage: {partner.coverageAreas}
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < (partner.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-muted"}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {partner.commissionType === "percentage"
                      ? `${partner.commissionValue}% commission`
                      : `£${partner.commissionValue} fixed`
                    }
                  </span>
                </div>

                {(() => {
                  const portalAccess = partnerPortalAccessMap[partner.id];
                  return (
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      {portalAccess?.isActive ? (
                        <Badge variant="outline" className="gap-1 text-green-600 border-green-600/20" data-testid={`badge-partner-portal-active-${partner.id}`}>
                          <CheckCircle className="w-3 h-3" />
                          Portal Active
                        </Badge>
                      ) : portalAccess?.inviteStatus === "pending" ? (
                        <Badge variant="secondary" className="gap-1" data-testid={`badge-partner-portal-pending-${partner.id}`}>
                          Invite Pending
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">No portal access</span>
                      )}
                      <div className="flex items-center gap-1">
                        {portalAccess?.portalToken ? (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyPartnerPortalLink(portalAccess.portalToken!, portalAccess.inviteStatus === "pending")}
                                  data-testid={`button-copy-partner-portal-link-${partner.id}`}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{portalAccess.isActive ? "Copy portal link" : "Copy invite link"}</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openPartnerPortal(portalAccess.portalToken!, portalAccess.inviteStatus === "pending")}
                                  data-testid={`button-open-partner-portal-${partner.id}`}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Open Portal</p>
                              </TooltipContent>
                            </Tooltip>
                          </>
                        ) : partner.email ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => inviteMutation.mutate(partner.id)}
                                disabled={inviteMutation.isPending}
                                data-testid={`button-invite-partner-${partner.id}`}
                              >
                                <UserPlus className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Send Portal Invite</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : null}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPasswordPartner} onOpenChange={(open) => {
        if (!open) {
          setResetPasswordPartner(null);
          setNewPassword("");
          setShowPassword(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Partner Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Set a new password for <strong>{resetPasswordPartner?.businessName}</strong>.
              {partnerPortalAccessMap[resetPasswordPartner?.id || ""]?.inviteStatus === "pending"
                ? " Once they accept the invite, they can log in with this password."
                : " They can use this password to log in to the partner portal."
              }
            </p>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  data-testid="input-partner-new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password-visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              {newPassword.length > 0 && newPassword.length < 6 && (
                <p className="text-sm text-destructive">Password must be at least 6 characters</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setResetPasswordPartner(null);
                  setNewPassword("");
                  setShowPassword(false);
                }}
                data-testid="button-cancel-reset-password"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (resetPasswordPartner && newPassword.length >= 6) {
                    resetPasswordMutation.mutate({ partnerId: resetPasswordPartner.id, password: newPassword });
                  }
                }}
                disabled={newPassword.length < 6 || resetPasswordMutation.isPending}
                data-testid="button-confirm-reset-password"
              >
                {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

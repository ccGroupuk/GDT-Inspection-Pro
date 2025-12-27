import { useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { FormSkeleton } from "@/components/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Edit, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Handshake,
  Calendar,
  CheckCircle,
  AlertCircle,
  Trash2,
  FileText,
} from "lucide-react";
import type { Job, Contact, TradePartner, Task, QuoteItem } from "@shared/schema";
import { PIPELINE_STAGES, DELIVERY_TYPES, PARTNER_STATUSES } from "@shared/schema";

interface JobDetailData {
  job: Job;
  contact: Contact;
  partner?: TradePartner;
  tasks: Task[];
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<JobDetailData>({
    queryKey: ["/api/jobs", id],
    enabled: Boolean(id),
  });

  // Fetch quote items
  const { data: quoteItems } = useQuery<QuoteItem[]>({
    queryKey: ["/api/jobs", id, "quote-items"],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${id}/quote-items`);
      if (!response.ok) throw new Error("Failed to fetch quote items");
      return response.json();
    },
    enabled: Boolean(id),
  });

  // Calculate quote totals from items - must be before any conditional returns
  const quoteTotals = useMemo(() => {
    const job = data?.job;
    if (!quoteItems || quoteItems.length === 0 || !job) return null;
    
    const subtotal = quoteItems.reduce((sum, item) => sum + (parseFloat(item.lineTotal) || 0), 0);
    
    let discountAmount = 0;
    if (job.discountType && job.discountValue) {
      if (job.discountType === "percentage") {
        discountAmount = subtotal * (parseFloat(job.discountValue) / 100);
      } else if (job.discountType === "fixed") {
        discountAmount = parseFloat(job.discountValue) || 0;
      }
    }
    
    const afterDiscount = subtotal - discountAmount;
    
    let taxAmount = 0;
    if (job.taxEnabled && job.taxRate) {
      taxAmount = afterDiscount * (parseFloat(job.taxRate) / 100);
    }
    
    const grandTotal = afterDiscount + taxAmount;
    
    return { subtotal, discountAmount, taxAmount, grandTotal };
  }, [quoteItems, data?.job]);

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return apiRequest("PATCH", `/api/jobs/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Status updated" });
    },
    onError: () => {
      toast({ title: "Error updating status", variant: "destructive" });
    },
  });

  const updatePartnerStatusMutation = useMutation({
    mutationFn: async (partnerStatus: string) => {
      return apiRequest("PATCH", `/api/jobs/${id}`, { partnerStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id] });
      toast({ title: "Partner status updated" });
    },
    onError: () => {
      toast({ title: "Error updating partner status", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/jobs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Job deleted" });
      navigate("/jobs");
    },
    onError: () => {
      toast({ title: "Error deleting job", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/jobs">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Job Details</h1>
        </div>
        <FormSkeleton />
      </div>
    );
  }

  if (!data?.job) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Job not found</p>
          <Link href="/jobs">
            <Button variant="ghost">Back to Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { job, contact, partner, tasks } = data;
  const deliveryType = DELIVERY_TYPES.find(t => t.value === job.deliveryType);
  const isPartnerJob = job.deliveryType === "partner" || job.deliveryType === "hybrid";

  const margin = job.quotedValue && job.partnerCharge 
    ? Number(job.quotedValue) - Number(job.partnerCharge)
    : job.cccMargin ? Number(job.cccMargin) : null;

  const marginPercentage = margin && job.quotedValue
    ? ((margin / Number(job.quotedValue)) * 100).toFixed(1)
    : null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3">
          <Link href="/jobs">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{job.jobNumber}</h1>
              <StatusBadge status={job.status} />
            </div>
            <p className="text-sm text-muted-foreground">{job.serviceType}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/jobs/${id}/edit`}>
            <Button variant="outline" className="gap-2" data-testid="button-edit-job">
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          </Link>
          <Button 
            variant="destructive" 
            size="icon"
            onClick={() => {
              if (confirm("Are you sure you want to delete this job?")) {
                deleteMutation.mutate();
              }
            }}
            data-testid="button-delete-job"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Job Address</p>
                    <p className="text-sm text-muted-foreground">{job.jobAddress}</p>
                    <p className="text-sm text-muted-foreground">{job.jobPostcode}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">
                      {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "-"}
                    </p>
                  </div>
                </div>
              </div>
              
              {job.description && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm font-medium mb-2">Description</p>
                  <p className="text-sm text-muted-foreground">{job.description}</p>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <p className="text-sm font-medium mb-3">Pipeline Status</p>
                <Select
                  value={job.status}
                  onValueChange={(value) => updateStatusMutation.mutate(value)}
                >
                  <SelectTrigger className="w-full max-w-xs" data-testid="select-job-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PIPELINE_STAGES.map(stage => (
                      <SelectItem key={stage.value} value={stage.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                          {stage.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Quote Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Quote Type</span>
                  <Badge variant="outline">{job.quoteType === "fixed" ? "Fixed Quote" : "Estimate"}</Badge>
                </div>

                {quoteItems && quoteItems.length > 0 ? (
                  <>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">Description</th>
                            <th className="text-right p-3 font-medium w-16">Qty</th>
                            <th className="text-right p-3 font-medium w-24">Price</th>
                            <th className="text-right p-3 font-medium w-24">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {quoteItems.map((item) => (
                            <tr key={item.id} data-testid={`quote-row-${item.id}`}>
                              <td className="p-3">{item.description}</td>
                              <td className="p-3 text-right font-mono text-muted-foreground">{item.quantity}</td>
                              <td className="p-3 text-right font-mono text-muted-foreground">£{parseFloat(item.unitPrice).toFixed(2)}</td>
                              <td className="p-3 text-right font-mono font-medium">£{parseFloat(item.lineTotal).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {quoteTotals && (
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-mono">£{quoteTotals.subtotal.toFixed(2)}</span>
                        </div>
                        {job.discountType && quoteTotals.discountAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Discount {job.discountType === "percentage" ? `(${job.discountValue}%)` : ""}
                            </span>
                            <span className="font-mono text-green-600 dark:text-green-400">
                              -£{quoteTotals.discountAmount.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {job.taxEnabled && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">VAT ({job.taxRate}%)</span>
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
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Quoted Value</span>
                    <span className="font-mono text-lg font-semibold">
                      {job.quotedValue ? `£${Number(job.quotedValue).toLocaleString()}` : "-"}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Deposit</span>
                    {job.depositRequired && (
                      job.depositReceived 
                        ? <CheckCircle className="w-4 h-4 text-green-600" />
                        : <AlertCircle className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                  <span className="font-mono text-sm font-semibold">
                    {job.depositRequired 
                      ? `£${Number(job.depositAmount || 0).toLocaleString()} ${job.depositReceived ? "(Received)" : "(Pending)"}`
                      : "Not required"
                    }
                  </span>
                </div>

                {isPartnerJob && (
                  <>
                    <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium">Partner Charge</span>
                      <span className="font-mono text-sm font-semibold">
                        {job.partnerCharge ? `£${Number(job.partnerCharge).toLocaleString()}` : "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-primary/10">
                      <span className="text-sm font-medium">CCC Margin</span>
                      <div className="text-right">
                        <span className="font-mono text-lg font-semibold text-primary">
                          {margin ? `£${margin.toLocaleString()}` : "-"}
                        </span>
                        {marginPercentage && (
                          <span className="text-xs text-muted-foreground ml-2">({marginPercentage}%)</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-medium">{contact.name}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                <a href={`tel:${contact.phone}`} className="hover:underline">{contact.phone}</a>
              </div>
              {contact.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a>
                </div>
              )}
              {contact.address && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <span>{contact.address}</span>
                </div>
              )}
              <Link href={`/contacts/${contact.id}`}>
                <Button variant="outline" size="sm" className="w-full mt-2">View Contact</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Delivery Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="mb-4">
                {deliveryType?.label || job.deliveryType}
              </Badge>
              
              {isPartnerJob && partner && (
                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Handshake className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{partner.businessName}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{partner.tradeCategory}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${partner.phone}`} className="hover:underline">{partner.phone}</a>
                  </div>
                  
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                      Partner Status
                    </p>
                    <Select
                      value={job.partnerStatus || "offered"}
                      onValueChange={(value) => updatePartnerStatusMutation.mutate(value)}
                    >
                      <SelectTrigger className="w-full" data-testid="select-partner-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PARTNER_STATUSES.map(status => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              {isPartnerJob && !partner && (
                <p className="text-sm text-muted-foreground">No partner assigned</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

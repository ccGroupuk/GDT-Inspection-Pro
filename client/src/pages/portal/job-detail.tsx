import { useMemo, useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalLayout } from "@/components/portal-layout";
import { usePortalAuth, portalApiRequest } from "@/hooks/use-portal-auth";
import { StatusBadge } from "@/components/status-badge";
import { PIPELINE_STAGES, PAYMENT_STATUSES } from "@shared/schema";
import { ArrowLeft, MapPin, Calendar, CheckCircle, Circle, PoundSterling, FileText, Receipt, Check, X } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PaymentRequest {
  id: string;
  type: string;
  amount: string;
  description: string | null;
  status: string;
  dueDate: string | null;
}

interface QuoteItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
}

interface PortalInvoice {
  id: string;
  referenceNumber: string;
  type: string;
  status: string;
  subtotal: string;
  discountType: string | null;
  discountValue: string | null;
  discountAmount: string | null;
  taxEnabled: boolean;
  taxRate: string | null;
  taxAmount: string | null;
  grandTotal: string;
  depositRequired: boolean;
  depositType: string | null;
  depositAmount: string | null;
  depositCalculated: string | null;
  notes: string | null;
  sentAt: string | null;
  createdAt: string;
}

interface PortalJobDetail {
  id: string;
  jobNumber: string;
  serviceType: string;
  description: string | null;
  status: string;
  jobAddress: string;
  jobPostcode: string;
  quotedValue: string | null;
  taxEnabled: boolean | null;
  taxRate: string | null;
  discountType: string | null;
  discountValue: string | null;
  quoteResponse: string | null;
  quoteRespondedAt: string | null;
  createdAt: string;
  paymentRequests: PaymentRequest[];
  quoteItems: QuoteItem[];
  invoices: PortalInvoice[];
}

export default function PortalJobDetail() {
  const [, params] = useRoute("/portal/jobs/:jobId");
  const jobId = params?.jobId || "";
  const { token, isAuthenticated } = usePortalAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/portal/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: job, isLoading, error } = useQuery<PortalJobDetail>({
    queryKey: ["/api/portal/jobs", jobId],
    queryFn: async () => {
      if (!token) throw new Error("No token");
      const response = await portalApiRequest("GET", `/api/portal/jobs/${jobId}`, token);
      if (!response.ok) {
        if (response.status === 401) {
          setLocation("/portal/login");
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch job");
      }
      return response.json();
    },
    enabled: !!token && !!jobId,
  });

  const { toast } = useToast();

  const quoteResponseMutation = useMutation({
    mutationFn: async (response: 'accepted' | 'declined') => {
      if (!token) throw new Error("No token");
      const res = await portalApiRequest("POST", `/api/portal/jobs/${jobId}/quote-response`, token, { response });
      if (!res.ok) {
        throw new Error("Failed to submit response");
      }
      return res.json();
    },
    onSuccess: (data, response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/jobs", jobId] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/jobs"] });
      toast({
        title: response === 'accepted' ? "Quote Accepted" : "Quote Declined",
        description: response === 'accepted' 
          ? "Thank you! We'll be in touch shortly to arrange the next steps." 
          : "Your response has been recorded. Please contact us if you have any questions.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit your response. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  // Show accept/decline buttons when status is quote_sent and no response yet
  const showQuoteResponse = job?.status === 'quote_sent' && !job?.quoteResponse;

  const currentStageIndex = job ? PIPELINE_STAGES.findIndex(s => s.value === job.status) : -1;

  // Calculate quote totals from items
  const quoteTotals = useMemo(() => {
    if (!job?.quoteItems || job.quoteItems.length === 0) return null;
    
    const subtotal = job.quoteItems.reduce((sum, item) => sum + (parseFloat(item.lineTotal) || 0), 0);
    
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
  }, [job?.quoteItems, job?.discountType, job?.discountValue, job?.taxEnabled, job?.taxRate]);

  const getPaymentStatusBadge = (status: string) => {
    const statusInfo = PAYMENT_STATUSES.find(s => s.value === status);
    if (!statusInfo) return <Badge variant="outline">{status}</Badge>;

    const colorMap: Record<string, string> = {
      "bg-yellow-500": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
      "bg-blue-500": "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
      "bg-green-500": "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
      "bg-red-500": "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    };

    return (
      <Badge variant="outline" className={colorMap[statusInfo.color] || ""}>
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/portal/jobs">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-job-detail-title">Job Details</h1>
            {job && (
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-mono">{job.jobNumber}</span>
              </p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
        ) : error || !job ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Failed to load job details. Please try again.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-lg" data-testid="text-service-type">
                      {job.serviceType}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span data-testid="text-job-address">{job.jobAddress}, {job.jobPostcode}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={job.status} />
                    {job.quotedValue && (
                      <span className="font-mono font-semibold" data-testid="text-quoted-value">
                        £{Number(job.quotedValue).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              {job.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground" data-testid="text-description">
                    {job.description}
                  </p>
                </CardContent>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Job Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative" data-testid="timeline-progress">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-4">
                    {PIPELINE_STAGES.map((stage, index) => {
                      const isCompleted = index < currentStageIndex;
                      const isCurrent = index === currentStageIndex;
                      const isPending = index > currentStageIndex;

                      return (
                        <div
                          key={stage.value}
                          className={`relative flex items-center gap-4 pl-10 ${
                            isPending ? "opacity-50" : ""
                          }`}
                          data-testid={`stage-${stage.value}`}
                        >
                          <div
                            className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center ${
                              isCompleted
                                ? "bg-green-500 text-white"
                                : isCurrent
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted border-2 border-border"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : isCurrent ? (
                              <Circle className="w-3 h-3 fill-current" />
                            ) : (
                              <Circle className="w-3 h-3" />
                            )}
                          </div>
                          <span
                            className={`text-sm ${
                              isCurrent ? "font-semibold" : ""
                            }`}
                          >
                            {stage.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {job.quoteItems && job.quoteItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Quote Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
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
                          {job.quoteItems.map((item) => (
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
                      <div className="space-y-2 pt-2 border-t">
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
                          <span className="font-semibold">Total</span>
                          <span className="font-mono font-semibold text-lg">
                            £{quoteTotals.grandTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    {showQuoteResponse && (
                      <div className="pt-4 border-t border-border space-y-3" data-testid="quote-response-section">
                        <p className="text-sm text-center text-muted-foreground">
                          Please review this quote and let us know your decision
                        </p>
                        <div className="flex gap-3 justify-center">
                          <Button
                            variant="outline"
                            onClick={() => quoteResponseMutation.mutate('declined')}
                            disabled={quoteResponseMutation.isPending}
                            data-testid="button-decline-quote"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Decline
                          </Button>
                          <Button
                            onClick={() => quoteResponseMutation.mutate('accepted')}
                            disabled={quoteResponseMutation.isPending}
                            data-testid="button-accept-quote"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Accept Quote
                          </Button>
                        </div>
                      </div>
                    )}

                    {job.quoteResponse && (
                      <div className="pt-4 border-t border-border" data-testid="quote-response-status">
                        <div className={`text-center p-3 rounded-lg ${
                          job.quoteResponse === 'accepted' 
                            ? 'bg-green-500/10 text-green-700 dark:text-green-400' 
                            : 'bg-red-500/10 text-red-700 dark:text-red-400'
                        }`}>
                          <p className="font-medium">
                            Quote {job.quoteResponse === 'accepted' ? 'Accepted' : 'Declined'}
                          </p>
                          {job.quoteRespondedAt && (
                            <p className="text-xs mt-1 opacity-75">
                              on {new Date(job.quoteRespondedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {job.invoices && job.invoices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {job.invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="p-4 rounded-lg bg-muted/50"
                        data-testid={`invoice-${invoice.id}`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-medium">
                              {invoice.referenceNumber}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {invoice.type === "invoice" ? "Invoice" : "Quote"}
                            </Badge>
                          </div>
                          <span className="font-mono font-semibold text-lg">
                            £{parseFloat(invoice.grandTotal).toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-mono">£{parseFloat(invoice.subtotal).toFixed(2)}</span>
                          </div>
                          {invoice.discountAmount && parseFloat(invoice.discountAmount) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Discount {invoice.discountType === "percentage" ? `(${invoice.discountValue}%)` : ""}
                              </span>
                              <span className="font-mono text-green-600 dark:text-green-400">
                                -£{parseFloat(invoice.discountAmount).toFixed(2)}
                              </span>
                            </div>
                          )}
                          {invoice.taxEnabled && invoice.taxAmount && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">VAT ({invoice.taxRate}%)</span>
                              <span className="font-mono">£{parseFloat(invoice.taxAmount).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-2 border-t border-border">
                            <span className="font-semibold">Total</span>
                            <span className="font-mono font-semibold">
                              £{parseFloat(invoice.grandTotal).toFixed(2)}
                            </span>
                          </div>
                          {invoice.depositRequired && invoice.depositCalculated && (
                            <div className="flex justify-between pt-2 border-t border-border">
                              <span className="text-muted-foreground">
                                Deposit Due {invoice.depositType === "percentage" ? `(${invoice.depositAmount}%)` : ""}
                              </span>
                              <span className="font-mono font-semibold text-primary">
                                £{parseFloat(invoice.depositCalculated).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {invoice.notes && (
                          <p className="mt-3 text-sm text-muted-foreground border-t border-border pt-3">
                            {invoice.notes}
                          </p>
                        )}
                        
                        <div className="mt-3 text-xs text-muted-foreground">
                          Sent: {invoice.sentAt ? new Date(invoice.sentAt).toLocaleDateString() : "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {job.paymentRequests && job.paymentRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <PoundSterling className="w-4 h-4" />
                    Payment Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {job.paymentRequests.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/50"
                        data-testid={`payment-${payment.id}`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium capitalize">
                              {payment.type.replace("_", " ")}
                            </span>
                            {getPaymentStatusBadge(payment.status)}
                          </div>
                          {payment.description && (
                            <p className="text-sm text-muted-foreground">
                              {payment.description}
                            </p>
                          )}
                          {payment.dueDate && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              Due: {new Date(payment.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <span className="font-mono font-semibold text-lg" data-testid={`payment-amount-${payment.id}`}>
                          £{Number(payment.amount).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </PortalLayout>
  );
}

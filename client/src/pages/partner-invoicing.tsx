import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/stat-card";
import { 
  PoundSterling, 
  FileText, 
  Clock,
  CheckCircle2,
  Send,
  Plus,
  Eye,
  Loader2,
  AlertCircle,
  CreditCard,
  Calendar,
  Building2,
  Receipt,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TradePartner, Job } from "@shared/schema";

interface PartnerFeeAccrual {
  id: string;
  partnerId: string;
  jobId: string;
  feeType: string;
  feeValue: string;
  jobValue: string;
  feeAmount: string;
  description: string | null;
  status: string;
  invoiceId: string | null;
  accrualDate: string;
  partner?: TradePartner;
  job?: Job;
}

interface PartnerInvoice {
  id: string;
  invoiceNumber: string;
  partnerId: string;
  periodStart: string;
  periodEnd: string;
  subtotal: string;
  totalAmount: string;
  amountPaid: string;
  amountDue: string;
  status: string;
  issueDate: string | null;
  dueDate: string | null;
  paidDate: string | null;
  notes: string | null;
  createdAt: string;
  partner?: TradePartner;
  lineItems?: PartnerFeeAccrual[];
  payments?: PartnerInvoicePayment[];
}

interface PartnerInvoicePayment {
  id: string;
  invoiceId: string;
  partnerId: string;
  amount: string;
  paymentMethod: string | null;
  paymentReference: string | null;
  notes: string | null;
  paymentDate: string;
}

export default function PartnerInvoicing() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("all");
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PartnerInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [generatePartnerId, setGeneratePartnerId] = useState("");

  const { data: partners = [] } = useQuery<TradePartner[]>({
    queryKey: ["/api/trade-partners"],
  });

  const { data: pendingAccruals = [], isLoading: accrualsLoading } = useQuery<PartnerFeeAccrual[]>({
    queryKey: ["/api/partner-fee-accruals", { status: "pending" }],
  });

  const { data: allAccruals = [] } = useQuery<PartnerFeeAccrual[]>({
    queryKey: ["/api/partner-fee-accruals"],
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<PartnerInvoice[]>({
    queryKey: ["/api/partner-invoices"],
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: async (data: { partnerId: string; periodStart: string; periodEnd: string }) => {
      return apiRequest("POST", "/api/partner-invoices/generate", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner-fee-accruals"] });
      setIsGenerateDialogOpen(false);
      setGeneratePartnerId("");
      toast({ title: "Invoice generated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to generate invoice", description: error.message, variant: "destructive" });
    },
  });

  const issueInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      return apiRequest("POST", `/api/partner-invoices/${invoiceId}/issue`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-invoices"] });
      toast({ title: "Invoice issued successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to issue invoice", description: error.message, variant: "destructive" });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (data: { invoiceId: string; amount: string; paymentMethod: string; paymentReference: string }) => {
      return apiRequest("POST", `/api/partner-invoices/${data.invoiceId}/payments`, {
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentReference: data.paymentReference,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner-fee-accruals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-transactions"] });
      setIsPaymentDialogOpen(false);
      setSelectedInvoice(null);
      setPaymentAmount("");
      setPaymentMethod("bank_transfer");
      setPaymentReference("");
      toast({ title: "Payment recorded successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to record payment", description: error.message, variant: "destructive" });
    },
  });

  const pendingTotal = pendingAccruals.reduce((sum, a) => sum + parseFloat(a.feeAmount), 0);
  const invoicedTotal = invoices
    .filter(inv => inv.status === "issued" || inv.status === "partial")
    .reduce((sum, inv) => sum + parseFloat(inv.amountDue || "0"), 0);
  const paidTotal = invoices
    .filter(inv => inv.status === "paid")
    .reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0);

  const partnersWithPendingFees = partners.filter(p => 
    pendingAccruals.some(a => a.partnerId === p.id)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "issued":
        return <Badge variant="default">Issued</Badge>;
      case "partial":
        return <Badge className="bg-yellow-500">Partial</Badge>;
      case "paid":
        return <Badge className="bg-green-600">Paid</Badge>;
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleGenerateInvoice = () => {
    if (!generatePartnerId) return;
    
    const periodEnd = new Date();
    const periodStart = subWeeks(periodEnd, 1);
    
    generateInvoiceMutation.mutate({
      partnerId: generatePartnerId,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    });
  };

  const handleRecordPayment = () => {
    if (!selectedInvoice || !paymentAmount) return;
    
    recordPaymentMutation.mutate({
      invoiceId: selectedInvoice.id,
      amount: paymentAmount,
      paymentMethod,
      paymentReference,
    });
  };

  const filteredAccruals = selectedPartnerId === "all" 
    ? pendingAccruals 
    : pendingAccruals.filter(a => a.partnerId === selectedPartnerId);

  const filteredInvoices = selectedPartnerId === "all"
    ? invoices
    : invoices.filter(inv => inv.partnerId === selectedPartnerId);

  return (
    <div className="p-6 space-y-6" data-testid="partner-invoicing-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="page-title">Partner Invoicing</h1>
          <p className="text-muted-foreground">
            Track partner fees, generate invoices, and record payments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
            <SelectTrigger className="w-[200px]" data-testid="select-partner-filter">
              <SelectValue placeholder="All Partners" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Partners</SelectItem>
              {partners.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.businessName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Pending Fees"
          value={`£${pendingTotal.toFixed(2)}`}
          icon={Clock}
          description={`${pendingAccruals.length} job${pendingAccruals.length !== 1 ? 's' : ''} awaiting invoice`}
        />
        <StatCard
          title="Invoiced (Unpaid)"
          value={`£${invoicedTotal.toFixed(2)}`}
          icon={FileText}
          description={`${invoices.filter(inv => inv.status === "issued" || inv.status === "partial").length} outstanding invoice${invoices.filter(inv => inv.status === "issued" || inv.status === "partial").length !== 1 ? 's' : ''}`}
        />
        <StatCard
          title="Collected This Month"
          value={`£${paidTotal.toFixed(2)}`}
          icon={PoundSterling}
          description={`${invoices.filter(inv => inv.status === "paid").length} paid invoice${invoices.filter(inv => inv.status === "paid").length !== 1 ? 's' : ''}`}
        />
        <StatCard
          title="Total Owed"
          value={`£${(pendingTotal + invoicedTotal).toFixed(2)}`}
          icon={Receipt}
          description="All outstanding partner fees"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending Fees ({pendingAccruals.length})
          </TabsTrigger>
          <TabsTrigger value="invoices" data-testid="tab-invoices">
            Invoices ({invoices.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>Pending Fee Accruals</CardTitle>
              {partnersWithPendingFees.length > 0 && (
                <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-generate-invoice">
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Invoice
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Generate Partner Invoice</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Select Partner</Label>
                        <Select value={generatePartnerId} onValueChange={setGeneratePartnerId}>
                          <SelectTrigger data-testid="select-generate-partner">
                            <SelectValue placeholder="Choose a partner" />
                          </SelectTrigger>
                          <SelectContent>
                            {partnersWithPendingFees.map(p => {
                              const partnerPending = pendingAccruals.filter(a => a.partnerId === p.id);
                              const partnerTotal = partnerPending.reduce((sum, a) => sum + parseFloat(a.feeAmount), 0);
                              return (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.businessName} - {partnerPending.length} fee{partnerPending.length !== 1 ? 's' : ''} (£{partnerTotal.toFixed(2)})
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      {generatePartnerId && (
                        <div className="bg-muted p-4 rounded-md">
                          <p className="text-sm text-muted-foreground">
                            This will consolidate all pending fees for the selected partner into a single invoice.
                          </p>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button 
                        onClick={handleGenerateInvoice}
                        disabled={!generatePartnerId || generateInvoiceMutation.isPending}
                        data-testid="button-confirm-generate"
                      >
                        {generateInvoiceMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Generate Invoice
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {accrualsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : filteredAccruals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No pending fees</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Job Value</TableHead>
                      <TableHead>Fee Type</TableHead>
                      <TableHead>Fee Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAccruals.map(accrual => (
                      <TableRow key={accrual.id} data-testid={`row-accrual-${accrual.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            {accrual.partner?.businessName || "Unknown"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {accrual.job?.jobNumber || accrual.jobId}
                          </span>
                        </TableCell>
                        <TableCell>£{parseFloat(accrual.jobValue).toFixed(2)}</TableCell>
                        <TableCell>
                          {accrual.feeType === "percentage" 
                            ? `${accrual.feeValue}%` 
                            : `£${parseFloat(accrual.feeValue).toFixed(2)} flat`}
                        </TableCell>
                        <TableCell className="font-medium">
                          £{parseFloat(accrual.feeAmount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(accrual.accrualDate), "dd MMM yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Partner Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No invoices yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map(invoice => (
                      <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                        <TableCell className="font-mono">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          {invoice.partner?.businessName || "Unknown"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(invoice.periodStart), "dd MMM")} - {format(new Date(invoice.periodEnd), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell>£{parseFloat(invoice.totalAmount).toFixed(2)}</TableCell>
                        <TableCell className="text-green-600">
                          £{parseFloat(invoice.amountPaid || "0").toFixed(2)}
                        </TableCell>
                        <TableCell className="font-medium">
                          £{parseFloat(invoice.amountDue || "0").toFixed(2)}
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setIsViewDialogOpen(true);
                              }}
                              data-testid={`button-view-${invoice.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {invoice.status === "draft" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => issueInvoiceMutation.mutate(invoice.id)}
                                disabled={issueInvoiceMutation.isPending}
                                data-testid={`button-issue-${invoice.id}`}
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            )}
                            {(invoice.status === "issued" || invoice.status === "partial") && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedInvoice(invoice);
                                  setPaymentAmount(invoice.amountDue || "0");
                                  setIsPaymentDialogOpen(true);
                                }}
                                data-testid={`button-payment-${invoice.id}`}
                              >
                                <CreditCard className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedInvoice && (
              <div className="bg-muted p-4 rounded-md space-y-2">
                <p className="font-medium">{selectedInvoice.invoiceNumber}</p>
                <p className="text-sm text-muted-foreground">
                  Partner: {selectedInvoice.partner?.businessName}
                </p>
                <p className="text-sm">
                  Amount Due: <span className="font-medium">£{parseFloat(selectedInvoice.amountDue || "0").toFixed(2)}</span>
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Payment Amount</Label>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                data-testid="input-payment-amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger data-testid="select-payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentReference">Reference (optional)</Label>
              <Input
                id="paymentReference"
                value={paymentReference}
                onChange={e => setPaymentReference(e.target.value)}
                placeholder="e.g., Bank reference"
                data-testid="input-payment-reference"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={handleRecordPayment}
              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || recordPaymentMutation.isPending}
              data-testid="button-confirm-payment"
            >
              {recordPaymentMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="font-mono font-medium">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedInvoice.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Partner</p>
                  <p className="font-medium">{selectedInvoice.partner?.businessName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Period</p>
                  <p>{format(new Date(selectedInvoice.periodStart), "dd MMM")} - {format(new Date(selectedInvoice.periodEnd), "dd MMM yyyy")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-medium text-lg">£{parseFloat(selectedInvoice.totalAmount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount Due</p>
                  <p className="font-medium text-lg">£{parseFloat(selectedInvoice.amountDue || "0").toFixed(2)}</p>
                </div>
              </div>
              {selectedInvoice.issueDate && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Issued: {format(new Date(selectedInvoice.issueDate), "dd MMM yyyy")}</span>
                  {selectedInvoice.dueDate && (
                    <span>Due: {format(new Date(selectedInvoice.dueDate), "dd MMM yyyy")}</span>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

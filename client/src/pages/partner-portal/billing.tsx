import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePartnerPortalAuth } from "@/hooks/use-partner-portal-auth";
import { useTabNotification } from "@/hooks/use-tab-notification";
import { 
  Briefcase, 
  LogOut, 
  Loader2, 
  Calendar, 
  HelpCircle, 
  Settings,
  Receipt,
  FileText,
  PoundSterling,
  Clock,
  CheckCircle2,
  Eye,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import type { Job } from "@shared/schema";

interface PartnerBalance {
  pendingFees: string;
  pendingCount: number;
  invoicedBalance: string;
  invoiceCount: number;
  totalOwed: string;
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
  lineItems?: PartnerFeeAccrual[];
  payments?: PartnerInvoicePayment[];
}

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
  job?: { id: string; jobNumber: string; serviceType: string } | null;
}

interface PartnerInvoicePayment {
  id: string;
  invoiceId: string;
  amount: string;
  paymentMethod: string | null;
  paymentReference: string | null;
  notes: string | null;
  paymentDate: string;
}

export default function PartnerPortalBilling() {
  const { token, isAuthenticated, logout } = usePartnerPortalAuth();
  const [, setLocation] = useLocation();
  const [selectedInvoice, setSelectedInvoice] = useState<PartnerInvoice | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  useTabNotification({ portalType: "partner", accessToken: token });

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/partner-portal/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: balance, isLoading: balanceLoading } = useQuery<PartnerBalance>({
    queryKey: ["/api/partner-portal/balance"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await fetch("/api/partner-portal/balance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load balance");
      return res.json();
    },
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery<PartnerInvoice[]>({
    queryKey: ["/api/partner-portal/invoices"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await fetch("/api/partner-portal/invoices", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load invoices");
      return res.json();
    },
  });

  const fetchInvoiceDetails = async (invoiceId: string) => {
    const res = await fetch(`/api/partner-portal/invoices/${invoiceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to load invoice details");
    return res.json();
  };

  const handleViewInvoice = async (invoice: PartnerInvoice) => {
    try {
      const details = await fetchInvoiceDetails(invoice.id);
      setSelectedInvoice(details);
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error("Failed to load invoice details:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "issued":
        return <Badge variant="default">Issued</Badge>;
      case "partial":
        return <Badge className="bg-yellow-500">Partial Payment</Badge>;
      case "paid":
        return <Badge className="bg-green-600">Paid</Badge>;
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const navItems = [
    { icon: Briefcase, label: "Jobs", path: "/partner-portal/jobs" },
    { icon: Calendar, label: "Calendar", path: "/partner-portal/calendar" },
    { icon: Receipt, label: "Billing", path: "/partner-portal/billing", active: true },
    { icon: Settings, label: "Profile", path: "/partner-portal/profile" },
    { icon: HelpCircle, label: "Help", path: "/partner-portal/help" },
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold" data-testid="portal-title">Partner Portal</h1>
              <Badge variant="secondary">Trade Partner</Badge>
            </div>
            <div className="flex items-center gap-2">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <Button 
                    variant={item.active ? "default" : "ghost"} 
                    size="sm"
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              ))}
              <Button variant="ghost" size="sm" onClick={logout} data-testid="button-logout">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold" data-testid="page-heading">Billing</h2>
          <p className="text-muted-foreground">View your fees and invoices</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Fees
              </CardTitle>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {balanceLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <p className="text-2xl font-bold" data-testid="text-pending-amount">
                    £{parseFloat(balance?.pendingFees || "0").toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {balance?.pendingCount || 0} job{(balance?.pendingCount || 0) !== 1 ? 's' : ''} awaiting invoice
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Invoiced Balance
              </CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {balanceLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <p className="text-2xl font-bold" data-testid="text-invoiced-amount">
                    £{parseFloat(balance?.invoicedBalance || "0").toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {balance?.invoiceCount || 0} outstanding invoice{(balance?.invoiceCount || 0) !== 1 ? 's' : ''}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Owed to CCC
              </CardTitle>
              <PoundSterling className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {balanceLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-orange-600" data-testid="text-total-owed">
                    £{parseFloat(balance?.totalOwed || "0").toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Includes pending and invoiced fees
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : !invoices || invoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No invoices yet</p>
                <p className="text-sm">Invoices will appear here once generated</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                      <TableCell className="font-mono">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(invoice.periodStart), "dd MMM")} - {format(new Date(invoice.periodEnd), "dd MMM yy")}
                      </TableCell>
                      <TableCell>£{parseFloat(invoice.totalAmount).toFixed(2)}</TableCell>
                      <TableCell className="text-green-600">
                        £{parseFloat(invoice.amountPaid || "0").toFixed(2)}
                      </TableCell>
                      <TableCell className="font-medium">
                        £{parseFloat(invoice.amountDue || "0").toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {invoice.dueDate ? format(new Date(invoice.dueDate), "dd MMM yyyy") : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => handleViewInvoice(invoice)}
                          data-testid={`button-view-${invoice.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {parseFloat(balance?.totalOwed || "0") > 0 && (
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-800 dark:text-orange-200">Payment Information</h3>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    Fees are invoiced weekly and payment is due within 14 days. 
                    Please contact CCC Group if you have any questions about your invoices.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
                  <p className="text-sm text-muted-foreground">Period</p>
                  <p>{format(new Date(selectedInvoice.periodStart), "dd MMM")} - {format(new Date(selectedInvoice.periodEnd), "dd MMM yyyy")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p>{selectedInvoice.dueDate ? format(new Date(selectedInvoice.dueDate), "dd MMM yyyy") : "Not set"}</p>
                </div>
              </div>

              {selectedInvoice.lineItems && selectedInvoice.lineItems.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Line Items</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job</TableHead>
                        <TableHead>Job Value</TableHead>
                        <TableHead>Fee</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.lineItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">
                            {item.job?.jobNumber || item.jobId}
                          </TableCell>
                          <TableCell>£{parseFloat(item.jobValue).toFixed(2)}</TableCell>
                          <TableCell>
                            {item.feeType === "percentage" 
                              ? `${item.feeValue}%` 
                              : `£${parseFloat(item.feeValue).toFixed(2)} flat`}
                          </TableCell>
                          <TableCell className="font-medium">
                            £{parseFloat(item.feeAmount).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>£{parseFloat(selectedInvoice.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg mt-2">
                  <span>Total</span>
                  <span>£{parseFloat(selectedInvoice.totalAmount).toFixed(2)}</span>
                </div>
                {parseFloat(selectedInvoice.amountPaid || "0") > 0 && (
                  <div className="flex justify-between text-green-600 mt-2">
                    <span>Amount Paid</span>
                    <span>£{parseFloat(selectedInvoice.amountPaid || "0").toFixed(2)}</span>
                  </div>
                )}
                {parseFloat(selectedInvoice.amountDue || "0") > 0 && (
                  <div className="flex justify-between text-orange-600 font-medium mt-2">
                    <span>Balance Due</span>
                    <span>£{parseFloat(selectedInvoice.amountDue || "0").toFixed(2)}</span>
                  </div>
                )}
              </div>

              {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Payment History</h4>
                  <div className="space-y-2">
                    {selectedInvoice.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span>{format(new Date(payment.paymentDate), "dd MMM yyyy")}</span>
                          {payment.paymentMethod && (
                            <Badge variant="outline" className="text-xs">
                              {payment.paymentMethod.replace(/_/g, " ")}
                            </Badge>
                          )}
                        </div>
                        <span className="font-medium text-green-600">
                          £{parseFloat(payment.amount).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
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

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatCard } from "@/components/stat-card";
import { 
  PoundSterling, 
  TrendingUp, 
  TrendingDown, 
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  Camera,
  Receipt,
  Loader2,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FinancialCategory, FinancialTransaction, Job } from "@shared/schema";

interface FinancialSummary {
  income: number;
  expenses: number;
  profit: number;
  margin: number;
  transactionCount: number;
}

interface ForecastJob {
  id: string;
  jobNumber: string;
  serviceType: string;
  status: string;
  quotedValue: number;
  depositAmount: number;
  depositPaid: boolean;
}

interface FinancialForecast {
  totalForecast: number;
  depositsPending: number;
  balanceDue: number;
  confirmedJobCount: number;
  jobs: ForecastJob[];
}

interface PartnerVolume {
  partnerId: string;
  businessName: string;
  totalValue: number;
  jobCount: number;
  cccMargin: number;
}

interface PartnerJobVolume {
  totalVolume: number;
  totalMargin: number;
  totalJobCount: number;
  partners: PartnerVolume[];
}

interface ScannedReceiptData {
  vendor: string;
  date: string;
  amount: number;
  description: string;
  items: string[];
  category: string;
}

export default function Finance() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedReceiptData | null>(null);
  const [receiptJobId, setReceiptJobId] = useState<string>("none");
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: categories = [] } = useQuery<FinancialCategory[]>({
    queryKey: ["/api/financial-categories"],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<FinancialTransaction[]>({
    queryKey: ["/api/financial-transactions", year, month],
    queryFn: async () => {
      const res = await fetch(`/api/financial-transactions?year=${year}&month=${month}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
  });

  const { data: summary } = useQuery<FinancialSummary>({
    queryKey: ["/api/financial-summary", year, month],
    queryFn: async () => {
      const res = await fetch(`/api/financial-summary?year=${year}&month=${month}`);
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json();
    },
  });

  const { data: jobsData } = useQuery<{ jobs: Job[] }>({
    queryKey: ["/api/jobs"],
  });
  const allJobs = jobsData?.jobs || [];

  const { data: forecast } = useQuery<FinancialForecast>({
    queryKey: ["/api/financial-forecast"],
  });

  const { data: partnerVolume } = useQuery<PartnerJobVolume>({
    queryKey: ["/api/partner-job-volume", year, month],
    queryFn: async () => {
      const res = await fetch(`/api/partner-job-volume?year=${year}&month=${month}`);
      if (!res.ok) throw new Error("Failed to fetch partner volume");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<FinancialTransaction>) => {
      return apiRequest("POST", "/api/financial-transactions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-summary"] });
      setIsDialogOpen(false);
      toast({ title: "Transaction added" });
    },
    onError: () => {
      toast({ title: "Failed to add transaction", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FinancialTransaction> }) => {
      return apiRequest("PATCH", `/api/financial-transactions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-summary"] });
      setIsDialogOpen(false);
      setEditingTransaction(null);
      toast({ title: "Transaction updated" });
    },
    onError: () => {
      toast({ title: "Failed to update transaction", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/financial-transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-summary"] });
      toast({ title: "Transaction deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete transaction", variant: "destructive" });
    },
  });

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Uncategorized";
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || "Unknown";
  };

  const getJobInfo = (jobId: string | null) => {
    if (!jobId) return null;
    return allJobs.find(j => j.id === jobId);
  };

  const incomeCategories = categories.filter(c => c.type === "income");
  const expenseCategories = categories.filter(c => c.type === "expense");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleScanReceipt = async () => {
    if (!receiptImage) return;

    setIsScanning(true);
    try {
      const response = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: receiptImage }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to scan receipt");
      }

      setScannedData(result.data);
      toast({
        title: "Receipt Scanned",
        description: `Found £${result.data.amount} from ${result.data.vendor}`,
      });
    } catch (error: any) {
      toast({
        title: "Scan Failed",
        description: error.message || "Could not read the receipt. Try a clearer photo.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleCreateFromScan = () => {
    if (!scannedData) return;

    const matchedCategory = expenseCategories.find(
      c => c.name.toLowerCase().includes(scannedData.category.toLowerCase().split(" ")[0])
    );

    createMutation.mutate({
      type: "expense",
      categoryId: matchedCategory?.id || null,
      amount: scannedData.amount.toString(),
      description: scannedData.description || `${scannedData.vendor} purchase`,
      date: scannedData.date ? new Date(scannedData.date) : new Date(),
      notes: scannedData.items?.length > 0 ? `Items: ${scannedData.items.join(", ")}` : null,
      sourceType: "receipt_scan",
      vendor: scannedData.vendor,
      receiptUrl: receiptImage,
      jobId: receiptJobId === "none" ? null : receiptJobId,
    });

    setIsReceiptDialogOpen(false);
    resetReceiptScanner();
  };

  const resetReceiptScanner = () => {
    setReceiptImage(null);
    setScannedData(null);
    setIsScanning(false);
    setReceiptJobId("none");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold">Finance</h1>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={handlePrevMonth} data-testid="button-prev-month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md min-w-[160px] justify-center">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium" data-testid="text-current-month">
              {format(currentDate, "MMMM yyyy")}
            </span>
          </div>
          <Button size="icon" variant="outline" onClick={handleNextMonth} data-testid="button-next-month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Income"
          value={`£${(summary?.income || 0).toLocaleString()}`}
          icon={ArrowUpCircle}
          description="This month"
          data-testid="stat-income"
        />
        <StatCard
          title="Expenses"
          value={`£${(summary?.expenses || 0).toLocaleString()}`}
          icon={ArrowDownCircle}
          description="This month"
          data-testid="stat-expenses"
        />
        <StatCard
          title="Profit"
          value={`£${(summary?.profit || 0).toLocaleString()}`}
          icon={TrendingUp}
          description={`${summary?.margin || 0}% margin`}
          data-testid="stat-profit"
        />
        <StatCard
          title="Transactions"
          value={summary?.transactionCount || 0}
          icon={PoundSterling}
          description="This month"
          data-testid="stat-transactions"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Cash Flow Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 rounded-md bg-muted/50">
              <p className="text-sm text-muted-foreground">Total Confirmed</p>
              <p className="text-2xl font-semibold" data-testid="text-forecast-total">
                £{(forecast?.totalForecast || 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">{forecast?.confirmedJobCount || 0} confirmed jobs</p>
            </div>
            <div className="p-4 rounded-md bg-muted/50">
              <p className="text-sm text-muted-foreground">Deposits Pending</p>
              <p className="text-2xl font-semibold" data-testid="text-deposits-pending">
                £{(forecast?.depositsPending || 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Awaiting payment</p>
            </div>
            <div className="p-4 rounded-md bg-muted/50">
              <p className="text-sm text-muted-foreground">Balance Due</p>
              <p className="text-2xl font-semibold" data-testid="text-balance-due">
                £{(forecast?.balanceDue || 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Outstanding balances</p>
            </div>
          </div>
          
          {forecast?.jobs && forecast.jobs.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Confirmed Jobs</p>
              {forecast.jobs.map(job => (
                <div key={job.id} className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/30" data-testid={`forecast-job-${job.id}`}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-medium">{job.jobNumber}</span>
                    <span className="text-sm text-muted-foreground">{job.serviceType}</span>
                    <Badge variant="secondary" className="text-xs">
                      {job.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">£{job.quotedValue.toLocaleString()}</p>
                    {job.depositAmount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Deposit: £{job.depositAmount.toLocaleString()} {job.depositPaid ? "(Paid)" : "(Pending)"}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {(!forecast?.jobs || forecast.jobs.length === 0) && (
            <p className="text-center text-muted-foreground py-4">No confirmed jobs yet</p>
          )}
        </CardContent>
      </Card>

      {(partnerVolume?.totalJobCount || 0) > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Partner Job Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 rounded-md bg-muted/50">
                <p className="text-sm text-muted-foreground">Total Job Value</p>
                <p className="text-2xl font-semibold" data-testid="text-partner-volume">
                  £{(partnerVolume?.totalVolume || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{partnerVolume?.totalJobCount || 0} partner jobs</p>
              </div>
              <div className="p-4 rounded-md bg-muted/50">
                <p className="text-sm text-muted-foreground">CCC Profit</p>
                <p className="text-2xl font-semibold text-green-600" data-testid="text-partner-margin">
                  £{(partnerVolume?.totalMargin || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Your earnings</p>
              </div>
            </div>
            {partnerVolume?.partners && partnerVolume.partners.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">By Partner</p>
                {partnerVolume.partners.map(p => (
                  <div key={p.partnerId} className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/30" data-testid={`partner-volume-${p.partnerId}`}>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-medium">{p.businessName}</span>
                      <Badge variant="secondary" className="text-xs">{p.jobCount} job{p.jobCount !== 1 ? "s" : ""}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">£{p.totalValue.toLocaleString()}</p>
                      <p className="text-xs text-green-600">Profit: £{p.cccMargin.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base font-semibold">Transactions</CardTitle>
            <div className="flex items-center gap-2">
              <Dialog open={isReceiptDialogOpen} onOpenChange={(open) => {
                setIsReceiptDialogOpen(open);
                if (!open) resetReceiptScanner();
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" data-testid="button-scan-receipt">
                    <Camera className="h-4 w-4 mr-2" />
                    Scan Receipt
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5" />
                      Scan Receipt
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {!receiptImage ? (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Take a photo or upload an image of your receipt. The AI will read it and create an expense entry automatically.
                        </p>
                        <div className="flex flex-col gap-3">
                          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer hover-elevate">
                            <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                            <span className="text-sm font-medium">Take Photo</span>
                            <span className="text-xs text-muted-foreground">Use your camera</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={handleFileChange}
                              data-testid="input-receipt-camera"
                            />
                          </label>
                          <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover-elevate">
                            <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />
                            <span className="text-sm">Upload from gallery</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileChange}
                              data-testid="input-receipt-upload"
                            />
                          </label>
                        </div>
                      </div>
                    ) : !scannedData ? (
                      <div className="space-y-4">
                        <div className="relative">
                          <img 
                            src={receiptImage} 
                            alt="Receipt preview" 
                            className="w-full max-h-64 object-contain rounded-lg border"
                          />
                          {isScanning && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                              <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <span className="text-sm font-medium">Reading receipt...</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={resetReceiptScanner}
                            className="flex-1"
                            data-testid="button-retake-receipt"
                          >
                            Retake
                          </Button>
                          <Button 
                            onClick={handleScanReceipt}
                            disabled={isScanning}
                            className="flex-1"
                            data-testid="button-scan-now"
                          >
                            {isScanning ? "Scanning..." : "Scan Receipt"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                          <h4 className="font-medium text-sm">Extracted Data</h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Vendor:</span>
                              <p className="font-medium" data-testid="text-scanned-vendor">{scannedData.vendor}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Amount:</span>
                              <p className="font-medium text-lg" data-testid="text-scanned-amount">£{scannedData.amount.toFixed(2)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Date:</span>
                              <p className="font-medium" data-testid="text-scanned-date">{scannedData.date || "Today"}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Category:</span>
                              <p className="font-medium" data-testid="text-scanned-category">{scannedData.category}</p>
                            </div>
                          </div>
                          {scannedData.items && scannedData.items.length > 0 && (
                            <div>
                              <span className="text-muted-foreground text-sm">Items:</span>
                              <p className="text-sm">{scannedData.items.slice(0, 3).join(", ")}</p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Link to Job (optional)</Label>
                          <Select value={receiptJobId} onValueChange={setReceiptJobId}>
                            <SelectTrigger data-testid="select-receipt-job">
                              <SelectValue placeholder="Select job" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No job</SelectItem>
                              {allJobs.map(job => (
                                <SelectItem key={job.id} value={job.id}>
                                  {job.jobNumber} - {job.serviceType}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={resetReceiptScanner}
                            className="flex-1"
                            data-testid="button-scan-again"
                          >
                            Scan Another
                          </Button>
                          <Button 
                            onClick={handleCreateFromScan}
                            disabled={createMutation.isPending}
                            className="flex-1"
                            data-testid="button-add-expense"
                          >
                            {createMutation.isPending ? "Adding..." : "Add Expense"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) setEditingTransaction(null);
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-add-transaction">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Transaction
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingTransaction ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
                </DialogHeader>
                <TransactionForm
                  transaction={editingTransaction}
                  incomeCategories={incomeCategories}
                  expenseCategories={expenseCategories}
                  jobs={allJobs}
                  onSubmit={(data) => {
                    if (editingTransaction) {
                      updateMutation.mutate({ id: editingTransaction.id, data });
                    } else {
                      createMutation.mutate(data);
                    }
                  }}
                  isLoading={createMutation.isPending || updateMutation.isPending}
                />
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions this month
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => {
                const jobInfo = getJobInfo(tx.jobId);
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50 hover-elevate"
                    data-testid={`row-transaction-${tx.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {tx.type === "income" ? (
                        <ArrowUpCircle className="h-5 w-5 text-green-600 shrink-0" />
                      ) : (
                        <ArrowDownCircle className="h-5 w-5 text-red-600 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">{tx.description}</span>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {getCategoryName(tx.categoryId)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                          <span>{format(new Date(tx.date), "dd MMM yyyy")}</span>
                          {jobInfo && (
                            <Link href={`/jobs/${tx.jobId}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                              Job: {jobInfo.jobNumber}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                          {tx.sourceType === "auto" && (
                            <Badge variant="secondary" className="text-xs">Auto</Badge>
                          )}
                          {tx.sourceType === "receipt_scan" && (
                            <Badge variant="secondary" className="text-xs">Receipt</Badge>
                          )}
                          {tx.vendor && (
                            <span className="text-muted-foreground">from {tx.vendor}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {tx.receiptUrl && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="ghost" title="View Receipt" data-testid={`button-view-receipt-${tx.id}`}>
                              <Receipt className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Receipt Image</DialogTitle>
                            </DialogHeader>
                            <div className="flex justify-center">
                              <img src={tx.receiptUrl} alt="Receipt" className="max-w-full max-h-[60vh] object-contain rounded-md" />
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      <span className={`font-semibold ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                        {tx.type === "income" ? "+" : "-"}£{parseFloat(tx.amount).toLocaleString()}
                      </span>
                      {tx.sourceType === "manual" && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingTransaction(tx);
                              setIsDialogOpen(true);
                            }}
                            data-testid={`button-edit-transaction-${tx.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("Delete this transaction?")) {
                                deleteMutation.mutate(tx.id);
                              }
                            }}
                            data-testid={`button-delete-transaction-${tx.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface TransactionFormProps {
  transaction: FinancialTransaction | null;
  incomeCategories: FinancialCategory[];
  expenseCategories: FinancialCategory[];
  jobs: Job[];
  onSubmit: (data: Partial<FinancialTransaction>) => void;
  isLoading: boolean;
}

function TransactionForm({ transaction, incomeCategories, expenseCategories, jobs, onSubmit, isLoading }: TransactionFormProps) {
  const [type, setType] = useState<"income" | "expense">(transaction?.type as "income" | "expense" || "expense");
  const [categoryId, setCategoryId] = useState(transaction?.categoryId || "");
  const [amount, setAmount] = useState(transaction?.amount || "");
  const [description, setDescription] = useState(transaction?.description || "");
  const [date, setDate] = useState(transaction?.date ? format(new Date(transaction.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
  const [jobId, setJobId] = useState(transaction?.jobId || "none");
  const [notes, setNotes] = useState(transaction?.notes || "");

  const currentCategories = type === "income" ? incomeCategories : expenseCategories;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type,
      categoryId: categoryId || null,
      amount: amount.toString(),
      description,
      date: new Date(date),
      jobId: jobId === "none" ? null : (jobId || null),
      notes: notes || null,
      sourceType: "manual",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => { setType(v as "income" | "expense"); setCategoryId(""); }}>
            <SelectTrigger data-testid="select-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger data-testid="select-category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {currentCategories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Amount (£)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
            data-testid="input-amount"
          />
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            data-testid="input-date"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Transaction description"
          required
          data-testid="input-description"
        />
      </div>

      <div className="space-y-2">
        <Label>Link to Job (Optional)</Label>
        <Select value={jobId} onValueChange={setJobId}>
          <SelectTrigger data-testid="select-job">
            <SelectValue placeholder="No job linked" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No job linked</SelectItem>
            {jobs.map(job => (
              <SelectItem key={job.id} value={job.id}>{job.jobNumber} - {job.serviceType}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Notes (Optional)</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes..."
          rows={2}
          data-testid="input-notes"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-submit-transaction">
        {isLoading ? "Saving..." : transaction ? "Update Transaction" : "Add Transaction"}
      </Button>
    </form>
  );
}

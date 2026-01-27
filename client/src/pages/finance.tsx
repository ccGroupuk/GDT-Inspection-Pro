import { useState } from "react";
import { ReceiptScannerDialog } from "@/components/finance/ReceiptScannerDialog";
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
  ExternalLink,
  TrendingUp as TrendingUpIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FinancialCategory, FinancialTransaction, Job, SalesCommission, Employee } from "@shared/schema";
import { COMMISSION_STATUSES } from "@shared/schema";

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

interface OutstandingFee {
  id: string;
  incidentType: string;
  completedAt: string;
  totalCollected: string;
  calloutFeeAmount: string;
  partner: { id: string; businessName: string } | null;
  job: { id: string; jobNumber: string } | null;
}

interface PartnerFeeBalance {
  partnerId: string;
  partnerName: string;
  outstandingCount: number;
  totalOutstanding: string;
  paidCount: number;
  totalPaid: string;
}



interface ProjectionData {
  currentBalance: number;
  projection: {
    date: string;
    balance: number;
    events: {
      type: 'in' | 'out';
      description: string;
      amount: number;
    }[];
  }[];
  summary: {
    lowestBalance: number;
    highestBalance: number;
    finalBalance: number;
  };
}

export default function Finance() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);

  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);

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

  const { data: projection } = useQuery<ProjectionData>({
    queryKey: ["/api/financial-projection"],
  });

  const { data: commissions = [] } = useQuery<SalesCommission[]>({
    queryKey: ["/api/sales-commissions"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : "Unknown";
  };

  const getStatusColor = (status: string) => {
    const s = COMMISSION_STATUSES.find(cs => cs.value === status);
    return s ? s.color.replace("bg-", "text-") : "text-gray-500";
  };

  const getStatusBadge = (status: string) => {
    const s = COMMISSION_STATUSES.find(cs => cs.value === status);
    return <Badge className={`${s?.color || "bg-gray-500"}`}>{s?.label || status}</Badge>;
  };

  const { data: partnerVolume } = useQuery<PartnerJobVolume>({
    queryKey: ["/api/partner-job-volume", year, month],
    queryFn: async () => {
      const res = await fetch(`/api/partner-job-volume?year=${year}&month=${month}`);
      if (!res.ok) throw new Error("Failed to fetch partner volume");
      return res.json();
    },
  });

  const { data: outstandingFees = [] } = useQuery<OutstandingFee[]>({
    queryKey: ["/api/partner-fees"],
  });

  const { data: partnerFeeBalances = [] } = useQuery<PartnerFeeBalance[]>({
    queryKey: ["/api/partner-fees/balances"],
  });

  const markFeePaidMutation = useMutation({
    mutationFn: async (calloutId: string) => {
      return apiRequest("POST", `/api/partner-fees/${calloutId}/mark-paid`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-fees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner-fees/balances"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-summary"] });
      toast({ title: "Fee marked as paid" });
    },
    onError: () => {
      toast({ title: "Failed to mark fee as paid", variant: "destructive" });
    },
  });

  const totalOutstandingFees = outstandingFees.reduce((sum, fee) =>
    sum + parseFloat(fee.calloutFeeAmount || "0"), 0
  );

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

      {projection && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">90-Day Cash Flow Projection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={projection.projection}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(str) => format(new Date(str), "MMM d")}
                    minTickGap={30}
                  />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <Tooltip
                    labelFormatter={(label) => format(new Date(label), "EEE, MMM d, yyyy")}
                    formatter={(value: number) => [`£${value.toLocaleString()}`, "Predicted Balance"]}
                  />
                  <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorBalance)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
              <div className="p-3 bg-muted/50 rounded-md flex justify-between">
                <span className="text-muted-foreground">Current Balance</span>
                <span className="font-semibold">£{projection.currentBalance.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-muted/50 rounded-md flex justify-between">
                <span className="text-muted-foreground">Lowest Point</span>
                <span className={`font-semibold ${projection.summary.lowestBalance < 0 ? 'text-red-500' : ''}`}>
                  £{projection.summary.lowestBalance.toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-muted/50 rounded-md flex justify-between">
                <span className="text-muted-foreground">90-Day Result</span>
                <span className="font-semibold">£{projection.summary.finalBalance.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Sales Commissions</CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No commissions found.</p>
          ) : (
            <div className="space-y-2">
              {commissions.slice(0, 5).map(commission => {
                const job = allJobs.find(j => j.id === commission.jobId);
                return (
                  <div key={commission.id} className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{getEmployeeName(commission.employeeId)}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {job && (
                            <Link href={`/jobs/${job.id}`}>
                              <span className="hover:underline cursor-pointer">{job.jobNumber}</span>
                            </Link>
                          )}
                          <span>•</span>
                          <span>{format(new Date(commission.createdAt || new Date()), "dd MMM yyyy")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">£{Number(commission.amount).toLocaleString()}</p>
                      <div className="mt-1">{getStatusBadge(commission.status)}</div>
                    </div>
                  </div>
                );
              })}
              {commissions.length > 5 && (
                <Button variant="ghost" className="w-full text-xs" size="sm">View All Commissions</Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {
        (partnerVolume?.totalJobCount || 0) > 0 && (
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
        )
      }

      {
        outstandingFees.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">Partner Fees Outstanding</CardTitle>
                <Badge variant="destructive" data-testid="badge-total-outstanding">
                  £{totalOutstandingFees.toFixed(2)} owed
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {partnerFeeBalances.filter(b => parseFloat(b.totalOutstanding) > 0).map(balance => (
                  <div key={balance.partnerId} className="space-y-2">
                    <div className="flex items-center justify-between gap-4 p-3 rounded-md bg-amber-100 dark:bg-amber-900/50" data-testid={`partner-balance-${balance.partnerId}`}>
                      <div>
                        <p className="font-medium">{balance.partnerName}</p>
                        <p className="text-sm text-muted-foreground">{balance.outstandingCount} unpaid callout{balance.outstandingCount !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-amber-600 dark:text-amber-400" data-testid={`text-balance-${balance.partnerId}`}>
                          £{balance.totalOutstanding} outstanding
                        </p>
                      </div>
                    </div>
                    {outstandingFees.filter(fee => fee.partner?.id === balance.partnerId).map(fee => (
                      <div key={fee.id} className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/30 ml-4" data-testid={`fee-row-${fee.id}`}>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm font-medium">{fee.incidentType}</span>
                          {fee.job && (
                            <Link href={`/jobs/${fee.job.id}`}>
                              <Badge variant="outline" className="text-xs cursor-pointer">{fee.job.jobNumber}</Badge>
                            </Link>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {fee.completedAt && format(new Date(fee.completedAt), "dd MMM yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm">Collected: £{parseFloat(fee.totalCollected || "0").toFixed(2)}</p>
                            <p className="text-sm font-medium">Fee: £{parseFloat(fee.calloutFeeAmount || "0").toFixed(2)}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => markFeePaidMutation.mutate(fee.id)}
                            disabled={markFeePaidMutation.isPending}
                            data-testid={`button-mark-paid-${fee.id}`}
                          >
                            Mark Paid
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      }

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base font-semibold">Transactions</CardTitle>
            <div className="flex items-center gap-2">
              <ReceiptScannerDialog
                open={isReceiptDialogOpen}
                onOpenChange={setIsReceiptDialogOpen}
                triggerButton={
                  <Button size="sm" variant="outline" data-testid="button-scan-receipt">
                    <Camera className="h-4 w-4 mr-2" />
                    Scan Receipt
                  </Button>
                }
              />
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) setEditingTransaction(null);
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => {
                    setEditingTransaction(null);
                    setIsDialogOpen(true);
                  }} data-testid="button-add-transaction">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
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
    </div >
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

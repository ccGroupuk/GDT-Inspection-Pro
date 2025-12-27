import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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

export default function Finance() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  
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

  const { data: allJobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: forecast } = useQuery<FinancialForecast>({
    queryKey: ["/api/financial-forecast"],
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

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base font-semibold">Transactions</CardTitle>
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
                            <span className="text-primary">Job: {jobInfo.jobNumber}</span>
                          )}
                          {tx.sourceType === "auto" && (
                            <Badge variant="secondary" className="text-xs">Auto</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
  const [jobId, setJobId] = useState(transaction?.jobId || "");
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
      jobId: jobId || null,
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
            <SelectItem value="">No job linked</SelectItem>
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

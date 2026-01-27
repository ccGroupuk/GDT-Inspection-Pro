import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, DollarSign, Wallet, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface CommissionSummary {
    employeeId: string;
    employeeName: string;
    totalUnpaid: number;
    unpaidCount: number;
    totalPaid: number;
    lastPaymentDate: string | null;
}

export default function Commissions() {
    const { toast } = useToast();
    const [selectedEmployee, setSelectedEmployee] = useState<CommissionSummary | null>(null);

    const { data: summary = [], isLoading } = useQuery<CommissionSummary[]>({
        queryKey: ["/api/sales-commissions/summary"],
    });

    const payMutation = useMutation({
        mutationFn: async (employeeId: string) => {
            const res = await apiRequest("POST", "/api/sales-commissions/pay-bulk", { employeeId });
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["/api/sales-commissions/summary"] });
            queryClient.invalidateQueries({ queryKey: ["/api/financial-summary"] }); // Update financials too
            toast({
                title: "Payout Successful",
                description: `Paid £${data.totalAmount.toLocaleString()} for ${data.count} commissions.`,
            });
            setSelectedEmployee(null);
        },
        onError: (error: Error) => {
            toast({
                title: "Payout Failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const totalOutstanding = summary.reduce((sum, s) => sum + s.totalUnpaid, 0);
    const totalPaidAllTime = summary.reduce((sum, s) => sum + s.totalPaid, 0);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Commission Payouts</h1>
                    <p className="text-muted-foreground">Manage and pay sales commissions to employees.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Outstanding Commissions</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">£{totalOutstanding.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Pending payment approval</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Paid (All Time)</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">£{totalPaidAllTime.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Lifetime commissions processed</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Employee Balances</CardTitle>
                    <CardDescription>Review unpaid balances and process payouts.</CardDescription>
                </CardHeader>
                <CardContent>
                    {summary.length === 0 ? (
                        <p className="text-center py-6 text-muted-foreground">No commission records found.</p>
                    ) : (
                        <div className="space-y-4">
                            {summary.map((emp) => (
                                <div key={emp.employeeId} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <DollarSign className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">{emp.employeeName}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Last paid: {emp.lastPaymentDate ? format(new Date(emp.lastPaymentDate), "d MMM yyyy") : "Never"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="text-lg font-bold">£{emp.totalUnpaid.toLocaleString()}</div>
                                            <div className="text-xs text-muted-foreground">{emp.unpaidCount} pending jobs</div>
                                        </div>
                                        <Button
                                            onClick={() => setSelectedEmployee(emp)}
                                            disabled={emp.totalUnpaid <= 0}
                                            variant={emp.totalUnpaid > 0 ? "default" : "outline"}
                                        >
                                            {emp.totalUnpaid > 0 ? "Pay Now" : "Paid Up"}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!selectedEmployee} onOpenChange={(open) => !open && setSelectedEmployee(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Commission Payout</DialogTitle>
                        <DialogDescription>
                            This will mark all pending commissions as paid for this employee.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedEmployee && (
                        <div className="space-y-4 py-4">
                            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                                <span className="font-medium">Total Amount:</span>
                                <span className="text-xl font-bold text-green-600">£{selectedEmployee.totalUnpaid.toLocaleString()}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                <p>Employee: <span className="text-foreground font-medium">{selectedEmployee.employeeName}</span></p>
                                <p>Jobs Included: <span className="text-foreground font-medium">{selectedEmployee.unpaidCount}</span></p>
                            </div>
                            <div className="p-3 border rounded-md bg-blue-50 text-blue-800 text-sm">
                                <p className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4" />
                                    This will also create a "Commission Payout" expense in the General Ledger.
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedEmployee(null)}>Cancel</Button>
                        <Button
                            onClick={() => selectedEmployee && payMutation.mutate(selectedEmployee.employeeId)}
                            disabled={payMutation.isPending}
                        >
                            {payMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Payment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

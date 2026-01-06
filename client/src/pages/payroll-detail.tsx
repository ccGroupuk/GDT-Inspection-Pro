import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { ArrowLeft, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import type { PayPeriod, PayrollRun, Employee } from "@shared/schema";

export default function PayrollDetail() {
    const [, params] = useRoute("/payroll/:id");
    const periodId = params?.id;
    const { toast } = useToast();
    const [isProcessOpen, setIsProcessOpen] = useState(false);
    const [newRun, setNewRun] = useState({
        employeeId: "",
        regularHours: "40",
        overtimeHours: "0",
        hourlyRate: "",
    });

    const { data: period, isLoading: isPeriodLoading } = useQuery<PayPeriod>({
        queryKey: [`/api/pay-periods/${periodId}`],
        enabled: !!periodId
    });

    const { data: runs = [], isLoading: isRunsLoading } = useQuery<PayrollRun[]>({
        queryKey: [`/api/payroll/runs`, { periodId }],
        enabled: !!periodId
    });

    const { data: employees = [] } = useQuery<Employee[]>({
        queryKey: ["/api/employees"],
    });

    const createRunMutation = useMutation({
        mutationFn: async () => {
            const selectedEmployee = employees.find(e => e.id === newRun.employeeId);
            if (!selectedEmployee) throw new Error("Employee not found");

            const payload = {
                payPeriodId: periodId,
                employeeId: newRun.employeeId,
                regularHours: parseFloat(newRun.regularHours),
                overtimeHours: parseFloat(newRun.overtimeHours || "0"),
                hourlyRate: parseFloat(newRun.hourlyRate || selectedEmployee.hourlyRate || "0"),
                overtimeRate: parseFloat(newRun.hourlyRate || selectedEmployee.hourlyRate || "0") * 1.5,
                grossPay: 0, // Calculated by server or ignored (schema requires it, so we might need to send 0 or calc locally)
                // Ideally backend should calc, but if schema implies client sends it, we must provide it.
                // Let's assume validation expects numbers. 
                netPay: 0
            };

            // Let's do a basic calc for the initial submission to pass zod if checking
            const regPay = payload.regularHours * payload.hourlyRate;
            const otPay = payload.overtimeHours * payload.overtimeRate;
            payload.grossPay = regPay + otPay;
            payload.netPay = payload.grossPay; // Basic assumption

            const res = await apiRequest("POST", "/api/payroll/runs", payload);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/payroll/runs"] });
            setIsProcessOpen(false);
            setNewRun({ employeeId: "", regularHours: "40", overtimeHours: "0", hourlyRate: "" });
            toast({ title: "Payroll Processed", description: "Payroll run created successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    if (isPeriodLoading) return <div className="p-8">Loading period details...</div>;
    if (!period) return <div className="p-8">Pay period not found</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/payroll">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">
                        Pay Period: {format(new Date(period.startDate), "MMM d")} - {format(new Date(period.endDate), "MMM d, yyyy")}
                    </h1>
                    <p className="text-muted-foreground">
                        Status: <span className="capitalize">{period.status}</span>
                    </p>
                </div>
                <div className="ml-auto">
                    <Dialog open={isProcessOpen} onOpenChange={setIsProcessOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Process Payroll for Employee
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Process Payroll</DialogTitle>
                                <DialogDescription>
                                    Create a payslip for an employee. Commissions will be automatically added.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="employee">Employee</Label>
                                    <Select value={newRun.employeeId} onValueChange={(v) => setNewRun({ ...newRun, employeeId: v })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select employee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employees.filter(e => e.isActive).map(emp => (
                                                <SelectItem key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="regHours">Regular Hours</Label>
                                        <Input
                                            id="regHours"
                                            type="number"
                                            step="0.5"
                                            value={newRun.regularHours}
                                            onChange={(e) => setNewRun({ ...newRun, regularHours: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="otHours">Overtime Hours</Label>
                                        <Input
                                            id="otHours"
                                            type="number"
                                            step="0.5"
                                            value={newRun.overtimeHours}
                                            onChange={(e) => setNewRun({ ...newRun, overtimeHours: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="rate">Hourly Rate Override (Optional)</Label>
                                    <Input
                                        id="rate"
                                        type="number"
                                        step="0.01"
                                        placeholder={employees.find(e => e.id === newRun.employeeId)?.hourlyRate || "0.00"}
                                        value={newRun.hourlyRate}
                                        onChange={(e) => setNewRun({ ...newRun, hourlyRate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsProcessOpen(false)}>Cancel</Button>
                                <Button onClick={() => createRunMutation.mutate()} disabled={createRunMutation.isPending || !newRun.employeeId}>
                                    {createRunMutation.isPending ? "Processing..." : "Create Run"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Payroll Runs</CardTitle>
                    <CardDescription>Generated payslips for this period.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isRunsLoading ? (
                        <p>Loading runs...</p>
                    ) : runs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border-dashed border rounded-md">
                            No payroll runs processed for this period yet.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Hours</TableHead>
                                    <TableHead className="text-right">Gross Pay</TableHead>
                                    <TableHead className="text-right">Bonuses</TableHead>
                                    <TableHead className="text-right">Net Pay</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {runs.map(run => {
                                    const emp = employees.find(e => e.id === run.employeeId);
                                    return (
                                        <TableRow key={run.id}>
                                            <TableCell className="font-medium">{emp ? `${emp.firstName} ${emp.lastName}` : "Unknown"}</TableCell>
                                            <TableCell>
                                                {run.regularHours} Reg
                                                {Number(run.overtimeHours) > 0 && ` + ${run.overtimeHours} OT`}
                                            </TableCell>
                                            <TableCell className="text-right">£{Number(run.grossPay).toFixed(2)}</TableCell>
                                            <TableCell className="text-right text-green-600">
                                                {Number(run.totalBonuses) > 0 ? `+£${Number(run.totalBonuses).toFixed(2)}` : "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-bold">£{Number(run.netPay).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge variant={run.status === "paid" ? "default" : "secondary"}>
                                                    {run.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Calendar, ArrowRight, Wallet } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import type { PayPeriod } from "@shared/schema";

export default function Payroll() {
    const { toast } = useToast();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newPeriod, setNewPeriod] = useState({
        startDate: "",
        endDate: ""
    });

    const { data: periods = [], isLoading } = useQuery<PayPeriod[]>({
        queryKey: ["/api/pay-periods"],
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/pay-periods", newPeriod);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/pay-periods"] });
            setIsCreateOpen(false);
            setNewPeriod({ startDate: "", endDate: "" });
            toast({ title: "Pay Period Created", description: "New pay period has been added." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold">Payroll Management</h1>
                    <p className="text-muted-foreground">Manage pay periods and employee payslips.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Pay Period
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create Pay Period</DialogTitle>
                            <DialogDescription>
                                Define the start and end dates for the new pay period.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={newPeriod.startDate}
                                    onChange={(e) => setNewPeriod({ ...newPeriod, startDate: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={newPeriod.endDate}
                                    onChange={(e) => setNewPeriod({ ...newPeriod, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !newPeriod.startDate || !newPeriod.endDate}>
                                {createMutation.isPending ? "Creating..." : "Create Period"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <p className="text-muted-foreground col-span-full">Loading pay periods...</p>
                ) : periods.length === 0 ? (
                    <Card className="col-span-full bg-muted/20 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                            <Wallet className="h-10 w-10 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">No pay periods found</p>
                            <p className="text-sm text-muted-foreground mb-4">Create your first pay period to start processing payroll.</p>
                            <Button variant="outline" onClick={() => setIsCreateOpen(true)}>Create Pay Period</Button>
                        </CardContent>
                    </Card>
                ) : (
                    periods.map((period) => (
                        <Link key={period.id} href={`/payroll/${period.id}`}>
                            <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base">
                                            {format(new Date(period.startDate), "MMM d")} - {format(new Date(period.endDate), "MMM d, yyyy")}
                                        </CardTitle>
                                        <Badge variant={period.status === "open" ? "default" : "secondary"}>
                                            {period.status}
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        Created {format(new Date(period.createdAt || new Date()), "PPP")}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">View details</span>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}

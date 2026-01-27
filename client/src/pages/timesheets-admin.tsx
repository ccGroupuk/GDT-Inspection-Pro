import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, Download, Search, Filter } from "lucide-react";
import type { TimeEntry, Employee } from "@shared/schema";

export default function TimesheetsAdmin() {
    const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
    const [dateRange, setDateRange] = useState("this-week");

    const { data: employees = [] } = useQuery<Employee[]>({
        queryKey: ["/api/employees"],
    });

    // Admin route to fetch all entries or filtered by employee
    const { data: timeEntries = [], isLoading } = useQuery<TimeEntry[]>({
        queryKey: ["/api/admin/time-entries", selectedEmployee],
        queryFn: async () => {
            const url = selectedEmployee && selectedEmployee !== "all"
                ? `/api/admin/time-entries?employeeId=${selectedEmployee}`
                : `/api/admin/time-entries`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch");
            return res.json();
        }
    });

    const getEmployeeName = (id: string) => {
        const emp = employees.find(e => e.id === id);
        return emp ? `${emp.firstName} ${emp.lastName}` : "Unknown";
    };

    const calculateTotalHours = () => {
        return timeEntries.reduce((sum, entry) => sum + Number(entry.totalHours || 0), 0).toFixed(2);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Timesheets</h1>
                    <p className="text-muted-foreground">Review employee clock-in/out records.</p>
                </div>
                <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Time Entries</CardTitle>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-lg">
                                Total: {calculateTotalHours()} hrs
                            </Badge>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4">
                        <div className="w-[200px]">
                            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by Employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Employees</SelectItem>
                                    {employees.map(emp => (
                                        <SelectItem key={emp.id} value={emp.id}>
                                            {emp.firstName} {emp.lastName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">Loading timesheets...</div>
                    ) : timeEntries.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No time entries found.</div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Clock In</TableHead>
                                        <TableHead>Clock Out</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Break</TableHead>
                                        <TableHead className="text-right">Total Hours</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {timeEntries.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell className="font-medium">
                                                {getEmployeeName(entry.employeeId)}
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(entry.clockIn), "MMM d, yyyy")}
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(entry.clockIn), "h:mm a")}
                                            </TableCell>
                                            <TableCell>
                                                {entry.clockOut ? format(new Date(entry.clockOut), "h:mm a") : <Badge variant="outline" className="text-green-600 bg-green-50">Active</Badge>}
                                            </TableCell>
                                            <TableCell className="capitalize">{entry.entryType}</TableCell>
                                            <TableCell>{entry.breakMinutes > 0 ? `${entry.breakMinutes}m` : "-"}</TableCell>
                                            <TableCell className="text-right font-bold">
                                                {entry.totalHours || "--"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowLeft, User, Loader2 } from "lucide-react";
import { format, formatDistanceToNow, startOfWeek, endOfWeek, parseISO } from "date-fns";
import type { TimeEntry, Employee } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

export default function EmployeePortalAdminView() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [, setLocation] = useLocation();
  const { isLoading: authLoading, isAuthenticated, hasAdminAccess } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        setLocation("/landing");
      } else if (!hasAdminAccess) {
        setLocation("/employee-portal/home");
      }
    }
  }, [authLoading, isAuthenticated, hasAdminAccess, setLocation]);

  const { data: employee, isLoading: loadingEmployee, error: employeeError } = useQuery<Employee>({
    queryKey: ["/api/employees", employeeId],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${employeeId}`, { credentials: "include" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to fetch employee");
      }
      return res.json();
    },
    enabled: !!employeeId && isAuthenticated && hasAdminAccess
  });

  const { data: timeEntries = [], isLoading: loadingEntries, error: entriesError } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries", employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const res = await fetch(`/api/time-entries?employeeId=${employeeId}`, { credentials: "include" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to fetch time entries");
      }
      return res.json();
    },
    enabled: !!employeeId && isAuthenticated && hasAdminAccess
  });

  const activeEntry = timeEntries.find(e => !e.clockOut);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEntries = timeEntries.filter(e => {
    const clockIn = parseISO(e.clockIn as unknown as string);
    return clockIn >= weekStart && clockIn <= weekEnd && e.clockOut;
  });
  const weekHours = weekEntries.reduce((sum, e) => sum + parseFloat(e.totalHours || "0"), 0);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated || !hasAdminAccess) {
    return null;
  }

  if (loadingEmployee || loadingEntries) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading employee portal...</span>
      </div>
    );
  }

  if (employeeError || !employee) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/employees")} data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <div className="flex items-center justify-center py-20">
          <div className="text-muted-foreground">
            {employeeError ? (employeeError as Error).message : "Employee not found"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/employees")} data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-semibold">Employee Portal</span>
            <Badge variant="secondary" className="ml-2">Admin View</Badge>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {employee.firstName} {employee.lastName}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Employee Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{employee.firstName} {employee.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{employee.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <Badge variant="outline">{employee.role}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={employee.isActive ? "default" : "secondary"}>
                  {employee.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Current Status
            </CardTitle>
            <CardDescription>
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeEntry ? (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-md">
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <Badge variant="secondary" className="bg-green-500/20 text-green-700 dark:text-green-400">
                    Currently Clocked In
                  </Badge>
                  <Badge variant="outline">{activeEntry.entryType}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Started {formatDistanceToNow(new Date(activeEntry.clockIn), { addSuffix: true })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(activeEntry.clockIn), "h:mm a")}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-muted/50 rounded-md text-center">
                <p className="text-muted-foreground">Not currently clocked in</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">This Week</CardTitle>
            <CardDescription>
              {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{weekHours.toFixed(1)} hrs</div>
            <p className="text-sm text-muted-foreground">{weekEntries.length} entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent Time Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {timeEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No time entries yet</p>
            ) : (
              <div className="space-y-2">
                {timeEntries.slice(0, 10).map((entry) => (
                  <div 
                    key={entry.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-md gap-2"
                    data-testid={`time-entry-${entry.id}`}
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">{entry.entryType}</Badge>
                        {!entry.clockOut && (
                          <Badge variant="secondary" className="text-xs bg-green-500/20">Active</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(entry.clockIn), "EEE, MMM d")}
                      </p>
                      {entry.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{entry.totalHours || "--"} hrs</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(entry.clockIn), "h:mm a")}
                        {entry.clockOut && ` - ${format(new Date(entry.clockOut), "h:mm a")}`}
                      </p>
                      {entry.breakMinutes && entry.breakMinutes > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {entry.breakMinutes} min break
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

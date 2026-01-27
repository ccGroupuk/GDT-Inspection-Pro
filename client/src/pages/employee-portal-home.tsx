import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Clock, LogOut, Play, Square, FileText, Calendar, User, Home } from "lucide-react";
import { Link, useLocation } from "wouter";
import { format, formatDistanceToNow, startOfWeek, endOfWeek, parseISO } from "date-fns";
import type { TimeEntry, Job } from "@shared/schema";

interface EmployeeData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  accessAreas: string[];
}

export default function EmployeePortalHome() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [entryType, setEntryType] = useState("work");
  const [clockOutNotes, setClockOutNotes] = useState("");
  const [breakMinutes, setBreakMinutes] = useState("0");

  useEffect(() => {
    const data = localStorage.getItem("employeeData");
    if (data) {
      setEmployeeData(JSON.parse(data));
    } else {
      setLocation("/employee-portal");
    }
  }, [setLocation]);

  const token = localStorage.getItem("employeeToken");
  const headers = { Authorization: `Bearer ${token}` };

  const { data: activeEntry, isLoading: loadingActive } = useQuery<TimeEntry | null>({
    queryKey: ["/api/employee/active-entry"],
    queryFn: async () => {
      const res = await fetch("/api/employee/active-entry", { headers });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 30000
  });

  const { data: timeEntries = [] } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries", employeeData?.id],
    queryFn: async () => {
      if (!employeeData?.id) return [];
      const res = await fetch(`/api/time-entries?employeeId=${employeeData.id}`, { headers });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!employeeData?.id
  });

  const clockInMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/employee/clock-in", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ entryType })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/active-entry"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({ title: "Clocked In", description: "Your time is now being tracked." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const clockOutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/employee/clock-out", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ notes: clockOutNotes, breakMinutes: parseInt(breakMinutes) || 0 })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/active-entry"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      setClockOutNotes("");
      setBreakMinutes("0");
      toast({
        title: "Clocked Out",
        description: `Total hours: ${data.totalHours}`
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleLogout = () => {
    fetch("/api/employee/logout", { method: "POST", headers });
    localStorage.removeItem("employeeToken");
    localStorage.removeItem("employeeData");
    setLocation("/employee-portal");
  };

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEntries = timeEntries.filter(e => {
    const clockIn = parseISO(e.clockIn as unknown as string);
    return clockIn >= weekStart && clockIn <= weekEnd && e.clockOut;
  });
  const weekHours = weekEntries.reduce((sum, e) => sum + parseFloat(e.totalHours || "0"), 0);

  // Geolocation Tracking
  useEffect(() => {
    if (!employeeData?.id || !activeEntry) return;

    const sendLocation = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;

      fetch("/api/staff-locations", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          source: "tracking_update" // can distinguish between manual clock events vs background
        })
      }).catch(err => console.error("Failed to send location", err));
    };

    // Send immediately on load/clock-in
    navigator.geolocation.getCurrentPosition(sendLocation, (err) => console.error(err));

    // Watch position
    const watchId = navigator.geolocation.watchPosition(sendLocation, (err) => console.error(err), {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 30000
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [employeeData?.id, activeEntry]); // Only track when clocked in (activeEntry exists)

  if (!employeeData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-semibold">Employee Portal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {employeeData.firstName} {employeeData.lastName}
            </span>
            <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Clock
            </CardTitle>
            <CardDescription>
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingActive ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : activeEntry ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-md">
                  <div className="flex items-center justify-between mb-2">
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

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Break Minutes</label>
                    <Select value={breakMinutes} onValueChange={setBreakMinutes}>
                      <SelectTrigger data-testid="select-break-minutes">
                        <SelectValue placeholder="Break time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No break</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Notes (optional)</label>
                    <Textarea
                      placeholder="What did you work on?"
                      value={clockOutNotes}
                      onChange={(e) => setClockOutNotes(e.target.value)}
                      className="mt-1"
                      data-testid="input-clock-notes"
                    />
                  </div>
                  <Button
                    onClick={() => clockOutMutation.mutate()}
                    disabled={clockOutMutation.isPending}
                    className="w-full bg-red-600 hover:bg-red-700"
                    data-testid="button-clock-out"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    {clockOutMutation.isPending ? "Clocking Out..." : "Clock Out"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Entry Type</label>
                  <Select value={entryType} onValueChange={setEntryType}>
                    <SelectTrigger data-testid="select-entry-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="work">General Work</SelectItem>
                      <SelectItem value="project">Project Work</SelectItem>
                      <SelectItem value="quoting">Quoting</SelectItem>
                      <SelectItem value="fitting">Fitting/Installation</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="admin">Admin Tasks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => clockInMutation.mutate()}
                  disabled={clockInMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700"
                  data-testid="button-clock-in"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {clockInMutation.isPending ? "Clocking In..." : "Clock In"}
                </Button>
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
                {timeEntries.slice(0, 5).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                    data-testid={`time-entry-${entry.id}`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{entry.entryType}</Badge>
                        {!entry.clockOut && (
                          <Badge variant="secondary" className="text-xs bg-green-500/20">Active</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(entry.clockIn), "EEE, MMM d")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{entry.totalHours || "--"} hrs</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(entry.clockIn), "h:mm a")}
                        {entry.clockOut && ` - ${format(new Date(entry.clockOut), "h:mm a")}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/employee-portal/timecard">
            <Card className="hover-elevate cursor-pointer">
              <CardContent className="flex items-center justify-center gap-2 py-6">
                <Calendar className="h-5 w-5" />
                <span>View Timecard</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/employee-portal/payslips">
            <Card className="hover-elevate cursor-pointer">
              <CardContent className="flex items-center justify-center gap-2 py-6">
                <FileText className="h-5 w-5" />
                <span>Payslips</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}

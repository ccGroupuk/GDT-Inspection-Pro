import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePartnerPortalAuth } from "@/hooks/use-partner-portal-auth";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  XCircle,
  Briefcase,
  LogOut,
  Loader2,
  ArrowLeft,
  Users,
  Handshake,
} from "lucide-react";
import type { CalendarEvent, Job } from "@shared/schema";
import { ClipboardCheck, Wrench } from "lucide-react";

type EnrichedCalendarEvent = CalendarEvent & {
  job: Job | null;
  eventType?: string;
  surveyDetails?: string | null;
};

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "confirmed":
      return <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />;
    case "cancelled":
      return <XCircle className="w-4 h-4 text-destructive" />;
    default:
      return <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
  }
}

function TeamTypeBadge({ type }: { type: string }) {
  switch (type) {
    case "partner":
      return (
        <Badge variant="outline" className="text-xs bg-orange-50 dark:bg-orange-950/30">
          <Handshake className="w-3 h-3 mr-1" />
          Your Work
        </Badge>
      );
    case "hybrid":
      return (
        <Badge variant="default" className="text-xs">
          <Users className="w-3 h-3 mr-1" />
          Hybrid
        </Badge>
      );
    default:
      return null;
  }
}

function EventTypeBadge({ eventType }: { eventType?: string }) {
  if (eventType === "survey") {
    return (
      <Badge variant="secondary" className="text-xs">
        <ClipboardCheck className="w-3 h-3 mr-1" />
        Survey
      </Badge>
    );
  }
  if (eventType === "project_start") {
    return (
      <Badge variant="default" className="text-xs bg-green-600 dark:bg-green-700">
        <Wrench className="w-3 h-3 mr-1" />
        Work Start
      </Badge>
    );
  }
  return null;
}

function EventCard({ 
  event, 
  onConfirm, 
  isConfirming 
}: { 
  event: EnrichedCalendarEvent; 
  onConfirm: () => void;
  isConfirming: boolean;
}) {
  const teamTypeColors = {
    partner: "border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/30",
    hybrid: "border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/30",
  };

  const needsPartnerConfirmation = event.status === "pending" && !event.confirmedByPartner;

  return (
    <div
      className={`p-2 rounded-md border-l-4 ${teamTypeColors[event.teamType as keyof typeof teamTypeColors] || "border-l-gray-500"} mb-2`}
      data-testid={`partner-event-card-${event.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <StatusIcon status={event.status} />
            <span className="text-sm font-medium truncate">{event.title}</span>
          </div>
          {event.job && (
            <p className="text-xs text-muted-foreground truncate">
              {event.job.jobNumber} - {event.job.serviceType}
            </p>
          )}
          {event.surveyDetails && (
            <p className="text-xs text-muted-foreground mt-1">{event.surveyDetails}</p>
          )}
        </div>
        <div className="flex flex-col gap-1 items-end">
          <EventTypeBadge eventType={event.eventType} />
          <TeamTypeBadge type={event.teamType} />
        </div>
      </div>
      
      {event.confirmedByPartner && (
        <div className="mt-1">
          <Badge variant="secondary" className="text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            You confirmed
          </Badge>
        </div>
      )}
      
      {needsPartnerConfirmation && (
        <div className="mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onConfirm}
            disabled={isConfirming}
            className="w-full text-xs"
            data-testid={`button-partner-confirm-event-${event.id}`}
          >
            {isConfirming ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3 h-3 mr-1" />
            )}
            Confirm Booking
          </Button>
        </div>
      )}
    </div>
  );
}

export default function PartnerPortalCalendar() {
  const { token, isAuthenticated, logout } = usePartnerPortalAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/partner-portal/login");
    }
  }, [isAuthenticated, setLocation]);

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const { data: events = [], isLoading } = useQuery<EnrichedCalendarEvent[]>({
    queryKey: ["/api/partner-portal/calendar-events", format(currentWeekStart, "yyyy-MM-dd"), format(weekEnd, "yyyy-MM-dd")],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await fetch(
        `/api/partner-portal/calendar-events?startDate=${currentWeekStart.toISOString()}&endDate=${weekEnd.toISOString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["/api/partner-portal/profile"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await fetch("/api/partner-portal/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await fetch(`/api/partner-portal/calendar-events/${eventId}/confirm`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to confirm");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/calendar-events"] });
      toast({ title: "Booking confirmed" });
    },
    onError: () => {
      toast({ title: "Failed to confirm booking", variant: "destructive" });
    },
  });

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventStart = parseISO(event.startDate as unknown as string);
      const eventEnd = parseISO(event.endDate as unknown as string);
      return date >= eventStart && date <= eventEnd || isSameDay(date, eventStart) || isSameDay(date, eventEnd);
    });
  };

  const goToPreviousWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const goToNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  if (!isAuthenticated) {
    return null;
  }

  const pendingCount = events.filter(e => e.status === "pending" && !e.confirmedByPartner).length;
  const confirmedCount = events.filter(e => e.confirmedByPartner).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Partner Portal</h1>
              {profile && (
                <p className="text-sm text-muted-foreground">{profile.businessName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/partner-portal/jobs">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Jobs
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} data-testid="button-partner-logout">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-1 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6" />
            Your Schedule
          </h2>
          <p className="text-muted-foreground">
            View and confirm your scheduled work
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground">Awaiting Your Confirmation</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{confirmedCount}</p>
                  <p className="text-xs text-muted-foreground">Confirmed by You</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle className="text-lg">
                {format(currentWeekStart, "MMMM d")} - {format(weekEnd, "MMMM d, yyyy")}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToToday} data-testid="button-partner-today">
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={goToPreviousWeek} data-testid="button-partner-prev-week">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goToNextWeek} data-testid="button-partner-next-week">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div key={day.toISOString()} className="min-h-[150px]">
                      <div
                        className={`text-center py-2 rounded-t-md font-medium text-sm ${
                          isToday
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <div>{format(day, "EEE")}</div>
                        <div className="text-lg">{format(day, "d")}</div>
                      </div>
                      <div className="border border-t-0 rounded-b-md p-2 min-h-[100px] bg-card">
                        {dayEvents.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">No bookings</p>
                        ) : (
                          dayEvents.map((event) => (
                            <EventCard
                              key={event.id}
                              event={event}
                              onConfirm={() => confirmMutation.mutate(event.id)}
                              isConfirming={confirmMutation.isPending}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">About This Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                This calendar shows jobs that CCC Group has scheduled for you. You will only see:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Partner jobs</strong> - Work assigned specifically to you</li>
                <li><strong>Hybrid jobs</strong> - Work where you collaborate with the CCC team</li>
              </ul>
              <p>
                When you see a pending booking, please confirm it to let CCC Group know you are available for the scheduled dates.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

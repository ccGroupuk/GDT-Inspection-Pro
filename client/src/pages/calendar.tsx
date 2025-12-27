import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  Handshake,
  Building2,
} from "lucide-react";
import type { CalendarEvent, Job, TradePartner } from "@shared/schema";

type EnrichedCalendarEvent = CalendarEvent & {
  job: Job | null;
  partner: TradePartner | null;
};

const eventFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  allDay: z.boolean().default(true),
  teamType: z.enum(["in_house", "partner", "hybrid"]),
  jobId: z.string().optional(),
  partnerId: z.string().optional(),
  notes: z.string().optional(),
});

type EventFormData = z.infer<typeof eventFormSchema>;

function TeamTypeBadge({ type }: { type: string }) {
  switch (type) {
    case "in_house":
      return (
        <Badge variant="secondary" className="text-xs">
          <Building2 className="w-3 h-3 mr-1" />
          In-House
        </Badge>
      );
    case "partner":
      return (
        <Badge variant="outline" className="text-xs bg-accent/50">
          <Handshake className="w-3 h-3 mr-1" />
          Partner
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

function EventCard({ event, onConfirm }: { event: EnrichedCalendarEvent; onConfirm: () => void }) {
  const teamTypeColors = {
    in_house: "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/30",
    partner: "border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/30",
    hybrid: "border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/30",
  };

  const needsAdminConfirmation = !event.confirmedByAdmin;
  const needsPartnerConfirmation = (event.teamType === "partner" || event.teamType === "hybrid") && !event.confirmedByPartner;
  const isFullyConfirmed = event.status === "confirmed";

  return (
    <div
      className={`p-2 rounded-md border-l-4 ${teamTypeColors[event.teamType as keyof typeof teamTypeColors] || "border-l-gray-500"} mb-2`}
      data-testid={`event-card-${event.id}`}
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
          {event.partner && (
            <p className="text-xs text-muted-foreground truncate">
              Partner: {event.partner.businessName}
            </p>
          )}
        </div>
        <TeamTypeBadge type={event.teamType} />
      </div>
      
      {!isFullyConfirmed && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2 text-xs">
            {event.confirmedByAdmin ? (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Admin confirmed
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Awaiting admin
              </Badge>
            )}
            {(event.teamType === "partner" || event.teamType === "hybrid") && (
              event.confirmedByPartner ? (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Partner confirmed
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  Awaiting partner
                </Badge>
              )
            )}
          </div>
          {needsAdminConfirmation && (
            <Button
              size="sm"
              variant="outline"
              onClick={onConfirm}
              className="w-full text-xs"
              data-testid={`button-confirm-event-${event.id}`}
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Confirm (Admin)
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function AddEventDialog({ 
  jobs, 
  partners,
  defaultDate,
  onClose 
}: { 
  jobs: Job[];
  partners: TradePartner[];
  defaultDate?: Date;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: defaultDate ? format(defaultDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      endDate: defaultDate ? format(defaultDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      allDay: true,
      teamType: "in_house",
      jobId: "",
      partnerId: "",
      notes: "",
    },
  });

  const teamType = form.watch("teamType");

  const createMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      // Client-side validation for partner requirement
      if ((data.teamType === "partner" || data.teamType === "hybrid") && !data.partnerId) {
        throw new Error("Partner is required for partner or hybrid events");
      }
      
      const payload = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        jobId: data.jobId || null,
        partnerId: data.partnerId || null,
      };
      return apiRequest("POST", "/api/calendar-events", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
      toast({ title: "Event created successfully" });
      setOpen(false);
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: error.message || "Failed to create event", variant: "destructive" });
    },
  });

  const onSubmit = (data: EventFormData) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-event">
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Calendar Event</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Event title" {...field} data-testid="input-event-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-event-start-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-event-end-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="teamType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-team-type">
                        <SelectValue placeholder="Select team type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="in_house">In-House (CCC Team)</SelectItem>
                      <SelectItem value="partner">Partner (Trade Partner)</SelectItem>
                      <SelectItem value="hybrid">Hybrid (CCC + Partner)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jobId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link to Job (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-job">
                        <SelectValue placeholder="Select a job" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No job linked</SelectItem>
                      {jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.jobNumber} - {job.serviceType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(teamType === "partner" || teamType === "hybrid") && (
              <FormField
                control={form.control}
                name="partnerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trade Partner</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-partner">
                          <SelectValue placeholder="Select a partner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No partner selected</SelectItem>
                        {partners.filter(p => p.isActive).map((partner) => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.businessName} ({partner.tradeCategory})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Event description" 
                      className="resize-none" 
                      {...field} 
                      data-testid="input-event-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allDay"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>All Day Event</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-all-day"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-event">
                {createMutation.isPending ? "Creating..." : "Create Event"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function CalendarPage() {
  const { toast } = useToast();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const { data: events = [], isLoading } = useQuery<EnrichedCalendarEvent[]>({
    queryKey: ["/api/calendar-events", format(currentWeekStart, "yyyy-MM-dd"), format(weekEnd, "yyyy-MM-dd")],
    queryFn: async () => {
      const response = await fetch(
        `/api/calendar-events?startDate=${currentWeekStart.toISOString()}&endDate=${weekEnd.toISOString()}`
      );
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: partners = [] } = useQuery<TradePartner[]>({
    queryKey: ["/api/partners"],
  });

  const confirmMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return apiRequest("PATCH", `/api/calendar-events/${eventId}/confirm-admin`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
      toast({ title: "Event confirmed" });
    },
    onError: () => {
      toast({ title: "Failed to confirm event", variant: "destructive" });
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

  const inHouseCount = events.filter(e => e.teamType === "in_house").length;
  const partnerCount = events.filter(e => e.teamType === "partner").length;
  const hybridCount = events.filter(e => e.teamType === "hybrid").length;
  const pendingCount = events.filter(e => e.status === "pending").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-6 h-6" />
            Work Calendar
          </h1>
          <p className="text-muted-foreground">Schedule and manage jobs with partners and in-house team</p>
        </div>
        <AddEventDialog jobs={jobs} partners={partners} onClose={() => {}} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inHouseCount}</p>
                <p className="text-xs text-muted-foreground">In-House</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Handshake className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{partnerCount}</p>
                <p className="text-xs text-muted-foreground">Partner</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{hybridCount}</p>
                <p className="text-xs text-muted-foreground">Hybrid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
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
              <Button variant="outline" size="sm" onClick={goToToday} data-testid="button-today">
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={goToPreviousWeek} data-testid="button-prev-week">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextWeek} data-testid="button-next-week">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-96 flex items-center justify-center text-muted-foreground">
              Loading calendar...
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const dayEvents = getEventsForDay(day);
                const isToday = isSameDay(day, new Date());
                return (
                  <div key={day.toISOString()} className="min-h-[200px]">
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
                    <div className="border border-t-0 rounded-b-md p-2 min-h-[150px] bg-card">
                      {dayEvents.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">No events</p>
                      ) : (
                        dayEvents.map((event) => (
                          <EventCard
                            key={event.id}
                            event={event}
                            onConfirm={() => confirmMutation.mutate(event.id)}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500" />
              <span className="text-sm">In-House (CCC Team Only)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500" />
              <span className="text-sm">Partner (Trade Partner Work)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-500" />
              <span className="text-sm">Hybrid (CCC + Partner)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm">Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-sm">Pending</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

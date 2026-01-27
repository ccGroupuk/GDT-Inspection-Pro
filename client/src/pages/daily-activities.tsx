import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Phone, 
  MessageSquare, 
  Mail, 
  Facebook, 
  Globe, 
  User, 
  Plus,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Target,
  Sparkles,
  Trash2,
  ChevronDown,
  FileText,
  Star
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DailyActivity, Contact, Job } from "@shared/schema";

const ACTIVITY_TYPES = [
  { value: "phone_call", label: "Phone Call", icon: Phone },
  { value: "sms", label: "SMS", icon: MessageSquare },
  { value: "email", label: "Email", icon: Mail },
  { value: "facebook_message", label: "Facebook Message", icon: Facebook },
  { value: "website_enquiry", label: "Website Enquiry", icon: Globe },
  { value: "in_person", label: "In Person", icon: User },
  { value: "site_visit", label: "Site Visit", icon: Target },
  { value: "quote_sent", label: "Quote Sent", icon: FileText },
  { value: "follow_up", label: "Follow Up", icon: Star },
];

const OUTCOMES = [
  { value: "successful", label: "Successful", color: "bg-green-500" },
  { value: "no_answer", label: "No Answer", color: "bg-amber-500" },
  { value: "voicemail", label: "Voicemail", color: "bg-blue-500" },
  { value: "callback_requested", label: "Callback Requested", color: "bg-purple-500" },
  { value: "not_interested", label: "Not Interested", color: "bg-red-500" },
  { value: "quote_requested", label: "Quote Requested", color: "bg-emerald-500" },
  { value: "booked", label: "Booked", color: "bg-green-600" },
  { value: "pending", label: "Pending", color: "bg-gray-500" },
];

const LEAD_SOURCES = [
  "Facebook",
  "Google Search",
  "Website",
  "Word of Mouth",
  "Returning Customer",
  "Partner Referral",
  "Trade Association",
  "Flyer/Leaflet",
  "Other",
];

interface ActivityFormData {
  activityType: string;
  direction: string;
  contactId: string | null;
  jobId: string | null;
  notes: string;
  outcome: string;
  followUpDate: string;
  followUpNotes: string;
  durationMinutes: number | null;
  linkedLead: boolean;
  leadSource: string;
}

interface EndOfDaySummary {
  totalInteractions: number;
  newContacts: number;
  newEnquiries: number;
  quotesSent: number;
  jobsWon: number;
  revenueWon: number;
}

interface EndOfDayData {
  date: string;
  summary: EndOfDaySummary;
  activityBreakdown: Record<string, number>;
  recentActivities: DailyActivity[];
  followUpsForTomorrow: DailyActivity[];
}

export default function DailyActivitiesPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("log");
  const [reportPeriod, setReportPeriod] = useState("today");
  const [formData, setFormData] = useState<ActivityFormData>({
    activityType: "phone_call",
    direction: "outbound",
    contactId: null,
    jobId: null,
    notes: "",
    outcome: "",
    followUpDate: "",
    followUpNotes: "",
    durationMinutes: null,
    linkedLead: false,
    leadSource: "",
  });

  const { data: activities = [], isLoading } = useQuery<DailyActivity[]>({
    queryKey: ["/api/daily-activities"],
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: reportData } = useQuery({
    queryKey: ["/api/activity-reports", reportPeriod],
    queryFn: () => fetch(`/api/activity-reports?period=${reportPeriod}`).then(res => res.json()),
  });

  const { data: endOfDayData } = useQuery<EndOfDayData>({
    queryKey: ["/api/activity-reports/end-of-day"],
  });

  const createActivityMutation = useMutation({
    mutationFn: (data: Partial<ActivityFormData>) =>
      apiRequest("POST", "/api/daily-activities", {
        ...data,
        activityDate: new Date().toISOString(),
        followUpDate: data.followUpDate || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-reports/end-of-day"] });
      toast({ title: "Activity logged successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to log activity", variant: "destructive" });
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/daily-activities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-reports/end-of-day"] });
      toast({ title: "Activity deleted" });
    },
  });

  const resetForm = () => {
    setFormData({
      activityType: "phone_call",
      direction: "outbound",
      contactId: null,
      jobId: null,
      notes: "",
      outcome: "",
      followUpDate: "",
      followUpNotes: "",
      durationMinutes: null,
      linkedLead: false,
      leadSource: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.activityType) {
      toast({ title: "Please select an activity type", variant: "destructive" });
      return;
    }
    createActivityMutation.mutate(formData);
  };

  const getActivityIcon = (type: string) => {
    const activity = ACTIVITY_TYPES.find(a => a.value === type);
    if (activity) {
      const Icon = activity.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <Phone className="h-4 w-4" />;
  };

  const getOutcomeBadge = (outcome: string | null) => {
    if (!outcome) return null;
    const outcomeInfo = OUTCOMES.find(o => o.value === outcome);
    return (
      <Badge variant="outline" className="text-xs">
        {outcomeInfo?.label || outcome}
      </Badge>
    );
  };

  const todayActivities = activities.filter(a => {
    const activityDate = new Date(a.activityDate);
    const today = new Date();
    return activityDate.toDateString() === today.toDateString();
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Daily Activity Log</h1>
          <p className="text-muted-foreground">Track calls, messages, and interactions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-activity">
              <Plus className="h-4 w-4 mr-2" />
              Log Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Log New Activity</DialogTitle>
              <DialogDescription>Record a call, message, or interaction</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Activity Type</label>
                  <Select 
                    value={formData.activityType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, activityType: value }))}
                  >
                    <SelectTrigger data-testid="select-activity-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Direction</label>
                  <Select 
                    value={formData.direction}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, direction: value }))}
                  >
                    <SelectTrigger data-testid="select-direction">
                      <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outbound">Outbound (I contacted them)</SelectItem>
                      <SelectItem value="inbound">Inbound (They contacted me)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Link to Contact (optional)</label>
                <Select 
                  value={formData.contactId || ""}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, contactId: value || null }))}
                >
                  <SelectTrigger data-testid="select-contact">
                    <SelectValue placeholder="Select a contact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No contact linked</SelectItem>
                    {contacts.map(contact => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Link to Job (optional)</label>
                <Select 
                  value={formData.jobId || ""}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, jobId: value || null }))}
                >
                  <SelectTrigger data-testid="select-job">
                    <SelectValue placeholder="Select a job" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No job linked</SelectItem>
                    {jobs.slice(0, 50).map(job => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.jobNumber} - {job.serviceType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Outcome</label>
                <Select 
                  value={formData.outcome}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, outcome: value }))}
                >
                  <SelectTrigger data-testid="select-outcome">
                    <SelectValue placeholder="Select outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTCOMES.map(outcome => (
                      <SelectItem key={outcome.value} value={outcome.value}>
                        {outcome.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Duration (minutes)</label>
                <Input
                  type="number"
                  placeholder="e.g. 15"
                  value={formData.durationMinutes || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, durationMinutes: e.target.value ? parseInt(e.target.value) : null }))}
                  data-testid="input-duration"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Add any notes about this interaction..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  data-testid="textarea-notes"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Follow-up Date</label>
                  <Input
                    type="date"
                    value={formData.followUpDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))}
                    data-testid="input-followup-date"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lead Source</label>
                  <Select 
                    value={formData.leadSource}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, leadSource: value, linkedLead: true }))}
                  >
                    <SelectTrigger data-testid="select-lead-source">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_SOURCES.map(source => (
                        <SelectItem key={source} value={source}>{source}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Follow-up Notes</label>
                <Input
                  placeholder="What to follow up on..."
                  value={formData.followUpNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, followUpNotes: e.target.value }))}
                  data-testid="input-followup-notes"
                />
              </div>

              <Button 
                className="w-full" 
                onClick={handleSubmit}
                disabled={createActivityMutation.isPending}
                data-testid="button-submit-activity"
              >
                {createActivityMutation.isPending ? "Saving..." : "Log Activity"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="log" data-testid="tab-log">Activity Log</TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
          <TabsTrigger value="highlights" data-testid="tab-highlights">End of Day</TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Today's Interactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-today-count">{todayActivities.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Outbound</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5 text-blue-500" />
                  {todayActivities.filter(a => a.direction === "outbound").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Inbound</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <ArrowDownLeft className="h-5 w-5 text-green-500" />
                  {todayActivities.filter(a => a.direction === "inbound").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Successful</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  {todayActivities.filter(a => a.outcome === "successful" || a.outcome === "booked").length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Your logged calls, messages, and interactions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No activities logged yet</p>
                  <p className="text-sm mt-1">Click "Log Activity" to record your first interaction</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {activities.map(activity => {
                      const contact = contacts.find(c => c.id === activity.contactId);
                      const job = jobs.find(j => j.id === activity.jobId);
                      return (
                        <div 
                          key={activity.id} 
                          className="flex items-start gap-4 p-4 rounded-lg border"
                          data-testid={`activity-item-${activity.id}`}
                        >
                          <div className={`p-2 rounded-full ${activity.direction === "inbound" ? "bg-green-100 dark:bg-green-900" : "bg-blue-100 dark:bg-blue-900"}`}>
                            {getActivityIcon(activity.activityType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">
                                {ACTIVITY_TYPES.find(t => t.value === activity.activityType)?.label || activity.activityType}
                              </span>
                              {activity.direction === "inbound" && (
                                <Badge variant="secondary" className="text-xs">
                                  <ArrowDownLeft className="h-3 w-3 mr-1" />
                                  Inbound
                                </Badge>
                              )}
                              {getOutcomeBadge(activity.outcome)}
                              {activity.leadSource && (
                                <Badge variant="outline" className="text-xs">
                                  {activity.leadSource}
                                </Badge>
                              )}
                            </div>
                            {contact && (
                              <p className="text-sm text-muted-foreground mt-1">
                                <User className="h-3 w-3 inline mr-1" />
                                {contact.name}
                              </p>
                            )}
                            {job && (
                              <p className="text-sm text-muted-foreground">
                                Job: {job.jobNumber} - {job.serviceType}
                              </p>
                            )}
                            {activity.notes && (
                              <p className="text-sm mt-2">{activity.notes}</p>
                            )}
                            {activity.followUpDate && (
                              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Follow-up: {format(new Date(activity.followUpDate), "dd MMM yyyy")}
                                {activity.followUpNotes && ` - ${activity.followUpNotes}`}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(activity.activityDate), "HH:mm")}
                              </span>
                              {activity.durationMinutes && (
                                <span>{activity.durationMinutes} min</span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteActivityMutation.mutate(activity.id)}
                            data-testid={`button-delete-activity-${activity.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={reportPeriod} onValueChange={setReportPeriod}>
              <SelectTrigger className="w-48" data-testid="select-report-period">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reportData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Activities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-report-total">{reportData.metrics?.totalActivities || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">New Leads</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      {reportData.highlights?.newLeads || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Quotes Accepted</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      {reportData.highlights?.quotesAccepted || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Revenue Won</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-report-revenue">
                      £{(reportData.highlights?.totalRevenue || 0).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Breakdown by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(reportData.metrics?.byType || {}).map(([type, count]) => {
                        const activityInfo = ACTIVITY_TYPES.find(t => t.value === type);
                        const Icon = activityInfo?.icon || Phone;
                        return (
                          <div key={type} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span>{activityInfo?.label || type}</span>
                            </div>
                            <Badge variant="secondary">{count as number}</Badge>
                          </div>
                        );
                      })}
                      {Object.keys(reportData.metrics?.byType || {}).length === 0 && (
                        <p className="text-muted-foreground text-center py-4">No activities in this period</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Outcomes Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(reportData.metrics?.byOutcome || {}).map(([outcome, count]) => {
                        const outcomeInfo = OUTCOMES.find(o => o.value === outcome);
                        return (
                          <div key={outcome} className="flex items-center justify-between">
                            <span>{outcomeInfo?.label || outcome}</span>
                            <Badge variant="secondary">{count as number}</Badge>
                          </div>
                        );
                      })}
                      {Object.keys(reportData.metrics?.byOutcome || {}).length === 0 && (
                        <p className="text-muted-foreground text-center py-4">No outcomes recorded</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold">{reportData.highlights?.conversionRate || 0}%</div>
                    <div className="text-muted-foreground">
                      <p>Leads converted to accepted quotes</p>
                      <p className="text-sm">{reportData.highlights?.quotesAccepted || 0} of {reportData.highlights?.newLeads || 0} leads</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="highlights" className="space-y-4">
          {endOfDayData && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    <CardTitle>End of Day Summary - {endOfDayData.date}</CardTitle>
                  </div>
                  <CardDescription>Your daily performance highlights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <div className="text-3xl font-bold text-foreground" data-testid="text-eod-interactions">
                        {endOfDayData.summary?.totalInteractions || 0}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Interactions</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {endOfDayData.summary?.newContacts || 0}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">New Contacts</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {endOfDayData.summary?.newEnquiries || 0}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">New Enquiries</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                        {endOfDayData.summary?.quotesSent || 0}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Quotes Sent</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        {endOfDayData.summary?.jobsWon || 0}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Jobs Won</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="text-eod-revenue">
                        £{(endOfDayData.summary?.revenueWon || 0).toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Revenue Won</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(endOfDayData.activityBreakdown || {}).map(([type, count]) => {
                        const activityInfo = ACTIVITY_TYPES.find(t => t.value === type);
                        const Icon = activityInfo?.icon || Phone;
                        return (
                          <div key={type} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span>{activityInfo?.label || type}</span>
                            </div>
                            <Badge variant="secondary">{count as number}</Badge>
                          </div>
                        );
                      })}
                      {Object.keys(endOfDayData.activityBreakdown || {}).length === 0 && (
                        <p className="text-muted-foreground text-center py-4">No activities logged today</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Follow-ups Tomorrow
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(endOfDayData.followUpsForTomorrow?.length || 0) === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No follow-ups scheduled</p>
                    ) : (
                      <div className="space-y-3">
                        {endOfDayData.followUpsForTomorrow.map((activity: DailyActivity) => {
                          const contact = contacts.find(c => c.id === activity.contactId);
                          return (
                            <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg border">
                              {getActivityIcon(activity.activityType)}
                              <div className="flex-1">
                                <p className="font-medium">
                                  {contact ? contact.name : "Unknown Contact"}
                                </p>
                                {activity.followUpNotes && (
                                  <p className="text-sm text-muted-foreground">{activity.followUpNotes}</p>
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
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

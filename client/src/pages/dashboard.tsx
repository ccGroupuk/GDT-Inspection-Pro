import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { DashboardSkeleton } from "@/components/loading-skeleton";
import {
  Briefcase,
  Users,
  Handshake,
  PoundSterling,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  ThumbsUp,
  Sparkles,
  Bell,
  CalendarCheck,
  CalendarClock,
  UserCheck,
  Check,
  ClipboardCheck,
  FileText,
  GripVertical
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Job, Contact, TradePartner, Task, JobScheduleProposal, JobSurvey, PartnerQuote } from "@shared/schema";
import { ProjectCountdownWidget } from "@/components/ProjectCountdownWidget";
import DailyQuote from "@/components/DailyQuote";
import { Reorder } from "framer-motion";
import { useState, useEffect } from "react";

interface DashboardData {
  jobs: Job[];
  contacts: Contact[];
  partners: TradePartner[];
  tasks: Task[];
  scheduleResponses: JobScheduleProposal[];
  pendingSurveyAcceptances: JobSurvey[];
  pendingPartnerQuotes: PartnerQuote[];
}

export default function Dashboard() {
  const { toast } = useToast();
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  const [widgetOrder, setWidgetOrder] = useState<string[]>(["summary-stats", "project-focus", "active-notifications", "job-list", "detailed-stats"]);

  // Load order from local storage
  useEffect(() => {
    const savedOrder = localStorage.getItem("dashboard-widget-order");
    if (savedOrder) {
      try {
        setWidgetOrder(JSON.parse(savedOrder));
      } catch (e) {
        console.error("Failed to parse dashboard order");
      }
    }
  }, []);

  // Save order to local storage
  const handleReorder = (newOrder: string[]) => {
    setWidgetOrder(newOrder);
    localStorage.setItem("dashboard-widget-order", JSON.stringify(newOrder));
  };

  const acknowledgePartnerAcceptanceMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiRequest("POST", `/api/jobs/${jobId}/acknowledge-partner-acceptance`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Partner acceptance acknowledged" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
        <DashboardSkeleton />
      </div>
    );
  }

  const jobs = data?.jobs || [];
  const contacts = data?.contacts || [];
  const partners = data?.partners || [];
  const tasks = data?.tasks || [];
  const scheduleResponses = data?.scheduleResponses || [];
  const pendingSurveyAcceptances = data?.pendingSurveyAcceptances || [];
  const pendingPartnerQuotes = data?.pendingPartnerQuotes || [];

  const activeJobs = jobs.filter(j => !["closed", "lost", "paid"].includes(j.status));
  const newEnquiries = jobs.filter(j => j.status === "new_enquiry");
  const inProgressJobs = jobs.filter(j => j.status === "in_progress");
  const pendingDeposits = jobs.filter(j => j.depositRequired && !j.depositReceived);
  const quotesAccepted = jobs.filter(j => j.quoteResponse === "accepted" || j.status === "quote_accepted");
  const totalQuotedValue = jobs.reduce((sum, j) => sum + Number(j.quotedValue || 0), 0);
  const partnerJobs = jobs.filter(j => j.deliveryType === "partner" || j.deliveryType === "hybrid");
  const inHouseJobs = jobs.filter(j => j.deliveryType === "in_house");
  const pendingTasks = tasks.filter(t => t.status === "pending");
  const unacknowledgedPartnerAcceptances = jobs.filter(j =>
    j.partnerStatus === "accepted" && !j.partnerAcceptanceAcknowledged
  );
  const recentJobs = [...jobs].sort((a, b) =>
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  ).slice(0, 5);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <span className="text-sm text-muted-foreground">
          Welcome back! Here's your business overview. Drag sections to reorder.
        </span>
      </div>

      <Reorder.Group axis="y" values={widgetOrder} onReorder={handleReorder} className="space-y-6">
        {widgetOrder.map((widgetId) => (
          <Reorder.Item key={widgetId} value={widgetId} className="list-none relative group">
            {/* Drag Handle */}
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 bg-muted rounded z-10 hidden lg:block">
              <GripVertical className="w-5 h-5 text-muted-foreground" />
            </div>

            {widgetId === "summary-stats" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard
                  title="Active Jobs"
                  value={activeJobs.length}
                  icon={Briefcase}
                  description={`${newEnquiries.length} new enquiries`}
                />
                <StatCard
                  title="Quotes Accepted"
                  value={quotesAccepted.length}
                  icon={ThumbsUp}
                  description="Ready to schedule"
                  data-testid="stat-quotes-accepted"
                />
                <StatCard
                  title="Total Contacts"
                  value={contacts.length}
                  icon={Users}
                  description="Clients in database"
                />
                <StatCard
                  title="Trade Partners"
                  value={partners.length}
                  icon={Handshake}
                  description={`${partners.filter(p => p.isActive).length} active`}
                />
                <StatCard
                  title="Pipeline Value"
                  value={`£${totalQuotedValue.toLocaleString()}`}
                  icon={PoundSterling}
                  description="Total quoted value"
                />
              </div>
            )}

            {widgetId === "project-focus" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ProjectCountdownWidget />
                <DailyQuote />
              </div>
            )}

            {widgetId === "active-notifications" && (
              <div className="space-y-6">
                {unacknowledgedPartnerAcceptances.length > 0 && (
                  <Card className="border-green-500/30 bg-green-500/5">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <CardTitle className="text-base font-semibold">Partner Acceptances</CardTitle>
                        <Badge variant="secondary" className="ml-auto">{unacknowledgedPartnerAcceptances.length}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {unacknowledgedPartnerAcceptances.map(job => {
                          const partner = partners.find(p => p.id === job.partnerId);
                          return (
                            <div key={job.id} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-background" data-testid={`notification-partner-acceptance-${job.id}`}>
                              <Link href={`/jobs/${job.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 shrink-0">
                                  <Handshake className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 min-w-0">
                                  <span className="text-sm font-medium truncate">{job.jobNumber} - {job.serviceType}</span>
                                  <span className="text-xs text-muted-foreground truncate">
                                    {partner?.businessName || "Partner"} accepted
                                    {job.partnerRespondedAt && <> on {new Date(job.partnerRespondedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</>}
                                  </span>
                                </div>
                              </Link>
                              <Button size="sm" variant="outline" onClick={() => acknowledgePartnerAcceptanceMutation.mutate(job.id)} disabled={acknowledgePartnerAcceptanceMutation.isPending} data-testid={`button-acknowledge-${job.id}`}>
                                <Check className="w-4 h-4 mr-1" />
                                Acknowledge
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {scheduleResponses.length > 0 && (
                  <Card className="border-orange-500/30 bg-orange-500/5">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        <CardTitle className="text-base font-semibold">Schedule Responses</CardTitle>
                        <Badge variant="secondary" className="ml-auto">{scheduleResponses.length}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {scheduleResponses.map(proposal => {
                          const job = jobs.find(j => j.id === proposal.jobId);
                          const isAccepted = proposal.status === "scheduled";
                          return (
                            <Link key={proposal.id} href={`/jobs/${proposal.jobId}`}>
                              <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-background hover-elevate active-elevate-2 cursor-pointer" data-testid={`notification-schedule-${proposal.id}`}>
                                <div className="flex items-center gap-3">
                                  {isAccepted ? (
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                                      <CalendarCheck className="w-4 h-4" />
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                                      <CalendarClock className="w-4 h-4" />
                                    </div>
                                  )}
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-medium">{job?.jobNumber || "Unknown Job"} - {job?.serviceType || "Service"}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {isAccepted ? (
                                        <>Client accepted: {new Date(proposal.proposedStartDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</>
                                      ) : (
                                        <>Client proposed: {proposal.counterProposedDate ? new Date(proposal.counterProposedDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : 'New date'}</>
                                      )}
                                    </span>
                                  </div>
                                </div>
                                <Badge variant={isAccepted ? "default" : "secondary"} className={isAccepted ? "bg-green-600" : ""}>
                                  {isAccepted ? "Accepted" : "Counter Proposal"}
                                </Badge>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {pendingSurveyAcceptances.length > 0 && (
                  <Card className="border-blue-500/30 bg-blue-500/5">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <ClipboardCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <CardTitle className="text-base font-semibold">Survey Responses</CardTitle>
                        <Badge variant="secondary" className="ml-auto">{pendingSurveyAcceptances.length}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {pendingSurveyAcceptances.map(survey => {
                          const job = jobs.find(j => j.id === survey.jobId);
                          const partner = partners.find(p => p.id === survey.partnerId);
                          const isAccepted = survey.bookingStatus === "client_accepted";
                          const displayDate = survey.bookingStatus === "client_counter" && survey.clientProposedDate ? survey.clientProposedDate : survey.proposedDate;
                          return (
                            <Link key={survey.id} href={`/jobs/${survey.jobId}`}>
                              <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-background hover-elevate active-elevate-2 cursor-pointer" data-testid={`notification-survey-${survey.id}`}>
                                <div className="flex items-center gap-3">
                                  {isAccepted ? (
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                                      <CalendarCheck className="w-4 h-4" />
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                                      <CalendarClock className="w-4 h-4" />
                                    </div>
                                  )}
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-medium">{job?.jobNumber || "Unknown"} - Survey</span>
                                    <span className="text-xs text-muted-foreground">
                                      {isAccepted ? (
                                        <>Client accepted: {displayDate ? new Date(displayDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Date TBC'}</>
                                      ) : (
                                        <>Client proposed: {displayDate ? new Date(displayDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : 'New date'}</>
                                      )}
                                      {partner && <> with {partner.businessName}</>}
                                    </span>
                                  </div>
                                </div>
                                <Badge variant={isAccepted ? "default" : "secondary"} className={isAccepted ? "bg-green-600" : ""}>
                                  {isAccepted ? "Accepted" : "Counter Proposal"}
                                </Badge>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {pendingPartnerQuotes.length > 0 && (
                  <Card className="border-purple-500/30 bg-purple-500/5">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <CardTitle className="text-base font-semibold">Partner Quotations</CardTitle>
                        <Badge variant="secondary" className="ml-auto">{pendingPartnerQuotes.length}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {pendingPartnerQuotes.map(quote => {
                          const job = jobs.find(j => j.id === quote.jobId);
                          const partner = partners.find(p => p.id === quote.partnerId);
                          return (
                            <Link key={quote.id} href={`/jobs/${quote.jobId}`}>
                              <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-background hover-elevate active-elevate-2 cursor-pointer" data-testid={`notification-partner-quote-${quote.id}`}>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-medium">{job?.jobNumber || "Unknown"} - {job?.serviceType || "Job"}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {partner?.businessName || "Partner"} submitted quote
                                      {quote.total && <> for £{Number(quote.total).toLocaleString()}</>}
                                    </span>
                                  </div>
                                </div>
                                <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20">
                                  Awaiting Review
                                </Badge>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {widgetId === "job-list" && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle className="text-base font-semibold">Job Pipeline</CardTitle>
                    <Link href="/jobs" className="text-sm text-primary hover:underline" data-testid="link-view-all-jobs">
                      View All
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentJobs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No jobs yet</p>
                  ) : (
                    <div className="space-y-3">
                      {recentJobs.map(job => {
                        const isQuoteAccepted = job.quoteResponse === "accepted" || job.status === "quote_accepted";
                        return (
                          <Link key={job.id} href={`/jobs/${job.id}`}>
                            <div className={`flex items-center justify-between gap-4 p-3 rounded-lg hover-elevate active-elevate-2 cursor-pointer ${isQuoteAccepted ? "ring-1 ring-green-500/30 bg-green-500/5" : ""}`} data-testid={`dashboard-job-${job.id}`}>
                              <div className="flex flex-col gap-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs text-muted-foreground">{job.jobNumber}</span>
                                  <StatusBadge status={job.status} />
                                  {isQuoteAccepted && (
                                    <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 text-xs">
                                      <Sparkles className="w-3 h-3 mr-1" />
                                      Accepted
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-sm font-medium truncate">{job.serviceType}</span>
                              </div>
                              <div className="text-right shrink-0">
                                {job.quotedValue && <span className="font-mono text-sm font-semibold">£{Number(job.quotedValue).toLocaleString()}</span>}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {widgetId === "detailed-stats" && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle className="text-base font-semibold">Quick Stats</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <Clock className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">In Progress</span>
                      </div>
                      <span className="text-lg font-semibold">{inProgressJobs.length}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">Pending Deposits</span>
                      </div>
                      <span className="text-lg font-semibold">{pendingDeposits.length}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">In-House Jobs</span>
                      </div>
                      <span className="text-lg font-semibold">{inHouseJobs.length}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          <Handshake className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">Partner Jobs</span>
                      </div>
                      <span className="text-lg font-semibold">{partnerJobs.length}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">Pending Tasks</span>
                      </div>
                      <span className="text-lg font-semibold">{pendingTasks.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
}

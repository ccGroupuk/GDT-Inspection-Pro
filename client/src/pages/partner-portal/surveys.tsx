import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { usePartnerPortalAuth } from "@/hooks/use-partner-portal-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  Briefcase, LogOut, Loader2, Calendar, HelpCircle, Settings, 
  ClipboardCheck, MapPin, User, Check, X, Clock, FileText, Plus
} from "lucide-react";
import type { JobSurvey, Job, Contact } from "@shared/schema";

type SurveyWithDetails = JobSurvey & { 
  job?: Job; 
  contact?: Contact | null;
};

function getSurveyStatusColor(status: string) {
  switch (status) {
    case "requested":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "accepted":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
    case "scheduled":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "declined":
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  }
}

export default function PartnerPortalSurveys() {
  const { token, isAuthenticated, logout } = usePartnerPortalAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyWithDetails | null>(null);
  
  const [acceptNotes, setAcceptNotes] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [surveyDetails, setSurveyDetails] = useState("");
  const [completeNotes, setCompleteNotes] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/partner-portal/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: surveys, isLoading } = useQuery<SurveyWithDetails[]>({
    queryKey: ["/api/partner-portal/surveys"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await fetch("/api/partner-portal/surveys", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load surveys");
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

  const acceptMutation = useMutation({
    mutationFn: async (data: { surveyId: string; notes?: string }) => {
      const res = await fetch(`/api/partner-portal/surveys/${data.surveyId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: data.notes }),
      });
      if (!res.ok) throw new Error("Failed to accept survey");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/surveys"] });
      toast({ title: "Survey accepted" });
      setAcceptDialogOpen(false);
      setSelectedSurvey(null);
      setAcceptNotes("");
    },
    onError: () => {
      toast({ title: "Error accepting survey", variant: "destructive" });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (data: { surveyId: string; reason?: string }) => {
      const res = await fetch(`/api/partner-portal/surveys/${data.surveyId}/decline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: data.reason }),
      });
      if (!res.ok) throw new Error("Failed to decline survey");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/surveys"] });
      toast({ title: "Survey declined" });
      setDeclineDialogOpen(false);
      setSelectedSurvey(null);
      setDeclineReason("");
    },
    onError: () => {
      toast({ title: "Error declining survey", variant: "destructive" });
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async (data: { surveyId: string; scheduledDate: string; scheduledTime?: string; notes?: string }) => {
      const res = await fetch(`/api/partner-portal/surveys/${data.surveyId}/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scheduledDate: data.scheduledDate,
          scheduledTime: data.scheduledTime,
          notes: data.notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to schedule survey");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/surveys"] });
      toast({ title: "Survey scheduled" });
      setScheduleDialogOpen(false);
      setSelectedSurvey(null);
      setScheduleDate("");
      setScheduleTime("");
      setScheduleNotes("");
    },
    onError: () => {
      toast({ title: "Error scheduling survey", variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (data: { surveyId: string; surveyDetails?: string; notes?: string }) => {
      const res = await fetch(`/api/partner-portal/surveys/${data.surveyId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          surveyDetails: data.surveyDetails,
          notes: data.notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to complete survey");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/surveys"] });
      toast({ title: "Survey completed" });
      setCompleteDialogOpen(false);
      setSelectedSurvey(null);
      setSurveyDetails("");
      setCompleteNotes("");
    },
    onError: () => {
      toast({ title: "Error completing survey", variant: "destructive" });
    },
  });

  const openAcceptDialog = (survey: SurveyWithDetails) => {
    setSelectedSurvey(survey);
    setAcceptNotes("");
    setAcceptDialogOpen(true);
  };

  const openDeclineDialog = (survey: SurveyWithDetails) => {
    setSelectedSurvey(survey);
    setDeclineReason("");
    setDeclineDialogOpen(true);
  };

  const openScheduleDialog = (survey: SurveyWithDetails) => {
    setSelectedSurvey(survey);
    setScheduleDate(survey.scheduledDate ? new Date(survey.scheduledDate).toISOString().split('T')[0] : "");
    setScheduleTime(survey.scheduledTime || "");
    setScheduleNotes("");
    setScheduleDialogOpen(true);
  };

  const openCompleteDialog = (survey: SurveyWithDetails) => {
    setSelectedSurvey(survey);
    setSurveyDetails(survey.surveyDetails || "");
    setCompleteNotes("");
    setCompleteDialogOpen(true);
  };

  if (!isAuthenticated) {
    return null;
  }

  const pendingSurveys = surveys?.filter(s => s.status === "requested") || [];
  const activeSurveys = surveys?.filter(s => s.status === "accepted" || s.status === "scheduled") || [];
  const completedSurveys = surveys?.filter(s => s.status === "completed" || s.status === "declined" || s.status === "cancelled") || [];

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
          <Button variant="ghost" size="sm" onClick={logout} data-testid="button-partner-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <nav className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            <Link href="/partner-portal">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none border-b-2 border-transparent text-muted-foreground"
                data-testid="nav-jobs"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Jobs
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-none border-b-2 border-primary text-foreground"
              data-testid="nav-surveys"
            >
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Surveys
            </Button>
            <Link href="/partner-portal/quotes">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none border-b-2 border-transparent text-muted-foreground"
                data-testid="nav-quotes"
              >
                <FileText className="w-4 h-4 mr-2" />
                Quotes
              </Button>
            </Link>
            <Link href="/partner-portal/calendar">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none border-b-2 border-transparent text-muted-foreground"
                data-testid="nav-calendar"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Calendar
              </Button>
            </Link>
            <Link href="/partner-portal/help">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none border-b-2 border-transparent text-muted-foreground"
                data-testid="nav-help"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Help
              </Button>
            </Link>
            <Link href="/partner-portal/profile">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none border-b-2 border-transparent text-muted-foreground"
                data-testid="nav-profile"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-1">Survey Requests</h2>
          <p className="text-muted-foreground">
            Accept survey requests, schedule visits, and submit your findings
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !surveys || surveys.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Survey Requests</h3>
              <p className="text-muted-foreground">
                You don't have any survey requests yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {pendingSurveys.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Pending Requests ({pendingSurveys.length})
                </h3>
                <div className="space-y-4">
                  {pendingSurveys.map((survey) => (
                    <Card key={survey.id} data-testid={`card-survey-${survey.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <CardTitle className="text-lg">{survey.job?.jobNumber || "Unknown Job"}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {survey.job?.serviceType}
                            </p>
                          </div>
                          <Badge className={getSurveyStatusColor(survey.status)}>
                            {survey.status.charAt(0).toUpperCase() + survey.status.slice(1)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                          {survey.contact && (
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>{survey.contact.name}</span>
                            </div>
                          )}
                          {survey.job?.jobPostcode && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{survey.job.jobPostcode}</span>
                            </div>
                          )}
                          {survey.scheduledDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Suggested: {new Date(survey.scheduledDate).toLocaleDateString()}</span>
                              {survey.scheduledTime && <span>at {survey.scheduledTime}</span>}
                            </div>
                          )}
                        </div>
                        {survey.adminNotes && (
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md mb-4">
                            {survey.adminNotes}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => openAcceptDialog(survey)}
                            data-testid={`button-accept-survey-${survey.id}`}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDeclineDialog(survey)}
                            data-testid={`button-decline-survey-${survey.id}`}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeSurveys.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  Active Surveys ({activeSurveys.length})
                </h3>
                <div className="space-y-4">
                  {activeSurveys.map((survey) => (
                    <Card key={survey.id} data-testid={`card-survey-${survey.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <CardTitle className="text-lg">{survey.job?.jobNumber || "Unknown Job"}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {survey.job?.serviceType}
                            </p>
                          </div>
                          <Badge className={getSurveyStatusColor(survey.status)}>
                            {survey.status.charAt(0).toUpperCase() + survey.status.slice(1)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                          {survey.contact && (
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>{survey.contact.name}</span>
                            </div>
                          )}
                          {survey.job?.jobPostcode && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{survey.job.jobPostcode}</span>
                            </div>
                          )}
                          {survey.scheduledDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(survey.scheduledDate).toLocaleDateString()}</span>
                              {survey.scheduledTime && <span>at {survey.scheduledTime}</span>}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {survey.status === "accepted" && (
                            <Button
                              size="sm"
                              onClick={() => openScheduleDialog(survey)}
                              data-testid={`button-schedule-survey-${survey.id}`}
                            >
                              <Calendar className="w-4 h-4 mr-1" />
                              Schedule
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant={survey.status === "scheduled" ? "default" : "outline"}
                            onClick={() => openCompleteDialog(survey)}
                            data-testid={`button-complete-survey-${survey.id}`}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Complete
                          </Button>
                          <Link href={`/partner-portal/quotes/new?surveyId=${survey.id}&jobId=${survey.jobId}`}>
                            <Button size="sm" variant="outline" data-testid={`button-create-quote-${survey.id}`}>
                              <FileText className="w-4 h-4 mr-1" />
                              Create Quote
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {completedSurveys.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  Completed / Closed ({completedSurveys.length})
                </h3>
                <div className="space-y-4">
                  {completedSurveys.map((survey) => (
                    <Card key={survey.id} className="opacity-75" data-testid={`card-survey-${survey.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <CardTitle className="text-lg">{survey.job?.jobNumber || "Unknown Job"}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {survey.job?.serviceType}
                            </p>
                          </div>
                          <Badge className={getSurveyStatusColor(survey.status)}>
                            {survey.status.charAt(0).toUpperCase() + survey.status.slice(1)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          {survey.contact && (
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>{survey.contact.name}</span>
                            </div>
                          )}
                          {survey.job?.jobPostcode && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{survey.job.jobPostcode}</span>
                            </div>
                          )}
                        </div>
                        {survey.surveyDetails && (
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md mt-4">
                            {survey.surveyDetails}
                          </p>
                        )}
                        {survey.status === "completed" && (
                          <div className="mt-4">
                            <Link href={`/partner-portal/quotes/new?surveyId=${survey.id}&jobId=${survey.jobId}`}>
                              <Button size="sm" variant="outline" data-testid={`button-create-quote-${survey.id}`}>
                                <Plus className="w-4 h-4 mr-1" />
                                Create Quote
                              </Button>
                            </Link>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Survey Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              You are accepting the survey request for <strong>{selectedSurvey?.job?.jobNumber}</strong>.
            </p>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={acceptNotes}
                onChange={(e) => setAcceptNotes(e.target.value)}
                placeholder="Any notes about your availability..."
                className="min-h-[80px]"
                data-testid="textarea-accept-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedSurvey) {
                  acceptMutation.mutate({
                    surveyId: selectedSurvey.id,
                    notes: acceptNotes || undefined,
                  });
                }
              }}
              disabled={acceptMutation.isPending}
              data-testid="button-confirm-accept"
            >
              {acceptMutation.isPending ? "Accepting..." : "Accept Survey"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Survey Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to decline the survey request for <strong>{selectedSurvey?.job?.jobNumber}</strong>?
            </p>
            <div className="space-y-2">
              <Label>Reason (Optional)</Label>
              <Textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Please provide a reason for declining..."
                className="min-h-[80px]"
                data-testid="textarea-decline-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedSurvey) {
                  declineMutation.mutate({
                    surveyId: selectedSurvey.id,
                    reason: declineReason || undefined,
                  });
                }
              }}
              disabled={declineMutation.isPending}
              data-testid="button-confirm-decline"
            >
              {declineMutation.isPending ? "Declining..." : "Decline Survey"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Survey Visit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  data-testid="input-schedule-date"
                />
              </div>
              <div className="space-y-2">
                <Label>Time (Optional)</Label>
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  data-testid="input-schedule-time"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={scheduleNotes}
                onChange={(e) => setScheduleNotes(e.target.value)}
                placeholder="Any notes about the visit..."
                className="min-h-[80px]"
                data-testid="textarea-schedule-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!scheduleDate) {
                  toast({ title: "Please select a date", variant: "destructive" });
                  return;
                }
                if (selectedSurvey) {
                  scheduleMutation.mutate({
                    surveyId: selectedSurvey.id,
                    scheduledDate: scheduleDate,
                    scheduledTime: scheduleTime || undefined,
                    notes: scheduleNotes || undefined,
                  });
                }
              }}
              disabled={scheduleMutation.isPending}
              data-testid="button-confirm-schedule"
            >
              {scheduleMutation.isPending ? "Scheduling..." : "Schedule Visit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Survey</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Survey Details / Findings</Label>
              <Textarea
                value={surveyDetails}
                onChange={(e) => setSurveyDetails(e.target.value)}
                placeholder="Describe your findings, measurements, recommendations..."
                className="min-h-[120px]"
                data-testid="textarea-survey-details"
              />
            </div>
            <div className="space-y-2">
              <Label>Additional Notes (Optional)</Label>
              <Textarea
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
                placeholder="Any additional notes..."
                className="min-h-[80px]"
                data-testid="textarea-complete-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedSurvey) {
                  completeMutation.mutate({
                    surveyId: selectedSurvey.id,
                    surveyDetails: surveyDetails || undefined,
                    notes: completeNotes || undefined,
                  });
                }
              }}
              disabled={completeMutation.isPending}
              data-testid="button-confirm-complete"
            >
              {completeMutation.isPending ? "Completing..." : "Mark Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

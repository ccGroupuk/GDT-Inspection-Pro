import { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "wouter";
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
  Briefcase, MapPin, User, Phone, Mail, LogOut, Loader2, 
  ArrowLeft, CheckCircle2, Circle, FileText, MessageSquare, Image,
  Siren, AlertTriangle, CheckCircle, XCircle, Clock, Calendar
} from "lucide-react";
import type { Job, Contact, Task, QuoteItem, JobNote, JobNoteAttachment, EmergencyCallout } from "@shared/schema";
import { NOTE_VISIBILITY } from "@shared/schema";

interface JobNoteWithAttachments extends JobNote {
  attachments: JobNoteAttachment[];
}

type JobWithDetails = Job & { contact?: Contact; tasks?: Task[] };

const PIPELINE_STAGES = [
  "New Enquiry", "Contacted", "Survey Booked", "Quoting", "Quote Sent",
  "Follow-Up Due", "Quote Accepted", "Deposit Requested", "Deposit Paid",
  "Scheduled", "In Progress", "Completed", "Invoice Sent", "Paid", "Closed", "Lost"
];

function getStageLabel(status: string) {
  const index = PIPELINE_STAGES.findIndex(s => s.toLowerCase().replace(/[\s-]/g, '_') === status);
  return index >= 0 ? PIPELINE_STAGES[index] : status;
}

function getStageIndex(status: string) {
  return PIPELINE_STAGES.findIndex(s => s.toLowerCase().replace(/[\s-]/g, '_') === status);
}

function getStageColor(status: string) {
  const stageIndex = getStageIndex(status);
  if (stageIndex < 5) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  if (stageIndex < 9) return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
  if (stageIndex < 12) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  if (stageIndex < 14) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
  if (status === "closed") return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
}

async function partnerApiRequest(method: string, url: string, body: Record<string, unknown>, token: string | null) {
  return fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

export default function PartnerPortalJobDetail() {
  const { token, isAuthenticated, logout } = usePartnerPortalAuth();
  const [, setLocation] = useLocation();
  const { jobId } = useParams<{ jobId: string }>();
  const { toast } = useToast();
  
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [totalCollected, setTotalCollected] = useState<string>("");
  const [completionNotes, setCompletionNotes] = useState("");
  
  // Accept/Decline job state
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  
  // Survey request state
  const [requestSurveyDialogOpen, setRequestSurveyDialogOpen] = useState(false);
  const [surveyPreferredDate, setSurveyPreferredDate] = useState("");
  const [surveyPreferredTime, setSurveyPreferredTime] = useState("");
  const [surveyNotes, setSurveyNotes] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/partner-portal/login");
    }
  }, [isAuthenticated, setLocation]);

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

  const { data: job, isLoading } = useQuery<JobWithDetails>({
    queryKey: ["/api/partner-portal/jobs", jobId],
    enabled: isAuthenticated && !!jobId,
    queryFn: async () => {
      const res = await fetch(`/api/partner-portal/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load job");
      return res.json();
    },
  });

  const { data: quoteItems } = useQuery<QuoteItem[]>({
    queryKey: ["/api/partner-portal/jobs", jobId, "quote-items"],
    enabled: isAuthenticated && !!jobId,
    queryFn: async () => {
      const res = await fetch(`/api/partner-portal/jobs/${jobId}/quote-items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load quote items");
      return res.json();
    },
  });

  const { data: jobNotes } = useQuery<JobNoteWithAttachments[]>({
    queryKey: ["/api/partner-portal/jobs", jobId, "notes"],
    enabled: isAuthenticated && !!jobId,
    queryFn: async () => {
      const res = await fetch(`/api/partner-portal/jobs/${jobId}/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load notes");
      return res.json();
    },
  });

  // Query emergency callout linked to this job where partner is assigned
  const { data: emergencyCallout } = useQuery<EmergencyCallout | null>({
    queryKey: ["/api/partner-portal/jobs", jobId, "emergency-callout"],
    enabled: isAuthenticated && !!jobId,
    queryFn: async () => {
      const res = await fetch(`/api/partner-portal/jobs/${jobId}/emergency-callout`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (data: { calloutId: string; totalCollected: string; completionNotes?: string }) => {
      const res = await partnerApiRequest("POST", `/api/partner-portal/emergency-callouts/${data.calloutId}/complete`, {
        totalCollected: data.totalCollected,
        completionNotes: data.completionNotes,
      }, token);
      if (!res.ok) throw new Error("Failed to complete callout");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/jobs", jobId, "emergency-callout"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/emergency-callouts"] });
      toast({ 
        title: "Emergency Completed", 
        description: data.message || `You owe CCC £${data.feeAmount} (${data.feePercent}% callout fee).`
      });
      setCompleteDialogOpen(false);
      setTotalCollected("");
      setCompletionNotes("");
    },
    onError: (error: Error) => {
      toast({ title: "Error completing callout", description: error.message, variant: "destructive" });
    },
  });

  // Accept job mutation
  const acceptJobMutation = useMutation({
    mutationFn: async () => {
      const res = await partnerApiRequest("POST", `/api/partner-portal/jobs/${jobId}/accept`, {}, token);
      if (!res.ok) throw new Error("Failed to accept job");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/jobs", jobId] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/jobs"] });
      toast({ title: "Job Accepted", description: "You have accepted this job assignment." });
    },
    onError: (error: Error) => {
      toast({ title: "Error accepting job", description: error.message, variant: "destructive" });
    },
  });

  // Request survey mutation
  const requestSurveyMutation = useMutation({
    mutationFn: async (data: { preferredDate?: string; preferredTime?: string; notes?: string }) => {
      const res = await partnerApiRequest("POST", `/api/partner-portal/jobs/${jobId}/request-survey`, data, token);
      if (!res.ok) throw new Error("Failed to request survey");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/jobs", jobId] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/surveys"] });
      toast({ title: "Survey Requested", description: "Your survey request has been submitted to the admin." });
      setRequestSurveyDialogOpen(false);
      setSurveyPreferredDate("");
      setSurveyPreferredTime("");
      setSurveyNotes("");
    },
    onError: (error: Error) => {
      toast({ title: "Error requesting survey", description: error.message, variant: "destructive" });
    },
  });

  // Decline job mutation
  const declineJobMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await partnerApiRequest("POST", `/api/partner-portal/jobs/${jobId}/decline`, { reason }, token);
      if (!res.ok) throw new Error("Failed to decline job");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/jobs", jobId] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/jobs"] });
      toast({ title: "Job Declined", description: "You have declined this job assignment." });
      setDeclineDialogOpen(false);
      setDeclineReason("");
    },
    onError: (error: Error) => {
      toast({ title: "Error declining job", description: error.message, variant: "destructive" });
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  const currentStageIndex = job ? getStageIndex(job.status) : 0;

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

      <main className="container mx-auto px-4 py-6">
        <Link href="/partner-portal/jobs">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-to-jobs">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
        </Link>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !job ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Job not found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl font-semibold">{job.jobNumber}</h2>
                <p className="text-muted-foreground">{job.serviceType}</p>
              </div>
              <Badge className={getStageColor(job.status)} data-testid="badge-job-stage">
                {getStageLabel(job.status)}
              </Badge>
            </div>

            {/* Partner Acceptance Section */}
            {job.partnerStatus === "offered" || !job.partnerStatus ? (
              <Card className="border-primary border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Action Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    You have been assigned to this job. Please accept or decline the assignment.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => acceptJobMutation.mutate()}
                      disabled={acceptJobMutation.isPending || declineJobMutation.isPending}
                      className="flex-1"
                      data-testid="button-accept-job"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept Job
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setDeclineDialogOpen(true)}
                      disabled={acceptJobMutation.isPending || declineJobMutation.isPending}
                      className="flex-1"
                      data-testid="button-decline-job"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : job.partnerStatus === "accepted" ? (
              <>
                <Card className="border-green-500 border-2">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">You have accepted this job</span>
                      {job.partnerRespondedAt && (
                        <span className="text-sm text-muted-foreground ml-auto">
                          {new Date(job.partnerRespondedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <Link href={`/partner-portal/quotes/new?jobId=${job.id}`}>
                        <Button variant="outline" className="w-full" data-testid="button-create-quote">
                          <FileText className="w-4 h-4 mr-2" />
                          Create Quote
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setRequestSurveyDialogOpen(true)}
                        data-testid="button-request-survey"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Book Survey
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      Create a quote for this job or request a survey visit with the client.
                    </p>
                  </CardContent>
                </Card>
              </>
            ) : job.partnerStatus === "declined" ? (
              <Card className="border-red-500 border-2">
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <XCircle className="w-5 h-5" />
                    <span className="font-medium">You declined this job</span>
                    {job.partnerRespondedAt && (
                      <span className="text-sm text-muted-foreground ml-auto">
                        {new Date(job.partnerRespondedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {job.partnerDeclineReason && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Reason: {job.partnerDeclineReason}
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Job Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    {PIPELINE_STAGES.map((stage, index) => {
                      const isCompleted = index < currentStageIndex;
                      const isCurrent = index === currentStageIndex;
                      return (
                        <div 
                          key={stage} 
                          className="flex flex-col items-center flex-1"
                          title={stage}
                        >
                          <div className={`
                            w-4 h-4 md:w-6 md:h-6 rounded-full flex items-center justify-center
                            ${isCompleted ? 'bg-green-500 text-white' : 
                              isCurrent ? 'bg-primary text-white' : 
                              'bg-muted text-muted-foreground'}
                          `}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" />
                            ) : (
                              <Circle className="w-3 h-3 md:w-4 md:h-4" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${(currentStageIndex / (PIPELINE_STAGES.length - 1)) * 100}%` }}
                    />
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    Stage {currentStageIndex + 1} of {PIPELINE_STAGES.length}: {getStageLabel(job.status)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Callout Section - Show if assigned to this partner and not resolved */}
            {emergencyCallout && (emergencyCallout.status === "assigned" || emergencyCallout.status === "in_progress") && (
              <Card className="border-red-500 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                    <Siren className="w-5 h-5" />
                    Emergency Callout
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-md bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm">
                    You have been assigned to this emergency callout.
                  </div>
                  <div className="p-3 rounded-md bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-sm flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Reminder:</strong> Collect full payment from client. You will owe CCC a 20% callout fee surcharge upon completion.
                    </span>
                  </div>
                  <Button
                    onClick={() => setCompleteDialogOpen(true)}
                    className="w-full"
                    data-testid="button-complete-emergency"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Complete & Submit Payment
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Show completed emergency info */}
            {emergencyCallout && emergencyCallout.status === "resolved" && (
              <Card className="border-green-500 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    Emergency Completed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 rounded-md bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm">
                    This emergency callout has been completed.
                    {emergencyCallout.totalCollected && (
                      <div className="mt-2">
                        <strong>Payment collected:</strong> £{parseFloat(emergencyCallout.totalCollected).toFixed(2)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {job.contact && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Client Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Show notice when limited info is displayed (before acceptance) */}
                  {job.partnerStatus !== "accepted" && (
                    <div className="p-3 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-sm mb-4 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Limited information:</strong> Full client details (phone, email, address) will be available after you accept this job.
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{job.contact.name}</span>
                  </div>
                  {job.contact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${job.contact.phone}`} className="text-primary hover:underline">
                        {job.contact.phone}
                      </a>
                    </div>
                  )}
                  {job.contact.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a href={`mailto:${job.contact.email}`} className="text-primary hover:underline">
                        {job.contact.email}
                      </a>
                    </div>
                  )}
                  {(job.contact.address || job.contact.postcode) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {job.contact.address && <>{job.contact.address}, </>}
                        {job.contact.postcode}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {job.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{job.description}</p>
                </CardContent>
              </Card>
            )}

            {quoteItems && quoteItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Quote / Estimate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium">Description</th>
                          <th className="text-right p-3 font-medium w-16">Qty</th>
                          <th className="text-right p-3 font-medium w-24">Price</th>
                          <th className="text-right p-3 font-medium w-24">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {quoteItems.map((item) => (
                          <tr key={item.id}>
                            <td className="p-3">{item.description}</td>
                            <td className="p-3 text-right font-mono text-muted-foreground">{item.quantity}</td>
                            <td className="p-3 text-right font-mono text-muted-foreground">£{parseFloat(item.unitPrice).toFixed(2)}</td>
                            <td className="p-3 text-right font-mono font-medium">£{parseFloat(item.lineTotal).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 text-right">
                    <span className="font-semibold text-lg">
                      Total: £{quoteItems.reduce((sum, item) => sum + parseFloat(item.lineTotal), 0).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {jobNotes && jobNotes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Notes from Admin
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {jobNotes.map((note) => (
                        <div 
                          key={note.id} 
                          className="p-3 rounded-lg bg-muted/50"
                          data-testid={`partner-note-${note.id}`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                          {note.attachments && note.attachments.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {note.attachments.map((att) => (
                                <a 
                                  key={att.id}
                                  href={att.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-primary hover:underline p-1 rounded bg-background"
                                  data-testid={`partner-attachment-${att.id}`}
                                >
                                  <Image className="w-3 h-3" />
                                  {att.fileName}
                                </a>
                              ))}
                            </div>
                          )}
                          <div className="mt-2 text-xs text-muted-foreground">
                            {note.createdAt && new Date(note.createdAt).toLocaleString()}
                          </div>
                        </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {job.tasks && job.tasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {job.tasks.map((task) => (
                      <div 
                        key={task.id} 
                        className="flex items-center gap-3 p-2 rounded-md bg-muted/50"
                      >
                        {task.status === "completed" ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                        <span className={task.status === "completed" ? "line-through text-muted-foreground" : ""}>
                          {task.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Emergency Complete Dialog */}
        <Dialog open={completeDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setCompleteDialogOpen(false);
            setTotalCollected("");
            setCompletionNotes("");
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Complete Emergency Callout
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-3 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm">
                <strong>Payment Reminder:</strong> You should have collected the full payment from the client before completing this callout.
              </div>
              
              <div className="space-y-2">
                <Label>Total Amount Collected from Client (£)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                  placeholder="e.g., 250.00"
                  value={totalCollected}
                  onChange={(e) => setTotalCollected(e.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-testid="input-total-collected"
                />
              </div>
              
              {totalCollected && parseFloat(totalCollected) > 0 && (
                <div className="p-3 rounded-md bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Total collected:</span>
                    <span className="font-medium">£{parseFloat(totalCollected).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>20% Callout Fee (owed to CCC):</span>
                    <span className="font-bold">£{(parseFloat(totalCollected) * 0.20).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-amber-300 dark:border-amber-700 pt-1 mt-1">
                    <span>Your Earnings:</span>
                    <span className="font-medium">£{(parseFloat(totalCollected) * 0.80).toFixed(2)}</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Completion Notes (Optional)</Label>
                <Textarea
                  placeholder="Any notes about the job..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="min-h-[80px]"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-testid="textarea-completion-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!totalCollected || parseFloat(totalCollected) <= 0) {
                    toast({ title: "Please enter the total amount collected", variant: "destructive" });
                    return;
                  }
                  if (emergencyCallout) {
                    completeMutation.mutate({
                      calloutId: emergencyCallout.id,
                      totalCollected: totalCollected,
                      completionNotes: completionNotes || undefined,
                    });
                  }
                }}
                disabled={completeMutation.isPending}
                data-testid="button-confirm-complete"
              >
                {completeMutation.isPending ? "Completing..." : "Complete & Submit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Decline Job Dialog */}
        <Dialog open={declineDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setDeclineDialogOpen(false);
            setDeclineReason("");
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Decline Job Assignment
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to decline this job? Please provide a reason to help the admin understand why.
              </p>
              <div className="space-y-2">
                <Label>Reason for Declining (Optional)</Label>
                <Textarea
                  placeholder="e.g., Schedule conflict, outside my area, not my trade..."
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
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
                onClick={() => declineJobMutation.mutate(declineReason)}
                disabled={declineJobMutation.isPending}
                data-testid="button-confirm-decline"
              >
                {declineJobMutation.isPending ? "Declining..." : "Decline Job"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Request Survey Dialog */}
        <Dialog open={requestSurveyDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setRequestSurveyDialogOpen(false);
            setSurveyPreferredDate("");
            setSurveyPreferredTime("");
            setSurveyNotes("");
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Book Survey Visit
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Request a survey visit with the client to assess the job requirements.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preferred Date</Label>
                  <Input
                    type="date"
                    value={surveyPreferredDate}
                    onChange={(e) => setSurveyPreferredDate(e.target.value)}
                    data-testid="input-survey-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preferred Time</Label>
                  <Input
                    type="time"
                    value={surveyPreferredTime}
                    onChange={(e) => setSurveyPreferredTime(e.target.value)}
                    data-testid="input-survey-time"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Any specific requirements or access instructions..."
                  value={surveyNotes}
                  onChange={(e) => setSurveyNotes(e.target.value)}
                  className="min-h-[80px]"
                  data-testid="textarea-survey-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRequestSurveyDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => requestSurveyMutation.mutate({
                  preferredDate: surveyPreferredDate || undefined,
                  preferredTime: surveyPreferredTime || undefined,
                  notes: surveyNotes || undefined,
                })}
                disabled={requestSurveyMutation.isPending}
                data-testid="button-confirm-survey"
              >
                {requestSurveyMutation.isPending ? "Requesting..." : "Request Survey"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
